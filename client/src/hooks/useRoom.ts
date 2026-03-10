import { useState, useEffect, useCallback, useRef } from 'react';
import { socket, queueCreate, queueJoin, registerHandlers } from '@/lib/socket';
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

export type RoomStatus =
  | 'idle'
  | 'connecting'
  | 'creating'
  | 'joining'
  | 'in_room'
  | 'error';

export interface UseRoomReturn {
  status: RoomStatus;
  roomId: string;
  players: Player[];
  error: string;
  createRoom: (username: string) => void;
  joinRoom: (roomId: string, username: string) => void;
  disconnect: () => void;
  startGame: () => void;
  castCategoryVote: (category: string) => void;
  triggerMeeting: () => void;
  castEjectionVote: (targetId: string | 'SKIP') => void;
  reportTaskProgress: (count: number) => void;
  broadcastCode: (code: string, taskId: string) => void;
  broadcastTaskCompleted: (taskId: string) => void;
  sendChat: (text: string) => void;
  gamePhase: string;
  round: number;
  myRole: 'engineer' | 'intern' | null;
  myTaskIds: string[];
  categoryVotes: Record<string, number>;
  selectedCategory: string;
  meetingPlayers: Player[];
  meetingTriggeredBy: string;
  ejectionVotes: Record<string, number>;
  voteResult: VoteResultPayload | null;
  taskProgress: Record<string, number>;
  gameOver: GameOverPayload | null;
  sharedCode: string;
  sharedCodeTaskId: string;
  sharedCodeSender: string;
  completedTaskIds: string[];
  chatMessages: { username: string; text: string }[];
  /** Server epoch-ms when the current category-vote window closes (0 = not set) */
  categoryVoteEndsAt: number;
  /** Server epoch-ms when the current game coding phase ends (0 = not set) */
  gameTimerEndsAt: number;
}

export const useRoom = (): UseRoomReturn => {
  const [status, setStatus]   = useState<RoomStatus>('idle');
  const [roomId, setRoomId]   = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError]     = useState('');

  const [gamePhase, setGamePhase]                   = useState('lobby');
  const [round, setRound]                           = useState(1);
  const [myRole, setMyRole]                         = useState<'engineer' | 'intern' | null>(null);
  const [myTaskIds, setMyTaskIds]                   = useState<string[]>([]);
  const [categoryVotes, setCategoryVotes]           = useState<Record<string, number>>({});
  const [selectedCategory, setSelectedCategory]     = useState('');
  const [meetingPlayers, setMeetingPlayers]         = useState<Player[]>([]);
  const [meetingTriggeredBy, setMeetingTriggeredBy] = useState('');
  const [ejectionVotes, setEjectionVotes]           = useState<Record<string, number>>({});
  const [voteResult, setVoteResult]                 = useState<VoteResultPayload | null>(null);
  const [taskProgress, setTaskProgress]             = useState<Record<string, number>>({});
  const [gameOver, setGameOver]                     = useState<GameOverPayload | null>(null);
  const [sharedCode, setSharedCode]                 = useState('');
  const [sharedCodeTaskId, setSharedCodeTaskId]     = useState('');
  const [sharedCodeSender, setSharedCodeSender]     = useState('');
  const [completedTaskIds, setCompletedTaskIds]     = useState<string[]>([]);
  const [chatMessages, setChatMessages]             = useState<{ username: string; text: string }[]>([]);
  const [categoryVoteEndsAt, setCategoryVoteEndsAt] = useState<number>(0);
  const [gameTimerEndsAt, setGameTimerEndsAt]       = useState<number>(0);

  const roomIdRef = useRef('');

  // ── Register module-level handlers once on mount ──────────────────────────
  // These callbacks are stored in socket.ts at module scope, so they are NEVER
  // lost during React re-renders or effect cleanup cycles.
  useEffect(() => {
    registerHandlers({
      onConnect: () => {
        setStatus((s) => (s === 'connecting' ? 'creating' : s));
      },
      onConnectError: (err) => {
        setStatus('error');
        setError('Could not reach server — ' + (err?.message ?? 'unknown'));
      },
      onDisconnect: () => {
        // keep existing status; reconnect loop will restore
      },
      onRoomCreated: (p) => {
        roomIdRef.current = p.roomId;
        setRoomId(p.roomId);
        setPlayers(p.players);
        setStatus('in_room');
      },
      onRoomJoined: (p) => {
        roomIdRef.current = p.roomId;
        setRoomId(p.roomId);
        setPlayers(p.players);
        setStatus('in_room');
      },
      onPlayerListUpdate: (p) => setPlayers(p.players),
      onRoomError: (p) => { setStatus('error'); setError(p.message); },
      onGameStarted: (p) => {
        setPlayers(p.players); setRound(p.round);
        setGamePhase('category_vote');
        setCategoryVotes({}); setSelectedCategory('');
        setVoteResult(null); setGameOver(null);
        setTaskProgress({}); setMyTaskIds([]);
        setCompletedTaskIds([]); setChatMessages([]);
        setCategoryVoteEndsAt(p.categoryVoteEndsAt);
      },
      onCategoryVoteUpdate: (p: CategoryVoteUpdatePayload) => setCategoryVotes(p.votes),
      onCategorySelected: (p: CategorySelectedPayload) => {
        setSelectedCategory(p.category);
        setCategoryVotes(p.votes);
        setGamePhase('role_reveal');
      },
      onRoleAssigned: (p: RoleAssignedPayload) => {
        setMyRole(p.role); setRound(p.round);
        setMyTaskIds(p.taskIds ?? []);
        setGamePhase('role_reveal');
        setGameTimerEndsAt(p.gameTimerEndsAt);
      },
      onMeetingStarted: (p: MeetingStartedPayload) => {
        setMeetingPlayers(p.players);
        setMeetingTriggeredBy(p.triggeredBy);
        setEjectionVotes({}); setVoteResult(null);
        setGamePhase('meeting');
      },
      onEjectionVoteUpdate: (p: EjectionVoteUpdatePayload) => setEjectionVotes(p.votes),
      onVoteResult: (p: VoteResultPayload) => {
        setVoteResult(p);
        setPlayers((prev) =>
          prev.map((pl) => ({ ...pl, alive: p.alivePlayers.some((a) => a.id === pl.id) }))
        );
        setGamePhase('summary');
      },
      onTaskProgressUpdate: (p: TaskProgressUpdatePayload) =>
        setTaskProgress((prev) => ({ ...prev, [p.username]: p.count })),
      onGameOver: (p: GameOverPayload) => { setGameOver(p); setGamePhase('final'); },
      onNextRoundStarted: (p: NextRoundStartedPayload) => {
        setRound(p.round); setPlayers(p.players);
        setCategoryVotes({}); setSelectedCategory('');
        setVoteResult(null); setEjectionVotes({});
        setSharedCode(''); setSharedCodeTaskId(''); setSharedCodeSender('');
        setMyTaskIds([]); setCompletedTaskIds([]); setChatMessages([]);
        setGamePhase('category_vote');
        setCategoryVoteEndsAt(p.categoryVoteEndsAt);
      },
      onCodeSynced: (p: CodeSyncedPayload) => {
        setSharedCode(p.code);
        setSharedCodeTaskId(p.taskId);
        setSharedCodeSender(p.senderName);
      },
      onTimerSync: (p: TimerSyncPayload) => {
        if (p.phase === 'category_vote') setCategoryVoteEndsAt(p.endsAt);
        if (p.phase === 'game') setGameTimerEndsAt(p.endsAt);
      },
      onChatBroadcast: (p: ChatBroadcastPayload) =>
        setChatMessages((prev) => [...prev, { username: p.username, text: p.text }]),
      onTaskCompletionBroadcast: (p: TaskCompletionBroadcastPayload) =>
        setCompletedTaskIds((prev) => (prev.includes(p.taskId) ? prev : [...prev, p.taskId])),
    });
  }, []); // runs once on mount — that's all we need

  // ── Actions ───────────────────────────────────────────────────────────────
  const createRoom = useCallback((username: string) => {
    setStatus('connecting'); setError('');
    queueCreate(username);
  }, []);

  const joinRoom = useCallback((rid: string, username: string) => {
    setStatus('connecting'); setError('');
    queueJoin(rid, username);
  }, []);

  const disconnect = useCallback(() => {
    socket.disconnect();
    roomIdRef.current = '';
    setStatus('idle'); setRoomId(''); setPlayers([]); setError('');
    setGamePhase('lobby'); setMyRole(null);
  }, []);

  const startGame = useCallback(() => {
    socket.emit('start_game', { roomId: roomIdRef.current });
  }, []);

  const castCategoryVote = useCallback((category: string) => {
    socket.emit('category_vote', { roomId: roomIdRef.current, category });
  }, []);

  const triggerMeeting = useCallback(() => {
    socket.emit('start_meeting', { roomId: roomIdRef.current });
  }, []);

  const castEjectionVote = useCallback((targetId: string | 'SKIP') => {
    socket.emit('cast_vote', { roomId: roomIdRef.current, targetId });
  }, []);

  const reportTaskProgress = useCallback((count: number) => {
    socket.emit('task_progress', { roomId: roomIdRef.current, count });
  }, []);

  const broadcastCode = useCallback((code: string, taskId: string) => {
    if (!roomIdRef.current) return;
    socket.emit('code_change', { roomId: roomIdRef.current, code, taskId });
  }, []);

  const broadcastTaskCompleted = useCallback((taskId: string) => {
    if (!roomIdRef.current) return;
    socket.emit('task_completed', { roomId: roomIdRef.current, taskId });
  }, []);

  const sendChat = useCallback((text: string) => {
    if (!roomIdRef.current || !text.trim()) return;
    socket.emit('chat_message', { roomId: roomIdRef.current, text: text.trim() });
  }, []);

  return {
    status, roomId, players, error,
    createRoom, joinRoom, disconnect,
    startGame, castCategoryVote, triggerMeeting, castEjectionVote,
    reportTaskProgress, broadcastCode, broadcastTaskCompleted, sendChat,
    gamePhase, round, myRole, myTaskIds,
    categoryVotes, selectedCategory,
    meetingPlayers, meetingTriggeredBy,
    ejectionVotes, voteResult,
    taskProgress, gameOver,
    sharedCode, sharedCodeTaskId, sharedCodeSender,
    completedTaskIds,
    chatMessages,
    categoryVoteEndsAt,
    gameTimerEndsAt,
  };
};
