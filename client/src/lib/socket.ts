import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types';

// Single shared socket instance — created once, reused everywhere.
// The connection is lazy: it only opens when the first component imports this file.
const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

// Ping server on load to wake Render free tier from sleep
fetch(`${import.meta.env.VITE_SERVER_URL}/health`).catch(() => {});

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
  autoConnect: false,   // we connect manually after the user submits their name
  reconnectionAttempts: 5,
});
