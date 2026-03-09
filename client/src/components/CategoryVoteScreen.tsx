import { useState, useEffect, useMemo } from 'react';

interface CategoryVoteScreenProps {
  round: number;
  totalPlayers: number;
  votes: Record<string, number>;   // live from server
  onVote: (category: string) => void;
  onComplete: (category: string) => void;
  selectedCategory: string;        // set by server when voting ends
}

const CATEGORIES = ['FRONTEND', 'BACKEND', 'OOPS', 'DSA'];
const VOTE_TIMEOUT = 30;

const CategoryVoteScreen: React.FC<CategoryVoteScreenProps> = ({
  round, totalPlayers, votes, onVote, onComplete, selectedCategory,
}) => {
  const [timer, setTimer] = useState(VOTE_TIMEOUT);
  const [voted, setVoted] = useState(false);

  // Work out which categories are tied for the lead (used for tie UI)
  const tiedCategories = useMemo(() => {
    const counts = Object.values(votes);
    if (counts.length === 0) return [];
    const max = Math.max(...counts);
    if (max === 0) return [];
    const tied = CATEGORIES.filter((c) => (votes[c] ?? 0) === max);
    return tied.length > 1 ? tied : [];
  }, [votes]);

  const isTied = tiedCategories.length > 1;

  // Visual countdown — server enforces the real deadline
  useEffect(() => {
    if (selectedCategory) return;
    const interval = setInterval(() => {
      setTimer((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedCategory]);

  const handleVote = (cat: string) => {
    if (voted) return;
    setVoted(true);
    onVote(cat);
  };

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);

  return (
    <div className="h-full flex flex-col items-center justify-center font-mono">
      <p className="crt-glow font-terminal text-2xl mb-2">SELECT CATEGORY</p>
      <p className="font-terminal text-sm mb-1" style={{ color: 'var(--crt-dim)' }}>
        ROUND {round} / 3
      </p>
      <p className="crt-glow mb-2" style={{ color: 'var(--crt-dim)' }}>
        TIME:{' '}
        <span className={`font-terminal text-xl ${timer <= 5 ? 'crt-glow-red' : 'crt-glow'}`}>
          {String(timer).padStart(2, '0')}s
        </span>
      </p>
      <p className="text-xs mb-1" style={{ color: 'var(--crt-dim)' }}>
        {totalVotes}/{totalPlayers} VOTES CAST
      </p>

      {/* Tie indicator */}
      {isTied && !selectedCategory && (
        <p className="font-terminal text-sm mb-4 crt-cursor" style={{ color: 'var(--crt-amber)' }}>
          ⚡ TIE DETECTED — RANDOM PICK IF TIED AT END
        </p>
      )}
      {!isTied && <div className="mb-4" />}

      <div className="space-y-4 w-full max-w-lg">
        {CATEGORIES.map((cat) => {
          const count = votes[cat] ?? 0;
          const pct = totalPlayers > 0 ? (count / totalPlayers) * 100 : 0;
          const isTiedCat = isTied && tiedCategories.includes(cat);
          const isWinner = selectedCategory === cat;

          return (
            <button
              key={cat}
              className="w-full text-left ascii-box cursor-pointer transition-all"
              onClick={() => handleVote(cat)}
              disabled={voted || !!selectedCategory}
              style={{
                borderColor: isWinner
                  ? 'var(--crt-accent)'
                  : isTiedCat
                  ? 'var(--crt-amber)'
                  : voted
                  ? 'var(--crt-dim)'
                  : undefined,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={isWinner ? 'crt-glow-accent font-terminal text-lg' : 'crt-glow font-terminal text-lg'}
                  style={isTiedCat && !selectedCategory ? { color: 'var(--crt-amber)' } : undefined}
                >
                  {isWinner ? '▶ ' : isTiedCat && !selectedCategory ? '⚡ ' : ''}{cat}
                </span>
                <span style={{ color: isWinner ? 'var(--crt-accent)' : 'var(--crt-dim)' }}>
                  [{count} VOTE{count !== 1 ? 'S' : ''}]
                </span>
              </div>
              <div
                className="h-2 w-full"
                style={{ background: 'var(--crt-bg)', border: `1px solid ${isTiedCat && !selectedCategory ? 'var(--crt-amber)' : 'var(--crt-dim)'}` }}
              >
                <div
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${pct}%`,
                    background: isWinner
                      ? 'var(--crt-accent)'
                      : isTiedCat && !selectedCategory
                      ? 'var(--crt-amber)'
                      : 'var(--crt-green)',
                    boxShadow: isWinner ? 'var(--crt-glow-accent)' : 'var(--crt-glow)',
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {voted && !selectedCategory && (
        <p className="crt-glow font-terminal text-sm mt-6" style={{ color: 'var(--crt-dim)' }}>
          VOTE CAST — WAITING FOR OTHER PLAYERS...
        </p>
      )}

      {selectedCategory && (
        <div className="mt-8 text-center space-y-1">
          <p className="crt-glow-accent font-terminal text-xl crt-glitch">
            ▶ {selectedCategory} SELECTED
          </p>
          {/* Show if this was a random tiebreak */}
          {isTied && (
            <p className="font-terminal text-xs" style={{ color: 'var(--crt-amber)' }}>
              (TIE BROKEN BY RANDOM SELECTION)
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryVoteScreen;
