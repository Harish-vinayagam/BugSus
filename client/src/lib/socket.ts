import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '../../../shared/types';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

// ── Render free-tier wake-up ─────────────────────────────────────────────────
// Ping /health immediately when this module loads (on app open), so the server
// is warm by the time the user finishes the boot animation and types their name.
// Retries every 3s for up to 10 attempts to survive a full cold-start cycle.
let wakeAttempts = 0;
const wakeServer = () => {
  fetch(`${SERVER_URL}/health`)
    .then(() => console.log('[wake] server is up'))
    .catch(() => {
      if (++wakeAttempts < 10) setTimeout(wakeServer, 3000);
    });
};
wakeServer();

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SERVER_URL, {
  autoConnect: false,        // connect manually after the user submits their name
  reconnectionAttempts: 10,  // retry up to 10× if server is still cold
  reconnectionDelay: 500,    // 500ms between retries (was 2000 — way too slow)
  reconnectionDelayMax: 2000,// cap backoff at 2s
  timeout: 5000,             // 5s per connect attempt (was 30s — caused long hangs)
});
