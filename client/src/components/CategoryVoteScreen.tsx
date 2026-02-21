import { useState, useEffect } from 'react';

interface CategoryVoteScreenProps {
  round: number;
  totalPlayers: number;
  votes: Record<string, number>;   // live from server
  onVote: (category: string) => void;
  onComplete: (category: string) => void; // called when category_selected fires
  selectedCategory: string;        // set by server when voting ends
}

const CATEGORIES = ['FRONTEND', 'BACKEND', 'OOPS', 'DSA'];
const VOTE_TIMEOUT = 20;

const CategoryVoteScreen: React.FC<CategoryVoteScreenProps> = ({
  round, totalPlayers, votes, onVote, onComplete, selectedCategory,
}) => {
  const [timer, setTimer] = useState(VOTE_TIMEOUT);
  const [voted, setVoted] = useState(false);

  // When server picks a winner, advance
  useEffect(() => {
    if (selectedCategory) {
      setTimeout(() => onComplete(selectedCategory), 1200);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

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
      <p className="text-xs mb-6" style={{ color: 'var(--crt-dim)' }}>
        {totalVotes}/{totalPlayers} VOTES CAST
      </p>

      <div className="space-y-4 w-full max-w-lg">
        {CATEGORIES.map((cat) => {
          const count = votes[cat] ?? 0;
          const pct = totalPlayers > 0 ? (count / totalPlayers) * 100 : 0;
          const isMyVote = voted;
          return (
            <button
              key={cat}
              className="w-full text-left ascii-box cursor-pointer transition-all"
              onClick={() => handleVote(cat)}
              disabled={voted || !!selectedCategory}
              style={{ borderColor: voted ? 'var(--crt-dim)' : undefined }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="crt-glow font-terminal text-lg">{cat}</span>
                <span style={{ color: 'var(--crt-dim)' }}>
                  [{count} VOTE{count !== 1 ? 'S' : ''}]
                </span>
              </div>
              <div className="h-2 w-full" style={{ background: 'var(--crt-bg)', border: '1px solid var(--crt-dim)' }}>
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: 'var(--crt-green)', boxShadow: 'var(--crt-glow)' }}
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
        <p className="crt-glow-accent font-terminal text-xl mt-8 crt-glitch">
          ▶ {selectedCategory} SELECTED
        </p>
      )}
    </div>
  );
};

export default CategoryVoteScreen;
