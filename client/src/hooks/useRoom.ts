import { useState, useEffect, useCallback } from 'react';
import { socket } from '@/lib/socket';
import type { Player } from '../../../shared/types';

export type RoomStatus =
  | 'idle'         // not connected
  | 'connecting'   // socket connecting
  | 'creating'     // waiting for room_created
  | 'joining'      // waiting for room_joined
  | 'in_room'      // successfully in a room
  | 'error';       // something went wrong

export interface UseRoomReturn {
  status: RoomStatus;
  roomId: string;
  players: Player[];
  error: string;
  createRoom: (username: string) => void;
  joinRoom: (roomId: string, username: string) => void;
  disconnect: () => void;
}

export const useRoom = (): UseRoomReturn => {
  const [status, setStatus]   = useState<RoomStatus>('idle');
  const [roomId, setRoomId]   = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError]     = useState('');

  // ── Socket event listeners ─────────────────────────────────────────────────
  useEffect(() => {
    const onConnect = () => {
      setStatus((s) => (s === 'connecting' ? 'creating' : s));
    };

    const onConnectError = () => {
      setStatus('error');
      setError('Could not reach server. Is it running?');
    };

    const onRoomCreated = (payload: { roomId: string; players: Player[] }) => {
      setRoomId(payload.roomId);
      setPlayers(payload.players);
      setStatus('in_room');
    };

    const onRoomJoined = (payload: { roomId: string; players: Player[] }) => {
      setRoomId(payload.roomId);
      setPlayers(payload.players);
      setStatus('in_room');
    };

    const onPlayerListUpdate = (payload: { roomId: string; players: Player[] }) => {
      if (payload.roomId === roomId || roomId === '') {
        setPlayers(payload.players);
      }
    };

    const onRoomError = (payload: { message: string }) => {
      setStatus('error');
      setError(payload.message);
    };

    socket.on('connect',            onConnect);
    socket.on('connect_error',      onConnectError);
    socket.on('room_created',       onRoomCreated);
    socket.on('room_joined',        onRoomJoined);
    socket.on('player_list_update', onPlayerListUpdate);
    socket.on('room_error',         onRoomError);

    return () => {
      socket.off('connect',            onConnect);
      socket.off('connect_error',      onConnectError);
      socket.off('room_created',       onRoomCreated);
      socket.off('room_joined',        onRoomJoined);
      socket.off('player_list_update', onPlayerListUpdate);
      socket.off('room_error',         onRoomError);
    };
  }, [roomId]);

  // ── Public API ─────────────────────────────────────────────────────────────
  const createRoom = useCallback((username: string) => {
    setStatus('connecting');
    setError('');
    socket.connect();
    // Emit after connect fires (listener above sets status → emit on next tick)
    socket.once('connect', () => {
      setStatus('creating');
      socket.emit('create_room', { username });
    });
  }, []);

  const joinRoom = useCallback((rid: string, username: string) => {
    setStatus('connecting');
    setError('');
    socket.connect();
    socket.once('connect', () => {
      setStatus('joining');
      socket.emit('join_room', { roomId: rid, username });
    });
  }, []);

  const disconnect = useCallback(() => {
    socket.disconnect();
    setStatus('idle');
    setRoomId('');
    setPlayers([]);
    setError('');
  }, []);

  return { status, roomId, players, error, createRoom, joinRoom, disconnect };
};
