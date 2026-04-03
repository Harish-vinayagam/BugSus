/**
 * socket.ts — single module-level Socket.IO instance.
 *
 * ALL socket.on() listeners live here, at module scope — registered ONCE when
 * the JS module is first imported and NEVER torn down by React lifecycle events.
 * React registers its state-setter callbacks via `registerHandlers()`.
 *
 * This eliminates the "event arrived during useEffect cleanup" race that caused
 * the room-creation hang.
 */
import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types';
import type {
  Player,
  RoleAssignedPayload,
  CategorySelectedPayload,
  CategoryVoteUpdatePayload,
  MeetingStartedPayload,
  EjectionVoteUpdatePayload,
  VoteResultPayload,
  GameOverPayload,
  NextRoundStartedPayload,
  TaskProgressUpdatePayload,
  CodeSyncedPayload,
  ChatBroadcastPayload,
  TaskCompletionBroadcastPayload,
  TimerSyncPayload,
} from '../../../shared/types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

// ── Socket singleton ─────────────────────────────────────────────────────────
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
  autoConnect: false,
  reconnectionAttempts: 15,        // try up to 15 reconnect attempts
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10_000,    // max delay between retries (increased from 5s)
  timeout: 40_000,                 // 40s timeout (increased from 20s for cold starts)
  transports: ['websocket', 'polling'],
});

// ── Page visibility handler: resume socket when tab becomes visible ───────────
let visibilityHandler: (() => void) | null = null;

const setupVisibilityHandler = () => {
  if (visibilityHandler) return; // already setup
  
  visibilityHandler = () => {
    if (document.hidden) {
      console.log('[socket] tab hidden — will reconnect when visible');
    } else {
      console.log('[socket] tab visible — reconnecting...');
      // Reconnect if we were disconnected while hidden
      if (!socket.connected) {
        socket.connect();
      }
    }
  };
  
  document.addEventListener('visibilitychange', visibilityHandler);
};

setupVisibilityHandler();

// ── Pending-emit queue (module level — immune to React) ──────────────────────
type PendingAction =
  | { type: 'create'; username: string; maxPlayers: 4 | 6 | 8 }
  | { type: 'join'; roomId: string; username: string };

let pending: PendingAction | null = null;

const flushPending = () => {
  if (!pending) return;
  const action = pending;
  pending = null;
  if (action.type === 'create') {
    console.log('[socket] emit create_room', action.username, action.maxPlayers);
    socket.emit('create_room', { username: action.username, maxPlayers: action.maxPlayers });
  } else {
    console.log('[socket] emit join_room', action.username, action.roomId);
    socket.emit('join_room', { roomId: action.roomId, username: action.username });
  }
};

export const queueCreate = (username: string, maxPlayers: 4 | 6 | 8) => {
  pending = { type: 'create', username, maxPlayers };
  if (socket.connected) flushPending();
  else socket.connect();
};

export const queueJoin = (roomId: string, username: string) => {
  pending = { type: 'join', roomId, username };
  if (socket.connected) flushPending();
  else socket.connect();
};

// ── Handler registry ─────────────────────────────────────────────────────────
// useRoom registers its state-setter callbacks here once on mount.
// The module-level socket.on calls below just forward to whatever is registered.
export interface SocketHandlers {
  onConnect:                  () => void;
  onConnectError:             (err: Error) => void;
  onDisconnect:               (reason: string) => void;
  onRoomCreated:              (p: { roomId: string; players: Player[]; maxPlayers: number }) => void;
  onRoomJoined:               (p: { roomId: string; players: Player[]; maxPlayers: number }) => void;
  onPlayerListUpdate:         (p: { roomId: string; players: Player[] }) => void;
  onRoomError:                (p: { message: string }) => void;
  onGameStarted:              (p: { players: Player[]; round: number; categoryVoteEndsAt: number }) => void;
  onCategoryVoteUpdate:       (p: CategoryVoteUpdatePayload) => void;
  onCategorySelected:         (p: CategorySelectedPayload) => void;
  onRoleAssigned:             (p: RoleAssignedPayload) => void;
  onTimerSync:                (p: TimerSyncPayload) => void;
  onMeetingStarted:           (p: MeetingStartedPayload) => void;
  onEjectionVoteUpdate:       (p: EjectionVoteUpdatePayload) => void;
  onVoteResult:               (p: VoteResultPayload) => void;
  onTaskProgressUpdate:       (p: TaskProgressUpdatePayload) => void;
  onGameOver:                 (p: GameOverPayload) => void;
  onNextRoundStarted:         (p: NextRoundStartedPayload) => void;
  onCodeSynced:               (p: CodeSyncedPayload) => void;
  onChatBroadcast:            (p: ChatBroadcastPayload) => void;
  onTaskCompletionBroadcast:  (p: TaskCompletionBroadcastPayload) => void;
}

const noop = () => {};
let handlers: SocketHandlers = {
  onConnect:                  noop,
  onConnectError:             noop,
  onDisconnect:               noop,
  onRoomCreated:              noop,
  onRoomJoined:               noop,
  onPlayerListUpdate:         noop,
  onRoomError:                noop,
  onGameStarted:              noop,
  onCategoryVoteUpdate:       noop,
  onCategorySelected:         noop,
  onRoleAssigned:             noop,
  onTimerSync:                noop,
  onMeetingStarted:           noop,
  onEjectionVoteUpdate:       noop,
  onVoteResult:               noop,
  onTaskProgressUpdate:       noop,
  onGameOver:                 noop,
  onNextRoundStarted:         noop,
  onCodeSynced:               noop,
  onChatBroadcast:            noop,
  onTaskCompletionBroadcast:  noop,
};

// ── Event buffer: replay critical room events if they arrive before React mounts ──
// React's useEffect runs AFTER paint — socket events can arrive in that gap.
// We buffer the last room_created / room_joined / room_error payload and replay
// it immediately when registerHandlers() is called.
type BufferedEvent =
  | { event: 'room_created'; payload: { roomId: string; players: Player[]; maxPlayers: number } }
  | { event: 'room_joined';  payload: { roomId: string; players: Player[]; maxPlayers: number } }
  | { event: 'room_error';   payload: { message: string } };

let bufferedRoomEvent: BufferedEvent | null = null;

/** Called by useRoom on mount to wire its React state setters. */
export const registerHandlers = (h: SocketHandlers) => {
  handlers = h;
  // Replay any buffered room event that arrived before this hook mounted
  if (bufferedRoomEvent) {
    const evt = bufferedRoomEvent;
    bufferedRoomEvent = null;
    console.log('[socket] replaying buffered event:', evt.event);
    if (evt.event === 'room_created') handlers.onRoomCreated(evt.payload);
    else if (evt.event === 'room_joined') handlers.onRoomJoined(evt.payload);
    else if (evt.event === 'room_error') handlers.onRoomError(evt.payload);
  }
};

// ── Module-level listeners — registered ONCE, never removed ─────────────────
socket.on('connect', () => {
  console.log('[socket] connected', socket.id);
  flushPending();
  handlers.onConnect();
});
socket.on('connect_error', (err) => {
  console.error('[socket] connect_error', err.message);
  pending = null;
  handlers.onConnectError(err);
});
socket.on('disconnect', (reason) => {
  console.log('[socket] disconnect', reason);
  handlers.onDisconnect(reason);
});
socket.on('room_created', (p) => {
  console.log('[socket] room_created', p.roomId);
  if (handlers.onRoomCreated === noop) {
    console.log('[socket] buffering room_created (handlers not yet registered)');
    bufferedRoomEvent = { event: 'room_created', payload: p };
  } else {
    handlers.onRoomCreated(p);
  }
});
socket.on('room_joined', (p) => {
  console.log('[socket] room_joined', p.roomId);
  if (handlers.onRoomJoined === noop) {
    console.log('[socket] buffering room_joined (handlers not yet registered)');
    bufferedRoomEvent = { event: 'room_joined', payload: p };
  } else {
    handlers.onRoomJoined(p);
  }
});
socket.on('room_error', (p) => {
  console.warn('[socket] room_error', p.message);
  if (handlers.onRoomError === noop) {
    bufferedRoomEvent = { event: 'room_error', payload: p };
  } else {
    handlers.onRoomError(p);
  }
});
socket.on('player_list_update',        (p) => handlers.onPlayerListUpdate(p));
socket.on('game_started',              (p) => handlers.onGameStarted(p));
socket.on('category_vote_update',      (p) => handlers.onCategoryVoteUpdate(p));
socket.on('category_selected',         (p) => handlers.onCategorySelected(p));
socket.on('role_assigned',             (p) => handlers.onRoleAssigned(p));
socket.on('timer_sync',                (p) => handlers.onTimerSync(p));
socket.on('meeting_started',           (p) => handlers.onMeetingStarted(p));
socket.on('ejection_vote_update',      (p) => handlers.onEjectionVoteUpdate(p));
socket.on('vote_result',               (p) => handlers.onVoteResult(p));
socket.on('task_progress_update',      (p) => handlers.onTaskProgressUpdate(p));
socket.on('game_over',                 (p) => handlers.onGameOver(p));
socket.on('next_round_started',        (p) => handlers.onNextRoundStarted(p));
socket.on('code_synced',               (p) => handlers.onCodeSynced(p));
socket.on('chat_broadcast',            (p) => handlers.onChatBroadcast(p));
socket.on('task_completion_broadcast', (p) => handlers.onTaskCompletionBroadcast(p));

// ── Render free-tier wake-up ─────────────────────────────────────────────────
let wakeAttempts = 0;
const wakeServer = () => {
  fetch(`${SERVER_URL}/health`, { cache: 'no-store' })
    .then((r) => { if (r.ok) console.log('[wake] server up'); else throw new Error('non-ok'); })
    .catch(() => { if (++wakeAttempts < 20) setTimeout(wakeServer, 3000); });
};
wakeServer();
