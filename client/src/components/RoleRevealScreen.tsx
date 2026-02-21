import { useState, useEffect } from 'react';

interface RoleRevealScreenProps {
  role: 'engineer' | 'intern';
  round: number;
  onComplete: () => void;
}

const RoleRevealScreen: React.FC<RoleRevealScreenProps> = ({ role, round, onComplete }) => {
  const [phase, setPhase] = useState<'glitch' | 'reveal' | 'done'>('glitch');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 1500);
    const t2 = setTimeout(() => setPhase('done'), 3000);
    const t3 = setTimeout(onComplete, 4500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const isEngineer = role === 'engineer';

  return (
    <div
      className="h-full flex flex-col items-center justify-center font-mono"
      style={{
        background: phase === 'reveal' || phase === 'done'
          ? isEngineer
            ? 'rgba(51, 255, 51, 0.03)'
            : 'rgba(255, 51, 51, 0.05)'
          : 'transparent',
        transition: 'background 0.5s',
      }}
    >
      {phase === 'glitch' && (
        <div className="crt-glitch text-center">
          <p className="font-terminal text-4xl crt-glow">ASSIGNING ROLE...</p>
          <div className="mt-4 space-y-1">
            {[...Array(6)].map((_, i) => (
              <p key={i} className="font-mono text-sm" style={{ color: 'var(--crt-dim)' }}>
                {Array.from({ length: 40 }, () =>
                  String.fromCharCode(33 + Math.floor(Math.random() * 93))
                ).join('')}
              </p>
            ))}
          </div>
        </div>
      )}

      {(phase === 'reveal' || phase === 'done') && (
        <div className="text-center space-y-6">
          <p
            className={`font-terminal text-6xl ${isEngineer ? 'crt-glow' : 'crt-glow-red'}`}
          >
            {isEngineer ? '🔧 ENGINEER' : '🐛 INTERN'}
          </p>
          {round > 1 && (
            <p className="font-terminal text-sm" style={{ color: 'var(--crt-dim)' }}>
              ROUND {round} — ROLE UNCHANGED
            </p>
          )}
          <p
            className="font-mono text-lg"
            style={{ color: isEngineer ? 'var(--crt-dim)' : 'var(--crt-red)' }}
          >
            {isEngineer
              ? 'COMPLETE TASKS. FIND THE INTERN.'
              : 'SABOTAGE. BLEND IN. SURVIVE.'}
          </p>
          {phase === 'done' && (
            <p className="crt-glow text-sm" style={{ color: 'var(--crt-dim)' }}>
              STARTING GAME...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default RoleRevealScreen;
