import type { Player, Room, GamePhase } from './types';

const rooms = new Map<string, Room>();

// ── Helpers ───────────────────────────────────────────────────────────────────

const generateRoomId = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  do {
    id = Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  } while (rooms.has(id));
  return id;
};

const makeRoom = (hostPlayer: Player): Room => ({
  roomId: generateRoomId(),
  players: [hostPlayer],
  hostId: hostPlayer.id,
  phase: 'lobby',
  round: 1,
  category: '',
  internId: '',
  categoryVotes: {},
  ejectionVotes: {},
  tasksCompleted: {},
  winner: null,
});

// ── CRUD ──────────────────────────────────────────────────────────────────────

export const createRoom = (player: Player): Room => {
  const room = makeRoom(player);
  rooms.set(room.roomId, room);
  return room;
};

export const joinRoom = (roomId: string, player: Player): Room | null => {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (!room.players.find((p) => p.id === player.id)) {
    room.players.push(player);
  }
  return room;
};

export const getRoom = (roomId: string): Room | undefined => rooms.get(roomId);

export const getRoomByPlayerId = (socketId: string): Room | undefined => {
  for (const room of rooms.values()) {
    if (room.players.find((p) => p.id === socketId)) return room;
  }
  return undefined;
};

export const removePlayer = (socketId: string): Room | null => {
  for (const [roomId, room] of rooms) {
    const idx = room.players.findIndex((p) => p.id === socketId);
    if (idx === -1) continue;
    room.players.splice(idx, 1);
    if (room.players.length === 0) {
      rooms.delete(roomId);
      return null;
    }
    // If host left, promote next player
    if (room.hostId === socketId && room.players.length > 0) {
      room.hostId = room.players[0].id;
    }
    return room;
  }
  return null;
};

// ── Game flow ─────────────────────────────────────────────────────────────────

export const setPhase = (roomId: string, phase: GamePhase): Room | null => {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.phase = phase;
  return room;
};

/** Assign the intern randomly; returns the assigned internId */
export const assignRoles = (roomId: string): { room: Room; internId: string } | null => {
  const room = rooms.get(roomId);
  if (!room) return null;
  const alive = room.players.filter((p) => p.alive);
  const idx = Math.floor(Math.random() * alive.length);
  room.internId = alive[idx].id;
  room.phase = 'role_reveal';
  return { room, internId: room.internId };
};

/** Record a category vote. Returns updated tally + whether all alive players voted. */
export const recordCategoryVote = (
  roomId: string,
  socketId: string,
  category: string
): { tally: Record<string, number>; allVoted: boolean; winner: string } | null => {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.categoryVotes[socketId] = category;

  // Build tally
  const tally: Record<string, number> = {};
  for (const cat of Object.values(room.categoryVotes)) {
    tally[cat] = (tally[cat] ?? 0) + 1;
  }

  const alivePlayers = room.players.filter((p) => p.alive);
  const allVoted = alivePlayers.every((p) => room.categoryVotes[p.id] !== undefined);

  // Determine winner (most votes; tie-break: random among tied)
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const maxCount = sorted[0][1];
  const tied = sorted.filter(([, c]) => c === maxCount).map(([cat]) => cat);
  const winner = tied[Math.floor(Math.random() * tied.length)];

  if (allVoted) {
    room.category = winner;
    room.phase = 'role_reveal';
  }

  return { tally, allVoted, winner };
};

/** Record an ejection vote. Returns tally + whether all alive players voted. */
export const recordEjectionVote = (
  roomId: string,
  socketId: string,
  targetId: string | 'SKIP'
): { tally: Record<string, number>; allVoted: boolean } | null => {
  const room = rooms.get(roomId);
  if (!room) return null;

  room.ejectionVotes[socketId] = targetId;

  const tally: Record<string, number> = {};
  for (const [, t] of Object.entries(room.ejectionVotes)) {
    if (t !== 'SKIP') tally[t] = (tally[t] ?? 0) + 1;
  }

  const alivePlayers = room.players.filter((p) => p.alive);
  const allVoted = alivePlayers.every((p) => room.ejectionVotes[p.id] !== undefined);

  return { tally, allVoted };
};

/** Resolve ejection: find who gets ejected (most votes), mark them not-alive.
 *  Returns ejection result info. */
export const resolveEjection = (roomId: string): {
  ejectedId: string | null;
  ejectedWasIntern: boolean;
  alivePlayers: Player[];
} | null => {
  const room = rooms.get(roomId);
  if (!room) return null;

  const tally: Record<string, number> = {};
  for (const [, t] of Object.entries(room.ejectionVotes)) {
    if (t !== 'SKIP') tally[t] = (tally[t] ?? 0) + 1;
  }

  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  let ejectedId: string | null = null;

  if (sorted.length > 0 && sorted[0][1] > 0) {
    ejectedId = sorted[0][0];
    const p = room.players.find((p) => p.id === ejectedId);
    if (p) p.alive = false;
  }

  // Clear votes for next round
  room.ejectionVotes = {};

  const ejectedWasIntern = ejectedId === room.internId;
  const alivePlayers = room.players.filter((p) => p.alive);

  return { ejectedId, ejectedWasIntern, alivePlayers };
};

/** Check win conditions. Returns winner or null if game continues. */
export const checkWinCondition = (roomId: string): 'engineers' | 'intern' | null => {
  const room = rooms.get(roomId);
  if (!room) return null;

  const alive = room.players.filter((p) => p.alive);
  const intern = alive.find((p) => p.id === room.internId);

  // Intern was ejected → engineers win
  if (!intern) return 'engineers';

  // Intern outnumbers/equals engineers → intern wins
  const engineers = alive.filter((p) => p.id !== room.internId);
  if (engineers.length <= 1) return 'intern';

  // Round 3 ended without ejecting intern → intern wins
  if (room.round >= 3) return 'intern';

  return null;
};

export const advanceRound = (roomId: string): Room | null => {
  const room = rooms.get(roomId);
  if (!room) return null;
  room.round += 1;
  room.phase = 'category_vote';
  room.categoryVotes = {};
  room.ejectionVotes = {};
  return room;
};

export const recordTaskProgress = (roomId: string, socketId: string, count: number): void => {
  const room = rooms.get(roomId);
  if (!room) return;
  room.tasksCompleted[socketId] = count;
};
