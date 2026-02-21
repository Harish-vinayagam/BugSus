// ─────────────────────────────────────────────────────────────────────────────
// Shared Socket.IO event types — imported by both server and client.
// ─────────────────────────────────────────────────────────────────────────────

export interface Player {
  id: string;       // socket.id
  username: string;
}

export interface Room {
  roomId: string;
  players: Player[];
}

// ── Payloads sent FROM the client ────────────────────────────────────────────

export interface CreateRoomPayload {
  username: string;
}

export interface JoinRoomPayload {
  roomId: string;
  username: string;
}

// ── Payloads sent FROM the server ────────────────────────────────────────────

export interface RoomCreatedPayload {
  roomId: string;
  players: Player[];
}

export interface RoomJoinedPayload {
  roomId: string;
  players: Player[];
}

export interface PlayerListUpdatePayload {
  roomId: string;
  players: Player[];
}

export interface RoomErrorPayload {
  message: string;
}

// ── Typed event maps (used by Socket.IO generics) ────────────────────────────

/** Events the SERVER listens for (emitted by clients) */
export interface ClientToServerEvents {
  create_room: (payload: CreateRoomPayload) => void;
  join_room:   (payload: JoinRoomPayload)   => void;
}

/** Events the CLIENT listens for (emitted by server) */
export interface ServerToClientEvents {
  room_created:        (payload: RoomCreatedPayload)       => void;
  room_joined:         (payload: RoomJoinedPayload)        => void;
  player_list_update:  (payload: PlayerListUpdatePayload)  => void;
  room_error:          (payload: RoomErrorPayload)         => void;
}
