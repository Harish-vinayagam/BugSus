// ─────────────────────────────────────────────────────────────────────────────
// Shared Socket.IO event types — imported by both server and client.
// ─────────────────────────────────────────────────────────────────────────────

export interface Player {
  id: string;       // socket.id
  username: string;
  alive: boolean;
}

export type GamePhase =
  | 'lobby'
  | 'category_vote'
  | 'role_reveal'
  | 'game'
  | 'meeting'
  | 'summary'
  | 'final';

export interface Room {
  roomId: string;
  players: Player[];
  hostId: string;
  phase: GamePhase;
  round: number;
  category: string;
  internId: string;
  categoryVotes: Record<string, string>;   // socketId → category
  ejectionVotes: Record<string, string>;   // socketId → targetId | 'SKIP'
  tasksCompleted: Record<string, number>;  // socketId → count
  winner: 'engineers' | 'intern' | null;
}

// ── Payloads: Client → Server ─────────────────────────────────────────────────

export interface CreateRoomPayload   { username: string }
export interface JoinRoomPayload     { roomId: string; username: string }
export interface StartGamePayload    { roomId: string }
export interface CategoryVotePayload { roomId: string; category: string }
export interface StartMeetingPayload { roomId: string }
export interface CastVotePayload     { roomId: string; targetId: string | 'SKIP' }
export interface TaskProgressPayload { roomId: string; count: number }
export interface NextRoundPayload    { roomId: string }

// ── Payloads: Server → Client ─────────────────────────────────────────────────

export interface RoomCreatedPayload      { roomId: string; players: Player[] }
export interface RoomJoinedPayload       { roomId: string; players: Player[] }
export interface PlayerListUpdatePayload { roomId: string; players: Player[] }
export interface RoomErrorPayload        { message: string }

export interface GameStartedPayload {
  players: Player[];
  round: number;
}

export interface CategoryVoteUpdatePayload {
  votes: Record<string, number>;  // category → count
  totalPlayers: number;
}

export interface CategorySelectedPayload {
  category: string;
  votes: Record<string, number>;
}

export interface RoleAssignedPayload {
  role: 'engineer' | 'intern';
  round: number;
}

export interface MeetingStartedPayload {
  players: Player[];
  triggeredBy: string;
}

export interface EjectionVoteUpdatePayload {
  votes: Record<string, number>;  // targetId → count
  totalVoters: number;
}

export interface VoteResultPayload {
  ejectedId: string | null;
  ejectedUsername: string | null;
  ejectedWasIntern: boolean;
  internUsername: string;
  alivePlayers: Player[];
}

export interface TaskProgressUpdatePayload {
  playerId: string;
  username: string;
  count: number;
}

export interface GameOverPayload {
  winner: 'engineers' | 'intern';
  internUsername: string;
  reason: string;
}

export interface NextRoundStartedPayload {
  round: number;
  players: Player[];
}

// ── Typed event maps ──────────────────────────────────────────────────────────

export interface ClientToServerEvents {
  create_room:   (payload: CreateRoomPayload)    => void;
  join_room:     (payload: JoinRoomPayload)      => void;
  start_game:    (payload: StartGamePayload)     => void;
  category_vote: (payload: CategoryVotePayload)  => void;
  start_meeting: (payload: StartMeetingPayload)  => void;
  cast_vote:     (payload: CastVotePayload)      => void;
  task_progress: (payload: TaskProgressPayload)  => void;
  next_round:    (payload: NextRoundPayload)     => void;
}

export interface ServerToClientEvents {
  room_created:          (payload: RoomCreatedPayload)          => void;
  room_joined:           (payload: RoomJoinedPayload)           => void;
  player_list_update:    (payload: PlayerListUpdatePayload)     => void;
  room_error:            (payload: RoomErrorPayload)            => void;
  game_started:          (payload: GameStartedPayload)          => void;
  category_vote_update:  (payload: CategoryVoteUpdatePayload)   => void;
  category_selected:     (payload: CategorySelectedPayload)     => void;
  role_assigned:         (payload: RoleAssignedPayload)         => void;
  meeting_started:       (payload: MeetingStartedPayload)       => void;
  ejection_vote_update:  (payload: EjectionVoteUpdatePayload)   => void;
  vote_result:           (payload: VoteResultPayload)           => void;
  task_progress_update:  (payload: TaskProgressUpdatePayload)   => void;
  game_over:             (payload: GameOverPayload)             => void;
  next_round_started:    (payload: NextRoundStartedPayload)     => void;
}
