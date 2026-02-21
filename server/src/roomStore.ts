import type { Player, Room } from '../../shared/types';

// In-memory store: roomId → Room
const rooms = new Map<string, Room>();

/** Generate a unique 6-character room ID (e.g. "XK92TR") */
const generateRoomId = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  do {
    id = Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  } while (rooms.has(id)); // ensure uniqueness
  return id;
};

/** Create a new room with the given host player. Returns the new room. */
export const createRoom = (player: Player): Room => {
  const roomId = generateRoomId();
  const room: Room = { roomId, players: [player] };
  rooms.set(roomId, room);
  return room;
};

/** Add a player to an existing room. Returns the room or null if not found. */
export const joinRoom = (roomId: string, player: Player): Room | null => {
  const room = rooms.get(roomId);
  if (!room) return null;
  // Prevent duplicate socket IDs
  if (!room.players.find((p) => p.id === player.id)) {
    room.players.push(player);
  }
  return room;
};

/**
 * Remove a player (by socket ID) from whichever room they are in.
 * Returns the updated room, or null if the room was deleted (became empty).
 */
export const removePlayer = (socketId: string): Room | null => {
  for (const [roomId, room] of rooms) {
    const idx = room.players.findIndex((p) => p.id === socketId);
    if (idx === -1) continue;

    room.players.splice(idx, 1);

    if (room.players.length === 0) {
      rooms.delete(roomId);
      return null; // room deleted
    }
    return room; // room still alive with updated list
  }
  return null; // player wasn't in any room
};

/** Look up a room by ID. */
export const getRoom = (roomId: string): Room | undefined =>
  rooms.get(roomId);
