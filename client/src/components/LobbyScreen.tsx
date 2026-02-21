import { useEffect, useRef } from 'react';
import type { Player } from '../../../shared/types';

interface LobbyScreenProps {
  playerName: string;
  roomCode: string;
  players: Player[];       // live list from socket
  onStart: () => void;
}

const MAX_PLAYERS = 4;

const LobbyScreen: React.FC<LobbyScreenProps> = ({ playerName, roomCode, players, onStart }) => {
  const logRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Build a running log from player list changes
  const logs = players.map((p, i) =>
    i === 0 ? `> HOST_CONNECTED: ${p.username}` : `> USER_CONNECTED: ${p.username}`
  );

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
    prevCountRef.current = players.length;
  }, [players]);

  const isFull = players.length >= MAX_PLAYERS;
  const isHost = players[0]?.username === playerName;

  return (
    <div className="h-full flex flex-col font-mono">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="crt-glow font-terminal text-xl">ROOM: <span className="crt-glow-accent tracking-widest">{roomCode}</span></p>
          <p className="text-xs mt-1" style={{ color: 'var(--crt-dim)' }}>SHARE THIS CODE WITH YOUR TEAM</p>
        </div>
        <p className="crt-glow font-terminal text-lg" style={{ color: players.length >= MAX_PLAYERS ? 'var(--crt-accent)' : 'var(--crt-dim)' }}>
          {players.length}/{MAX_PLAYERS} PLAYERS
        </p>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">

        {/* Player slots */}
        <div className="flex-1 space-y-3">
          <p className="font-terminal text-sm" style={{ color: 'var(--crt-dim)' }}>┌─ CONNECTED CREW ─┐</p>
          {Array.from({ length: MAX_PLAYERS }).map((_, i) => {
            const p = players[i];
            const isMe = p?.username === playerName;
            return (
              <div
                key={i}
                className="ascii-box flex items-center gap-3 transition-all duration-300"
                style={{
                  borderColor: p ? (isMe ? 'var(--crt-accent)' : 'var(--crt-green)') : 'var(--crt-dim)',
                  opacity: p ? 1 : 0.3,
                  background: p ? 'rgba(51,255,51,0.03)' : 'transparent',
                }}
              >
                <span className="font-terminal text-lg" style={{ color: p ? 'var(--crt-dim)' : 'var(--crt-dim)' }}>
                  [{String(i + 1).padStart(2, '0')}]
                </span>
                <span
                  className="font-terminal text-lg flex-1"
                  style={{ color: p ? (isMe ? 'var(--crt-accent)' : 'var(--crt-green)') : 'var(--crt-dim)',
                           textShadow: p ? (isMe ? 'var(--crt-glow-accent)' : 'var(--crt-glow)') : 'none' }}
                >
                  {p ? p.username : '...WAITING'}
                </span>
                {isMe && <span className="text-xs crt-glow-accent">(YOU)</span>}
                {p && i === 0 && !isMe && <span className="text-xs" style={{ color: 'var(--crt-dim)' }}>[HOST]</span>}
              </div>
            );
          })}
        </div>

        {/* System log */}
        <div className="w-72 flex flex-col">
          <p className="font-terminal text-sm mb-2" style={{ color: 'var(--crt-dim)' }}>┌─ SYSTEM LOG ─┐</p>
          <div
            ref={logRef}
            className="flex-1 overflow-auto text-sm space-y-1 ascii-box"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          >
            {logs.map((log, i) => (
              <p key={i} className="crt-glow" style={{ color: 'var(--crt-green)', animation: 'fadeInLine 0.3s ease-out' }}>
                {log}
              </p>
            ))}
            {!isFull && (
              <p className="crt-cursor text-xs" style={{ color: 'var(--crt-dim)' }}>
                WAITING FOR CONNECTIONS
              </p>
            )}
            {isFull && (
              <p className="crt-glow-accent text-xs">{'>'} ALL SLOTS FILLED. READY TO EXECUTE.</p>
            )}
          </div>
        </div>
      </div>

      {/* Start button — only host can start, only when full */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <button
          className="crt-button crt-button-accent text-xl px-12 py-3 font-terminal"
          onClick={onStart}
          disabled={!isFull || !isHost}
        >
          {isFull
            ? isHost ? '>> EXECUTE GAME_START <<' : 'WAITING FOR HOST...'
            : `AWAITING PLAYERS... (${players.length}/${MAX_PLAYERS})`}
        </button>
        {!isHost && isFull && (
          <p className="text-xs" style={{ color: 'var(--crt-dim)' }}>
            ONLY THE HOST CAN START THE GAME
          </p>
        )}
      </div>
    </div>
  );
};

export default LobbyScreen;
