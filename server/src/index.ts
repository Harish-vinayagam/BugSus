import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from './types';
import { registerSocketHandlers } from './socketHandlers';

const PORT = process.env.PORT ?? 3001;

// Allow any origin in dev so LAN devices can connect without needing an exact URL.
// In production set CLIENT_URL to your deployed frontend URL.
const CLIENT_URL = process.env.CLIENT_URL ?? '*';

// ── Express + HTTP server ────────────────────────────────────────────────────
const app = express();
const httpServer = createServer(app);

// Allow cross-origin requests for plain HTTP routes (e.g. /health)
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(',')
      : '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Optimize for production/cold starts
  pingInterval: 25_000,      // send ping every 25s
  pingTimeout: 60_000,       // wait 60s for pong before disconnect (for cold starts)
  transports: ['websocket', 'polling'], // try websocket first, fallback to polling
  allowEIO3: true,           // support older Socket.IO clients
  maxHttpBufferSize: 1e6,    // 1MB max message size
});

io.on('connection', (socket) => {
  console.log(`[connect]    ${socket.id}`);
  registerSocketHandlers(io, socket);
});

// ── Start ────────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`✓ BugSus server running on port ${PORT}`);
  console.log(`✓ Accepting connections from: ${CLIENT_URL}`);
  console.log(`✓ Socket.IO configured with:
  - pingInterval: 25s
  - pingTimeout: 60s (allows cold starts)
  - transports: websocket, polling
  - maxHttpBufferSize: 1MB`);
});
