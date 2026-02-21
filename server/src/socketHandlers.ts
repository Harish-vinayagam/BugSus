import type { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../../shared/types';
import { createRoom, joinRoom, removePlayer } from './roomStore';

type GameServer = Server<ClientToServerEvents, ServerToClientEvents>;
type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export const registerSocketHandlers = (io: GameServer, socket: GameSocket): void => {
  // ── create_room ────────────────────────────────────────────────────────────
  socket.on('create_room', ({ username }) => {
    const player = { id: socket.id, username };
    const room = createRoom(player);

    socket.join(room.roomId);

    socket.emit('room_created', {
      roomId: room.roomId,
      players: room.players,
    });

    console.log(`[create_room] ${username} created room ${room.roomId}`);
  });

  // ── join_room ──────────────────────────────────────────────────────────────
  socket.on('join_room', ({ roomId, username }) => {
    const player = { id: socket.id, username };
    const room = joinRoom(roomId, player);

    if (!room) {
      socket.emit('room_error', { message: `Room "${roomId}" does not exist.` });
      return;
    }

    socket.join(room.roomId);

    // Tell the joining player they're in
    socket.emit('room_joined', {
      roomId: room.roomId,
      players: room.players,
    });

    // Broadcast the updated list to everyone else in the room
    socket.to(room.roomId).emit('player_list_update', {
      roomId: room.roomId,
      players: room.players,
    });

    console.log(`[join_room]  ${username} joined room ${room.roomId}`);
  });

  // ── disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const updatedRoom = removePlayer(socket.id);

    if (updatedRoom) {
      // Room still has players — broadcast the updated list
      io.to(updatedRoom.roomId).emit('player_list_update', {
        roomId: updatedRoom.roomId,
        players: updatedRoom.players,
      });
      console.log(`[disconnect] ${socket.id} left room ${updatedRoom.roomId} (${updatedRoom.players.length} remaining)`);
    } else {
      console.log(`[disconnect] ${socket.id} disconnected (room deleted or not in a room)`);
    }
  });
};
