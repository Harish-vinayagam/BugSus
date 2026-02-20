import { useState, useEffect } from 'react';

interface LobbyScreenProps {
  playerName: string;
  roomCode: string;
  onStart: () => void;
}

const FAKE_PLAYERS = ['CIPHER', 'NULLPTR', 'STACK0F'];

const LobbyScreen: React.FC<LobbyScreenProps> = ({ playerName, roomCode, onStart }) => {
  const [players, setPlayers] = useState<string[]>([playerName]);
  const [logs, setLogs] = useState<string[]>([`> USER_CONNECTED: ${playerName}`]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    FAKE_PLAYERS.forEach((name, i) => {
      timers.push(
        setTimeout(() => {
          setPlayers((p) => [...p, name]);
          setLogs((l) => [...l, `> USER_CONNECTED: ${name}`]);
        }, 1500 + i * 2000)
      );
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  const isFull = players.length >= 4;

  return (
    <div className="h-full flex flex-col font-mono">
      <div className="flex items-center justify-between mb-4">
        <p className="crt-glow font-terminal text-xl">ROOM: {roomCode}</p>
        <p className="crt-glow" style={{ color: 'var(--crt-dim)' }}>
          PLAYERS: {players.length}/4
        </p>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Player slots */}
        <div className="flex-1 space-y-3">
          <p className="crt-glow font-terminal" style={{ color: 'var(--crt-dim)' }}>
            ┌─ CONNECTED USERS ─┐
          </p>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="ascii-box"
              style={{
                borderColor: players[i] ? 'var(--crt-green)' : 'var(--crt-dim)',
                opacity: players[i] ? 1 : 0.3,
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="font-terminal text-lg"
                  style={{
                    color: players[i] ? 'var(--crt-green)' : 'var(--crt-dim)',
                    textShadow: players[i] ? 'var(--crt-glow)' : 'none',
                  }}
                >
                  [{String(i + 1).padStart(2, '0')}]
                </span>
                <span className="crt-glow font-terminal text-lg">
                  {players[i] || '...WAITING'}
                </span>
                {players[i] === playerName && (
                  <span className="crt-glow-accent text-xs">(YOU)</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Connection log */}
        <div className="w-72 flex flex-col">
          <p className="crt-glow font-terminal mb-2" style={{ color: 'var(--crt-dim)' }}>
            ┌─ SYSTEM LOG ─┐
          </p>
          <div
            className="flex-1 overflow-auto text-sm space-y-1 ascii-box"
            style={{ color: 'var(--crt-dim)' }}
          >
            {logs.map((log, i) => (
              <p key={i} className="crt-glow" style={{ color: 'var(--crt-green)' }}>
                {log}
              </p>
            ))}
            {!isFull && (
              <p className="crt-cursor" style={{ color: 'var(--crt-dim)' }}>
                WAITING FOR CONNECTIONS
              </p>
            )}
            {isFull && (
              <p className="crt-glow-accent">
                {'>'} ALL PLAYERS CONNECTED. READY TO EXECUTE.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          className="crt-button crt-button-accent text-xl px-12 py-3 font-terminal"
          onClick={onStart}
          disabled={!isFull}
        >
          {isFull ? '>> EXECUTE GAME_START <<' : 'AWAITING PLAYERS...'}
        </button>
      </div>
    </div>
  );
};

export default LobbyScreen;
