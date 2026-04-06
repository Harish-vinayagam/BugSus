import { useState, useEffect, useCallback } from 'react';
import TypingText from './TypingText';

interface BootScreenProps {
  onSelect: (mode: 'create' | 'join') => void;
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

const BootScreen: React.FC<BootScreenProps> = ({ onSelect }) => {
  const [phase, setPhase] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Ping server as soon as boot screen mounts — gives ~5–8s of warm-up time
  // during the typing animation before the user can even click anything
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const MAX = 15; // 15 × 3s = 45s — covers Render cold start

    const ping = () => {
      fetch(`${SERVER_URL}/health`, {
        signal: AbortSignal.timeout(4000), // give up each attempt after 4s
        cache: 'no-store',
      })
        .then((r) => {
          if (cancelled) return;
          if (r.ok) setServerStatus('online');
          else throw new Error('non-ok');
        })
        .catch(() => {
          if (cancelled) return;
          if (++attempts < MAX) setTimeout(ping, 3000);
          else setServerStatus('offline');
        });
    };
    ping();
    return () => { cancelled = true; };
  }, []);

  const handleCommand = useCallback((cmd: string) => {
    const c = cmd.trim().toUpperCase();
    if (c === 'CREATE_ROOM' || c === '1') onSelect('create');
    else if (c === 'JOIN_ROOM' || c === '2') onSelect('join');
  }, [onSelect]);

  return (
    <div className="h-full flex flex-col justify-center font-mono">
      <div className="space-y-2">
        {/* Loading animation - visible during loading (phases 0-3) */}
        {phase < 4 && (
          <>
            {phase >= 0 && (
              <TypingText
                text="INITIALIZING BUGSUS..."
                speed={50}
                onComplete={() => setTimeout(() => setPhase(1), 500)}
              />
            )}
            {phase >= 1 && (
              <div>
                <TypingText
                  text="SYSTEM CHECK: OK"
                  speed={30}
                  onComplete={() => setTimeout(() => setPhase(2), 300)}
                />
              </div>
            )}
            {phase >= 2 && (
              <div>
                <TypingText
                  text="LOADING MODULES..."
                  speed={30}
                  onComplete={() => setTimeout(() => setPhase(3), 400)}
                />
              </div>
            )}
            {phase >= 3 && (
              <div className="mt-6">
                <TypingText
                  text="████████████████████████ 100%"
                  speed={20}
                  onComplete={() => setTimeout(() => setPhase(4), 300)}
                />
              </div>
            )}
          </>
        )}
        {/* Homepage - visible after loading (phase >= 4) */}
        {phase >= 4 && (
          <div className="mt-8 space-y-4">
            <pre className="crt-glow text-lg font-terminal leading-tight">
{`
 ██████╗ ██╗   ██╗ ██████╗ ███████╗██╗   ██╗███████╗
 ██╔══██╗██║   ██║██╔════╝ ██╔════╝██║   ██║██╔════╝
 ██████╔╝██║   ██║██║  ███╗███████╗██║   ██║███████╗
 ██╔══██╗██║   ██║██║   ██║╚════██║██║   ██║╚════██║
 ██████╔╝╚██████╔╝╚██████╔╝███████║╚██████╔╝███████║
 ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝ ╚═════╝ ╚══════╝
`}
            </pre>
            <p className="crt-glow text-sm" style={{ color: 'var(--crt-dim)' }}>
              {'> '}A SOCIAL DEDUCTION GAME FOR PROGRAMMERS
            </p>
            {/* Server status indicator */}
            <p className="text-xs font-mono mt-1" style={{
              color: serverStatus === 'online'  ? 'var(--crt-green)'
                   : serverStatus === 'offline' ? 'var(--crt-red)'
                   : 'var(--crt-dim)'
            }}>
              {serverStatus === 'checking' && '● CONNECTING TO SERVER...'}
              {serverStatus === 'online'   && '● SERVER ONLINE'}
              {serverStatus === 'offline'  && (
                <>
                  ● SERVER SLOW TO RESPOND — YOU CAN STILL TRY CONNECTING
                  <button
                    className="ml-3 underline"
                    style={{ color: 'var(--crt-dim)', fontSize: '0.7rem' }}
                    onClick={() => {
                      setServerStatus('checking');
                      fetch(`${SERVER_URL}/health`, { signal: AbortSignal.timeout(4000), cache: 'no-store' })
                        .then(r => r.ok && setServerStatus('online'))
                        .catch(() => setServerStatus('offline'));
                    }}
                  >
                    [RETRY]
                  </button>
                </>
              )}
            </p>
            <div className="mt-6">
              <p className="crt-glow mb-4">ENTER COMMAND:</p>
              <div className="space-y-2 mb-6">
                <button
                  className="crt-button block w-64"
                  onClick={() => onSelect('create')}
                >
                  [1] CREATE_ROOM
                </button>
                <button
                  className="crt-button block w-64"
                  onClick={() => onSelect('join')}
                >
                  [2] JOIN_ROOM
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="crt-glow">{'>'}</span>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCommand(inputValue);
                  }}
                  className="bg-transparent border-none outline-none crt-glow font-mono text-base w-64"
                  style={{ color: 'var(--crt-green)', caretColor: 'var(--crt-green)' }}
                  autoFocus
                  placeholder="TYPE COMMAND..."
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Star on GitHub button */}
      <div className="fixed top-4 right-4">
          <a
            href="https://github.com/Harish-vinayagam/BugSus"
            target="_blank"
            rel="noopener noreferrer"
            className="crt-button inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
            style={{ padding: '0.5rem 1rem' }}
          >
            <span>☆</span>
            <span>STAR ON GITHUB</span>
          </a>
        </div>
    </div>
  );
};

export default BootScreen;
