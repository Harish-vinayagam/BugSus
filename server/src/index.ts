import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '../../shared/types';
import { registerSocketHandlers } from './socketHandlers';

const PORT = process.env.PORT ?? 3001;

// Allow any origin in dev so LAN devices can connect without needing an exact URL.
// In production set CLIENT_URL to your deployed frontend URL.
const CLIENT_URL = process.env.CLIENT_URL ?? '*';

// ── Express + HTTP server ────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[connect]    ${socket.id}`);
  registerSocketHandlers(io, socket);
});

// ── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`BugSus server running on http://localhost:${PORT}`);
  console.log(`Accepting connections from ${CLIENT_URL}`);
});
