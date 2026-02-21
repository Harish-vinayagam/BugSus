import { useState, useEffect, useRef } from 'react';

interface MeetingScreenProps {
  playerName: string;
  players: string[];
  /** The actual intern's name — used to reveal correctness after ejection */
  internName: string;
  onComplete: (ejected: string | null) => void;
}

const MeetingScreen: React.FC<MeetingScreenProps> = ({
  playerName,
  players,
  internName,
  onComplete,
}) => {
  const [timer, setTimer] = useState(20);
  const [voted, setVoted] = useState<string | null>(null);
  // Use a ref for votes so the timer callback always sees the latest value
  const votesRef = useRef<Record<string, number>>({});
  const [votesDisplay, setVotesDisplay] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<'voting' | 'reveal'>('voting');
  const [ejected, setEjected] = useState<string | null>(null);
  const timerFiredRef = useRef(false);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate AI votes coming in over time
  useEffect(() => {
    const others = players.filter((p) => p !== playerName);
    if (others.length === 0) return;
    const suspectPool = players.filter((p) => p !== playerName);
    const target = suspectPool[Math.floor(Math.random() * suspectPool.length)];
    const timeouts = others.map((_, i) =>
      setTimeout(() => {
        votesRef.current = {
          ...votesRef.current,
          [target]: (votesRef.current[target] ?? 0) + 1,
        };
        setVotesDisplay({ ...votesRef.current });
      }, 4000 + i * 2500)
    );
    return () => timeouts.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When timer hits 0 → tally and reveal
  useEffect(() => {
    if (timer === 0 && phase === 'voting' && !timerFiredRef.current) {
      timerFiredRef.current = true;
      setPhase('reveal');
      const finalVotes = { ...votesRef.current };
      if (voted && voted !== 'SKIP') {
        finalVotes[voted] = (finalVotes[voted] ?? 0) + 1;
      }
      const sorted = Object.entries(finalVotes).sort((a, b) => b[1] - a[1]);
      const ej = sorted.length > 0 ? sorted[0][0] : null;
      setEjected(ej);
      setTimeout(() => onComplete(ej), 3500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer]);

  const handleVote = (target: string) => {
    if (voted || phase !== 'voting') return;
    setVoted(target);
    if (target !== 'SKIP') {
      votesRef.current = { ...votesRef.current, [target]: (votesRef.current[target] ?? 0) + 1 };
      setVotesDisplay({ ...votesRef.current });
    }
  };

  const ejectedWasIntern = ejected === internName;

  return (
    <div className="h-full flex flex-col items-center justify-center font-mono">
      {/* Header */}
      <div className="text-center mb-6 w-full max-w-lg" style={{ borderBottom: '1px solid var(--crt-red)', paddingBottom: '1rem' }}>
        <p className="crt-glow-red font-terminal text-3xl crt-glitch">⚠ EMERGENCY MEETING ⚠</p>
        <p className={`font-terminal text-xl mt-2 ${timer <= 5 ? 'crt-glow-red' : 'crt-glow'}`}>
          TIME: {timer}s
        </p>
      </div>

      {phase === 'voting' && (
        <div className="space-y-3 w-full max-w-lg">
          <p className="text-center mb-4 text-xs" style={{ color: 'var(--crt-dim)' }}>
            VOTE TO EJECT A SUSPECT — MAJORITY WINS:
          </p>
          {players.map((player) => {
            const voteCount = votesDisplay[player] ?? 0;
            const isMe = player === playerName;
            const isVotedFor = voted === player;
            return (
              <button
                key={player}
                className="w-full ascii-box cursor-pointer text-left flex items-center justify-between transition-all"
                onClick={() => handleVote(player)}
                disabled={!!voted || isMe}
                style={{ borderColor: isVotedFor ? 'var(--crt-red)' : 'var(--crt-dim)', opacity: isMe ? 0.45 : 1 }}
              >
                <span className="crt-glow font-terminal text-lg">{player}</span>
                <div className="flex items-center gap-3">
                  {voteCount > 0 && (
                    <span className="text-xs crt-glow-red font-terminal">
                      {'▮'.repeat(Math.min(voteCount, 5))} {voteCount}
                    </span>
                  )}
                  <span style={{ color: 'var(--crt-dim)', fontSize: '0.75rem' }}>
                    {isMe ? '(YOU)' : isVotedFor ? '[✓ VOTED]' : '[VOTE]'}
                  </span>
                </div>
              </button>
            );
          })}
          <button className="w-full crt-button mt-2 text-sm" onClick={() => handleVote('SKIP')} disabled={!!voted}>
            SKIP VOTE
          </button>
          {voted && voted !== 'SKIP' && (
            <p className="text-center text-sm crt-glow-red font-terminal mt-2">
              VOTE CAST FOR {voted} — WAITING FOR RESULTS...
            </p>
          )}
        </div>
      )}

      {phase === 'reveal' && (
        <div className="text-center space-y-5 w-full max-w-lg">
          {ejected ? (
            <>
              <p className="font-terminal text-5xl crt-glitch" style={{ color: 'var(--crt-red)', textShadow: 'var(--crt-glow-red)' }}>
                {ejected}
              </p>
              <p className="crt-glow font-terminal text-xl">HAS BEEN EJECTED</p>
              <div className="ascii-box py-3 px-4 mt-4 text-center" style={{ borderColor: ejectedWasIntern ? 'var(--crt-accent)' : 'var(--crt-red)' }}>
                {ejectedWasIntern ? (
                  <>
                    <p className="font-terminal text-2xl crt-glow-accent">✓ INTERN FOUND</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--crt-dim)' }}>{ejected} WAS THE INTERN. GOOD CALL.</p>
                  </>
                ) : (
                  <>
                    <p className="font-terminal text-2xl crt-glow-red">✗ WRONG EJECT</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--crt-dim)' }}>{ejected} WAS AN ENGINEER. THE INTERN REMAINS.</p>
                  </>
                )}
              </div>
            </>
          ) : (
            <p className="crt-glow font-terminal text-2xl">NO ONE WAS EJECTED</p>
          )}
          <p className="font-mono text-xs" style={{ color: 'var(--crt-dim)' }}>. . . RETURNING TO GAME . . .</p>
        </div>
      )}
    </div>
  );
};

export default MeetingScreen;
