import { useState, useEffect } from 'react';

interface CategoryVoteScreenProps {
  round: number;
  onComplete: (category: string) => void;
}

const CATEGORIES = ['FRONTEND', 'BACKEND', 'OOPS', 'DSA'];

const CategoryVoteScreen: React.FC<CategoryVoteScreenProps> = ({ round, onComplete }) => {
  const [timer, setTimer] = useState(15);
  const [votes, setVotes] = useState<Record<string, number>>({
    FRONTEND: 0,
    BACKEND: 0,
    OOPS: 0,
    DSA: 0,
  });
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate other player votes
  useEffect(() => {
    const timers = [
      setTimeout(() => setVotes((v) => ({ ...v, BACKEND: v.BACKEND + 1 })), 3000),
      setTimeout(() => setVotes((v) => ({ ...v, FRONTEND: v.FRONTEND + 1 })), 5000),
      setTimeout(() => setVotes((v) => ({ ...v, BACKEND: v.BACKEND + 1 })), 8000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (timer === 0) {
      const winner = Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
      setTimeout(() => onComplete(winner), 1500);
    }
  }, [timer]);

  const handleVote = (cat: string) => {
    if (voted) return;
    setVoted(true);
    setVotes((v) => ({ ...v, [cat]: v[cat] + 1 }));
  };

  const maxVotes = Math.max(...Object.values(votes), 1);

  return (
    <div className="h-full flex flex-col items-center justify-center font-mono">
      <p className="crt-glow font-terminal text-2xl mb-2">SELECT CATEGORY</p>
      <p className="font-terminal text-sm mb-1" style={{ color: 'var(--crt-dim)' }}>ROUND {round} / 3</p>
      <p className="crt-glow mb-8" style={{ color: 'var(--crt-dim)' }}>
        TIME REMAINING:{' '}
        <span
          className={`font-terminal text-xl ${timer <= 5 ? 'crt-glow-red' : 'crt-glow'}`}
        >
          {String(timer).padStart(2, '0')}s
        </span>
      </p>

      <div className="space-y-4 w-full max-w-lg">
        {CATEGORIES.map((cat) => {
          const pct = maxVotes > 0 ? (votes[cat] / 4) * 100 : 0;
          return (
            <button
              key={cat}
              className={`w-full text-left ascii-box cursor-pointer transition-all ${voted ? '' : 'hover:border-[var(--crt-green)]'}`}
              onClick={() => handleVote(cat)}
              disabled={voted}
              style={{ borderColor: voted ? 'var(--crt-dim)' : undefined }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="crt-glow font-terminal text-lg">{cat}</span>
                <span className="crt-glow" style={{ color: 'var(--crt-dim)' }}>
                  [{votes[cat]}]
                </span>
              </div>
              <div className="h-2 w-full" style={{ background: 'var(--crt-bg)', border: '1px solid var(--crt-dim)' }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: 'var(--crt-green)',
                    boxShadow: 'var(--crt-glow)',
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {timer === 0 && (
        <p className="crt-glow-accent font-terminal text-xl mt-8 crt-glitch">
          CATEGORY SELECTED...
        </p>
      )}
    </div>
  );
};

export default CategoryVoteScreen;
