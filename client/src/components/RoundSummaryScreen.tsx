import { useEffect, useState } from 'react';

interface RoundSummaryScreenProps {
  round: number;
  ejected: string | null;
  ejectedWasIntern: boolean;
  internName: string;
  alivePlayers: string[];
  tasksCompleted: number;
  totalTasks: number;
  onComplete: () => void;
}

const LINES_CORRECT = [
  '> WRONG ENGINEER EJECTED',
  '> INTERN STILL ABOARD',
  '> CODEBASE INTEGRITY: DEGRADED',
  '> INITIATING NEXT ROUND...',
];

const LINES_SKIPPED = [
  '> NO EJECTION — VOTE SKIPPED',
  '> INTERN REMAINS UNDETECTED',
  '> CODEBASE INTEGRITY: AT RISK',
  '> INITIATING NEXT ROUND...',
];

const RoundSummaryScreen: React.FC<RoundSummaryScreenProps> = ({
  round,
  ejected,
  ejectedWasIntern,
  internName,
  alivePlayers,
  tasksCompleted,
  totalTasks,
  onComplete,
}) => {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [showContinue, setShowContinue] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const lines = ejected ? LINES_CORRECT : LINES_SKIPPED;

  // Reveal lines one by one
  useEffect(() => {
    let idx = 0;
    const reveal = () => {
      if (idx < lines.length) {
        const line = lines[idx++];
        setVisibleLines((prev) => [...prev, line]);
        setTimeout(reveal, 650);
      } else {
        setTimeout(() => {
          setShowContinue(true);
          setCountdown(5);
        }, 400);
      }
    };
    const t = setTimeout(reveal, 500);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-advance countdown
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) { onComplete(); return; }
    const t = setTimeout(() => setCountdown((c) => (c ?? 1) - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onComplete]);

  const pct = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

  return (
    <div className="h-full flex flex-col items-center justify-center font-mono gap-6">

      {/* Title */}
      <div className="text-center" style={{ borderBottom: '1px solid var(--crt-dim)', paddingBottom: '1rem', width: '100%', maxWidth: '36rem' }}>
        <p className="font-terminal text-3xl crt-glow">ROUND {round} COMPLETE</p>
        <p className="text-xs mt-1" style={{ color: 'var(--crt-dim)' }}>DEBRIEF OUTPUT:</p>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6 w-full max-w-2xl">

        {/* Left — terminal log */}
        <div className="flex-1 ascii-box py-3 px-4 space-y-2" style={{ background: 'rgba(0,0,0,0.3)' }}>
          {visibleLines.map((line, i) => (
            <p
              key={i}
              className="text-sm font-mono"
              style={{
                color: 'var(--crt-green)',
                textShadow: 'var(--crt-glow)',
                animation: 'fadeInLine 0.3s ease-out',
              }}
            >
              {line}
            </p>
          ))}
          {visibleLines.length < lines.length && (
            <p className="text-sm crt-cursor" style={{ color: 'var(--crt-dim)' }}>&gt; </p>
          )}
        </div>

        {/* Right — stats */}
        <div className="w-52 flex flex-col gap-3">

          {/* Ejection result */}
          <div className="ascii-box py-2 px-3 text-center" style={{ borderColor: ejected ? (ejectedWasIntern ? 'var(--crt-accent)' : 'var(--crt-red)') : 'var(--crt-dim)' }}>
            <p className="font-terminal text-xs" style={{ color: 'var(--crt-dim)' }}>EJECTED</p>
            <p className={`font-terminal text-lg ${ejected ? (ejectedWasIntern ? 'crt-glow-accent' : 'crt-glow-red') : 'crt-glow'}`}>
              {ejected ?? 'NOBODY'}
            </p>
            {ejected && (
              <p className="text-xs mt-1" style={{ color: ejectedWasIntern ? 'var(--crt-accent)' : 'var(--crt-red)' }}>
                {ejectedWasIntern ? '✓ WAS INTERN' : '✗ WAS ENGINEER'}
              </p>
            )}
          </div>

          {/* Task progress */}
          <div className="ascii-box py-2 px-3">
            <p className="font-terminal text-xs mb-1" style={{ color: 'var(--crt-dim)' }}>TASK PROGRESS</p>
            <div className="h-2 w-full mb-1" style={{ background: '#0b0f0b', border: '1px solid var(--crt-dim)' }}>
              <div
                className="h-full transition-all duration-700"
                style={{ width: `${pct}%`, background: 'var(--crt-green)', boxShadow: 'var(--crt-glow)' }}
              />
            </div>
            <p className="text-xs crt-glow">{tasksCompleted} / {totalTasks} <span style={{ color: 'var(--crt-dim)' }}>({pct}%)</span></p>
          </div>

          {/* Alive crew */}
          <div className="ascii-box py-2 px-3">
            <p className="font-terminal text-xs mb-1" style={{ color: 'var(--crt-dim)' }}>CREW REMAINING</p>
            {alivePlayers.map((p) => (
              <div key={p} className="flex items-center gap-1 text-xs py-0.5">
                <span style={{ color: 'var(--crt-green)' }}>●</span>
                <span className="crt-glow font-terminal">{p}</span>
              </div>
            ))}
          </div>

          {/* Intern hint */}
          <div className="ascii-box py-2 px-3" style={{ borderColor: 'rgba(255,51,51,0.3)' }}>
            <p className="font-terminal text-xs" style={{ color: 'var(--crt-dim)' }}>INTERN STATUS</p>
            <p className="text-xs mt-1" style={{ color: 'var(--crt-red)', textShadow: 'var(--crt-glow-red)' }}>
              {alivePlayers.includes(internName)
                ? '██ STILL ABOARD ██'
                : '✓ NEUTRALISED'}
            </p>
          </div>

        </div>
      </div>

      {/* Continue button / countdown */}
      {showContinue && (
        <div className="flex flex-col items-center gap-2">
          <button
            className="crt-button crt-button-accent px-8 py-2 text-lg"
            onClick={onComplete}
          >
            ▶ NEXT ROUND
          </button>
          {countdown !== null && countdown > 0 && (
            <p className="text-xs" style={{ color: 'var(--crt-dim)' }}>
              AUTO-ADVANCING IN {countdown}s...
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default RoundSummaryScreen;
