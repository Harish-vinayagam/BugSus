import { useState, useEffect, useCallback } from 'react';
import TypingText from './TypingText';

interface BootScreenProps {
  onSelect: (mode: 'create' | 'join') => void;
}

const BootScreen: React.FC<BootScreenProps> = ({ onSelect }) => {
  const [phase, setPhase] = useState(0);
  const [inputValue, setInputValue] = useState('');

  const handleCommand = useCallback((cmd: string) => {
    const c = cmd.trim().toUpperCase();
    if (c === 'CREATE_ROOM' || c === '1') onSelect('create');
    else if (c === 'JOIN_ROOM' || c === '2') onSelect('join');
  }, [onSelect]);

  return (
    <div className="h-full flex flex-col justify-center font-mono">
      <div className="space-y-2">
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
    </div>
  );
};

export default BootScreen;
