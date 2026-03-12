import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from './types';
import {
  createRoom,
  joinRoom,
  removePlayer,
  getRoomByPlayerId,
  getRoom,
  assignRoles,
  recordCategoryVote,
  recordEjectionVote,
  resolveEjection,
  checkWinCondition,
  advanceRound,
  recordTaskProgress,
  setPhase,
} from './roomStore';
import { pickTaskIds } from './taskPicker';

type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;
type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Auto-advance category vote after 20s if not everyone voted yet
const CATEGORY_VOTE_TIMEOUT_MS = 20_000;
// Auto-advance ejection vote after 30s
const EJECTION_VOTE_TIMEOUT_MS = 30_000;
// Game coding phase duration (must match client's original 180s)
const GAME_TIMER_MS = 180_000;
// Role-reveal screen duration before game actually starts
const ROLE_REVEAL_DELAY_MS = 5_000;

const categoryVoteTimers = new Map<string, ReturnType<typeof setTimeout>>();
const ejectionVoteTimers = new Map<string, ReturnType<typeof setTimeout>>();

const clearTimer = (map: Map<string, ReturnType<typeof setTimeout>>, roomId: string) => {
  const t = map.get(roomId);
  if (t) { clearTimeout(t); map.delete(roomId); }
};

/** Broadcast the category result and trigger role assignment */
const finaliseCategoryVote = (io: GameServer, roomId: string) => {
  clearTimer(categoryVoteTimers, roomId);
  const room = getRoom(roomId);
  if (!room) return;

  // Tally current votes to find winner (may be called early if all voted)
  const tally: Record<string, number> = {};
  for (const cat of Object.values(room.categoryVotes)) {
    tally[cat] = (tally[cat] ?? 0) + 1;
  }
  if (Object.keys(tally).length === 0) tally['FRONTEND'] = 1; // fallback

  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const maxCount = sorted[0][1];
  const tied = sorted.filter(([, c]) => c === maxCount).map(([cat]) => cat);
  const winner = tied[Math.floor(Math.random() * tied.length)];

  room.category = winner;
  room.phase = 'role_reveal';

  io.to(roomId).emit('category_selected', { category: winner, votes: tally });

  // Pick task IDs ONCE for this round — ALL players (engineer + intern) get the same tasks.
  // The intern's goal is to submit subtly wrong solutions on the same problems.
  room.engineerTaskIds = pickTaskIds(winner, 'engineer', 10);
  room.internTaskIds   = room.engineerTaskIds; // same tasks, intern just sabotages them

  // Game timer starts after the role-reveal screen clears (ROLE_REVEAL_DELAY_MS).
  // We broadcast that deadline with role_assigned so every client has the same endsAt.
  const gameTimerEndsAt = Date.now() + ROLE_REVEAL_DELAY_MS + GAME_TIMER_MS;

  // Assign intern and send each player their private role + shared task list
  const result = assignRoles(roomId);
  if (!result) return;

  const internId = result.internId;
  room.players.forEach((p) => {
    const role: 'engineer' | 'intern' = p.id === internId ? 'intern' : 'engineer';
    // Everyone gets the same taskIds — intern just has a different role label
    io.to(p.id).emit('role_assigned', { role, round: room.round, taskIds: room.engineerTaskIds, gameTimerEndsAt });
  });

  // Advance phase to 'game' so the meeting guard doesn't block calls
  room.phase = 'game';
};

/** Broadcast ejection result and check win condition */
const finaliseEjectionVote = (io: GameServer, roomId: string) => {
  clearTimer(ejectionVoteTimers, roomId);
  const room = getRoom(roomId);
  if (!room) return;

  const result = resolveEjection(roomId);
  if (!result) return;

  const { ejectedId, ejectedWasIntern, alivePlayers } = result;
  const ejectedPlayer = room.players.find((p) => p.id === ejectedId) ?? null;
  const internPlayer  = room.players.find((p) => p.id === room.internId);

  io.to(roomId).emit('vote_result', {
    ejectedId:       ejectedId,
    ejectedUsername: ejectedPlayer?.username ?? null,
    ejectedWasIntern,
    internUsername:  internPlayer?.username ?? '???',
    alivePlayers,
  });

  // Check win condition
  const winner = checkWinCondition(roomId);
  if (winner) {
    room.winner = winner;
    room.phase = 'final';
    const reason =
      winner === 'engineers'
        ? 'INTERN EJECTED'
        : ejectedWasIntern
          ? 'UNKNOWN'
          : room.round >= 3
            ? 'INTERN SURVIVED 3 ROUNDS'
            : 'ENGINEERS OUTNUMBERED';

    setTimeout(() => {
      io.to(roomId).emit('game_over', {
        winner,
        internUsername: internPlayer?.username ?? '???',
        reason,
      });
    }, 4000);
  } else {
    // Continue — show summary, then start next round with the SAME category
    room.phase = 'summary';
    setTimeout(() => {
      const updatedRoom = advanceRound(roomId);
      if (!updatedRoom) return;

      // Skip category vote — reuse the same category and pick fresh tasks for it
      updatedRoom.engineerTaskIds = pickTaskIds(updatedRoom.category, 'engineer', 10);
      updatedRoom.internTaskIds   = updatedRoom.engineerTaskIds;

      // Compute game timer (role-reveal delay + coding time)
      const gameTimerEndsAt = Date.now() + ROLE_REVEAL_DELAY_MS + GAME_TIMER_MS;

      // Re-assign roles for this round and send each player their info
      const roleResult = assignRoles(roomId);
      if (!roleResult) return;
      const internId = roleResult.internId;

      updatedRoom.players.forEach((p) => {
        const role: 'engineer' | 'intern' = p.id === internId ? 'intern' : 'engineer';
        io.to(p.id).emit('role_assigned', {
          role,
          round: updatedRoom.round,
          taskIds: updatedRoom.engineerTaskIds,
          gameTimerEndsAt,
        });
      });

      updatedRoom.phase = 'game';

      io.to(roomId).emit('next_round_started', {
        round: updatedRoom.round,
        players: updatedRoom.players,
        // No category vote this round — categoryVoteEndsAt = 0 signals skip
        categoryVoteEndsAt: 0,
        category: updatedRoom.category,
        taskIds: updatedRoom.engineerTaskIds,
        gameTimerEndsAt,
      });
    }, 6000);
  }
};

export const registerSocketHandlers = (io: GameServer, socket: GameSocket): void => {

  // ── create_room ────────────────────────────────────────────────────────────
  socket.on('create_room', ({ username, maxPlayers }) => {
    const player = { id: socket.id, username, alive: true };
    const room = createRoom(player, maxPlayers ?? 4);
    socket.join(room.roomId);
    socket.emit('room_created', { roomId: room.roomId, players: room.players, maxPlayers: room.maxPlayers });
    console.log(`[create_room] ${username} → ${room.roomId} (max ${room.maxPlayers})`);
  });

  // ── join_room ──────────────────────────────────────────────────────────────
  socket.on('join_room', ({ roomId, username }) => {
    const player = { id: socket.id, username, alive: true };
    const room = joinRoom(roomId, player);
    if (!room) {
      // Check if room exists to give the right error
      const existing = getRoom(roomId);
      if (existing) {
        socket.emit('room_error', { message: `Room "${roomId}" is full (${existing.maxPlayers}/${existing.maxPlayers}).` });
      } else {
        socket.emit('room_error', { message: `Room "${roomId}" not found.` });
      }
      return;
    }
    socket.join(room.roomId);
    socket.emit('room_joined', { roomId: room.roomId, players: room.players, maxPlayers: room.maxPlayers });
    socket.to(room.roomId).emit('player_list_update', { roomId: room.roomId, players: room.players });
    console.log(`[join_room]   ${username} → ${room.roomId}`);
  });

  // ── start_game ─────────────────────────────────────────────────────────────
  socket.on('start_game', ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room || room.hostId !== socket.id) return;
    if (room.players.length < room.maxPlayers) {
      socket.emit('room_error', { message: `Need ${room.maxPlayers} players to start.` });
      return;
    }
    room.phase = 'category_vote';
    room.round = 1;
    room.categoryVotes = {};
    room.ejectionVotes = {};
    room.tasksCompleted = {};
    room.internId = '';
    room.winner = null;
    // All players alive at start
    room.players.forEach((p) => { p.alive = true; });

    const categoryVoteEndsAt = Date.now() + CATEGORY_VOTE_TIMEOUT_MS;
    io.to(roomId).emit('game_started', { players: room.players, round: 1, categoryVoteEndsAt });

    // Start category vote timeout
    categoryVoteTimers.set(roomId, setTimeout(() => finaliseCategoryVote(io, roomId), CATEGORY_VOTE_TIMEOUT_MS));
    console.log(`[start_game]  ${roomId} — round 1`);
  });

  // ── category_vote ──────────────────────────────────────────────────────────
  socket.on('category_vote', ({ roomId, category }) => {
    const result = recordCategoryVote(roomId, socket.id, category);
    if (!result) return;

    const room = getRoom(roomId);
    if (!room) return;

    // Broadcast live tally
    io.to(roomId).emit('category_vote_update', {
      votes: result.tally,
      totalPlayers: room.players.filter((p) => p.alive).length,
    });

    // If everyone voted, finalise immediately
    if (result.allVoted) {
      finaliseCategoryVote(io, roomId);
    }
  });

  // ── start_meeting ──────────────────────────────────────────────────────────
  socket.on('start_meeting', ({ roomId }) => {
    const room = getRoom(roomId);
    // Allow meeting from 'game' OR 'role_reveal' (in case player calls it right after reveal)
    if (!room || (room.phase !== 'game' && room.phase !== 'role_reveal')) return;

    room.phase = 'meeting';
    room.ejectionVotes = {};

    const trigger = room.players.find((p) => p.id === socket.id);
    io.to(roomId).emit('meeting_started', {
      players: room.players.filter((p) => p.alive),
      triggeredBy: trigger?.username ?? 'UNKNOWN',
    });
    // Signal clients to stop their game timer immediately
    io.to(roomId).emit('timer_sync', { phase: 'game', endsAt: Date.now() });

    // Start ejection vote timeout
    ejectionVoteTimers.set(roomId, setTimeout(() => finaliseEjectionVote(io, roomId), EJECTION_VOTE_TIMEOUT_MS));
    console.log(`[meeting]     ${roomId} triggered by ${trigger?.username}`);
  });

  // ── cast_vote ──────────────────────────────────────────────────────────────
  socket.on('cast_vote', ({ roomId, targetId }) => {
    const result = recordEjectionVote(roomId, socket.id, targetId);
    if (!result) return;

    const room = getRoom(roomId);
    if (!room) return;

    io.to(roomId).emit('ejection_vote_update', {
      votes: result.tally,
      totalVoters: room.players.filter((p) => p.alive).length,
    });

    if (result.allVoted) {
      finaliseEjectionVote(io, roomId);
    }
  });

  // ── task_progress ──────────────────────────────────────────────────────────
  socket.on('task_progress', ({ roomId, count }) => {
    recordTaskProgress(roomId, socket.id, count);
    const room = getRoom(roomId);
    if (!room) return;
    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;
    io.to(roomId).emit('task_progress_update', {
      playerId: socket.id,
      username: player.username,
      count,
    });
  });

  // ── next_round (host acks summary screen done) ────────────────────────────
  socket.on('next_round', ({ roomId }) => {
    const room = getRoom(roomId);
    if (!room || room.hostId !== socket.id) return;
    const updated = advanceRound(roomId);
    if (updated) {
      updated.engineerTaskIds = pickTaskIds(updated.category, 'engineer', 10);
      updated.internTaskIds   = updated.engineerTaskIds;
      const gameTimerEndsAt = Date.now() + ROLE_REVEAL_DELAY_MS + GAME_TIMER_MS;
      const roleResult = assignRoles(roomId);
      if (!roleResult) return;
      const internId = roleResult.internId;
      updated.players.forEach((p) => {
        const role: 'engineer' | 'intern' = p.id === internId ? 'intern' : 'engineer';
        io.to(p.id).emit('role_assigned', { role, round: updated.round, taskIds: updated.engineerTaskIds, gameTimerEndsAt });
      });
      updated.phase = 'game';
      io.to(roomId).emit('next_round_started', {
        round: updated.round,
        players: updated.players,
        categoryVoteEndsAt: 0,
        category: updated.category,
        taskIds: updated.engineerTaskIds,
        gameTimerEndsAt,
      });
    }
  });

  // ── code_change ────────────────────────────────────────────────────────────
  socket.on('code_change', ({ roomId, code, taskId }) => {
    const room = getRoom(roomId);
    if (!room) return;
    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;
    // Broadcast to everyone EXCEPT the sender
    socket.to(roomId).emit('code_synced', {
      code,
      taskId,
      senderName: player.username,
    });
  });

  // ── task_completed ─────────────────────────────────────────────────────────
  socket.on('task_completed', ({ roomId, taskId }) => {
    const room = getRoom(roomId);
    if (!room) return;
    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;
    // Broadcast to ALL players in the room (including sender) so everyone marks it done
    io.to(roomId).emit('task_completion_broadcast', {
      taskId,
      completedBy: player.username,
    });
    console.log(`[task_done]   ${player.username} completed ${taskId} in ${roomId}`);
  });

  // ── chat_message ───────────────────────────────────────────────────────────
  socket.on('chat_message', ({ roomId, text }) => {
    const room = getRoom(roomId);
    if (!room) return;
    const player = room.players.find((p) => p.id === socket.id);
    if (!player) return;
    // Broadcast to ALL players in the room (including sender)
    io.to(roomId).emit('chat_broadcast', {
      username: player.username,
      text: text.toUpperCase().slice(0, 200),
    });
  });

  // ── disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const room = removePlayer(socket.id);
    if (room) {
      io.to(room.roomId).emit('player_list_update', { roomId: room.roomId, players: room.players });
      console.log(`[disconnect]  ${socket.id} left ${room.roomId} (${room.players.length} remaining)`);
    } else {
      console.log(`[disconnect]  ${socket.id} (no room)`);
    }
  });
};
