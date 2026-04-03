import { useState, useEffect, useRef } from 'react';
import { usePageVisibility } from '@/hooks/usePageVisibility';
import type { RoomStatus } from '@/hooks/useRoom';

interface CreateJoinScreenProps {
  mode: 'create' | 'join';
  /** Called once the room is successfully created/joined */
  onSubmit: (name: string, roomCode: string) => void;
  onBack: () => void;
  /** Injected by Index so this component can trigger socket calls */
  onCreateRoom: (username: string, maxPlayers: 4 | 6 | 8) => void;
  onJoinRoom: (roomId: string, username: string) => void;
  socketStatus: RoomStatus;
  socketRoomId: string; // filled once room_created fires
  socketError: string;
}

const CreateJoinScreen: React.FC<CreateJoinScreenProps> = ({
  mode,
  onSubmit,
  onBack,
  onCreateRoom,
  onJoinRoom,
  socketStatus,
  socketRoomId,
  socketError,
}) => {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [step, setStep] = useState<'name' | 'room' | 'connecting'>('name');
  const [timedOut, setTimedOut] = useState(false);
  const [maxPlayers, setMaxPlayers] = useState<4 | 6 | 8>(4);

  // Keep the latest name accessible without stale closure issues
  const nameRef   = useRef('');
  const hasSubmitted = useRef(false); // prevent double-fire
  useEffect(() => { nameRef.current = name; }, [name]);

  // ── Transition to lobby the moment socket confirms room creation/join ──────
  useEffect(() => {
    if (socketStatus === 'in_room' && socketRoomId && !hasSubmitted.current) {
      hasSubmitted.current = true;
      onSubmit(nameRef.current, socketRoomId);
    }
  }, [socketStatus, socketRoomId, onSubmit]);

  // Reset hasSubmitted when we go back to idle
  useEffect(() => {
    if (socketStatus === 'idle' || socketStatus === 'error') {
      hasSubmitted.current = false;
    }
  }, [socketStatus]);

  // Handle page visibility: reset timeout when tab becomes visible
  usePageVisibility(
    undefined, // onHidden
    () => {
      // Tab became visible — reset timeout to give user a fresh 35s
      if (step === 'connecting' && !timedOut) {
        setTimedOut(false);
        console.log('[CreateJoinScreen] tab visible — timeout reset');
      }
    }
  );

  // 35s safety-net: show retry if still waiting with no error (increased for cold start delays)
  useEffect(() => {
    if (step !== 'connecting') { setTimedOut(false); return; }
    const t = setTimeout(() => setTimedOut(true), 35_000);
    return () => clearTimeout(t);
  }, [step]);

  const handleNameSubmit = () => {
    if (!name.trim()) return;
    if (mode === 'create') {
      hasSubmitted.current = false;
      setTimedOut(false);
      setStep('connecting');
      onCreateRoom(name.trim(), maxPlayers);
    } else {
      setStep('room');
    }
  };

  const handleRoomSubmit = () => {
    if (roomCode.trim().length < 4) return;
    hasSubmitted.current = false;
    setTimedOut(false);
    setStep('connecting');
    onJoinRoom(roomCode.trim(), name.trim());
  };

  const handleRetry = () => {
    hasSubmitted.current = false;
    setTimedOut(false);
    if (mode === 'create') onCreateRoom(nameRef.current, maxPlayers);
    else onJoinRoom(roomCode.trim(), nameRef.current);
  };

  const isConnecting = step === 'connecting' && socketStatus !== 'error' && !timedOut;

  return (
    <div className="h-full flex flex-col justify-center font-mono">
      <div className="space-y-4">
        <p className="crt-glow" style={{ color: 'var(--crt-dim)' }}>
          {'>'} {mode === 'create' ? 'CREATE_ROOM' : 'JOIN_ROOM'} PROTOCOL
        </p>

        <div className="ascii-box" style={{ maxWidth: '500px' }}>
          {/* ── Step: enter callsign ── */}
          {step === 'name' && (
            <div className="space-y-4">
              <p className="crt-glow">ENTER CALLSIGN:</p>
              <div className="flex items-center gap-2">
                <span className="crt-glow">{'>'}</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 12))}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSubmit()}
                  className="bg-transparent border-none outline-none crt-glow font-mono text-base flex-1"
                  style={{ color: 'var(--crt-green)', caretColor: 'var(--crt-green)' }}
                  autoFocus
                  placeholder="YOUR_NAME"
                  maxLength={12}
                />
              </div>

              {/* Player count selector — create mode only */}
              {mode === 'create' && (
                <div className="space-y-2">
                  <p className="crt-glow text-sm" style={{ color: 'var(--crt-dim)' }}>
                    SELECT CREW SIZE:
                  </p>
                  <div className="flex gap-3">
                    {([4, 6, 8] as const).map((n) => (
                      <button
                        key={n}
                        onClick={() => setMaxPlayers(n)}
                        className="crt-button font-terminal text-lg px-5 py-2 transition-all"
                        style={{
                          color: maxPlayers === n ? 'var(--crt-bg)' : 'var(--crt-green)',
                          background: maxPlayers === n ? 'var(--crt-green)' : 'transparent',
                          borderColor: maxPlayers === n ? 'var(--crt-green)' : 'var(--crt-dim)',
                          boxShadow: maxPlayers === n ? '0 0 10px var(--crt-green)' : 'none',
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--crt-dim)' }}>
                    {maxPlayers} PLAYERS — 1 INTERN + {maxPlayers - 1} ENGINEERS
                  </p>
                </div>
              )}

              <button className="crt-button" onClick={handleNameSubmit} disabled={!name.trim()}>
                CONFIRM
              </button>
            </div>
          )}

          {/* ── Step: enter room code (join only) ── */}
          {step === 'room' && (
            <div className="space-y-4">
              <p className="crt-glow">
                CALLSIGN: <span className="crt-glow-accent">{name}</span>
              </p>
              <p className="crt-glow">ENTER ROOM CODE:</p>
              <div className="flex items-center gap-2">
                <span className="crt-glow">{'>'}</span>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                  onKeyDown={(e) => e.key === 'Enter' && handleRoomSubmit()}
                  className="bg-transparent border-none outline-none crt-glow font-mono text-xl tracking-[0.4em] flex-1"
                  style={{ color: 'var(--crt-green)', caretColor: 'var(--crt-green)' }}
                  autoFocus
                  placeholder="______"
                  maxLength={6}
                />
              </div>
              <button className="crt-button" onClick={handleRoomSubmit} disabled={roomCode.trim().length < 4}>
                CONNECT
              </button>
            </div>
          )}

          {/* ── Step: connecting spinner ── */}
          {step === 'connecting' && socketStatus !== 'error' && (
            <div className="space-y-4">
              <p className="crt-glow">
                CALLSIGN: <span className="crt-glow-accent">{name}</span>
              </p>
              {!timedOut ? (
                <>
                  <p className="crt-glow crt-cursor" style={{ color: 'var(--crt-dim)' }}>
                    {mode === 'create' ? '> CREATING ROOM' : `> JOINING ${roomCode}`}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--crt-dim)' }}>
                    ESTABLISHING CONNECTION...
                  </p>
                  <p className="text-xs mt-2" style={{ color: 'var(--crt-dim)' }}>
                    (THIS MAY TAKE UP TO 30 SECONDS ON FIRST CONNECT)
                  </p>
                </>
              ) : (
                <>
                  <p className="crt-glow" style={{ color: 'var(--crt-amber)' }}>
                    ⚠ SERVER IS TAKING TOO LONG
                  </p>
                  <p className="text-xs" style={{ color: 'var(--crt-dim)' }}>
                    Render free-tier may be cold-starting (~30s).
                  </p>
                  <button
                    className="crt-button"
                    onClick={handleRetry}
                  >
                    [RETRY]
                  </button>
                  <button className="crt-button mt-1" style={{ fontSize: '0.8rem' }} onClick={() => { hasSubmitted.current = false; setStep('name'); }}>
                    {'<'} BACK
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── Error state ── */}
          {socketStatus === 'error' && (
            <div className="space-y-4">
              <p className="crt-glow-red font-terminal text-lg">⚠ CONNECTION FAILED</p>
              <p className="text-sm" style={{ color: 'var(--crt-red)' }}>
                {socketError}
              </p>
              <button className="crt-button crt-button-red" onClick={() => { hasSubmitted.current = false; setStep('name'); }}>
                RETRY
              </button>
            </div>
          )}
        </div>

        {!isConnecting && (
          <button className="crt-button mt-4" style={{ fontSize: '0.875rem' }} onClick={onBack}>
            {'<'} BACK
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateJoinScreen;
