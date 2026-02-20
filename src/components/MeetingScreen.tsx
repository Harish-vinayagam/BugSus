import { useState, useEffect } from 'react';

interface MeetingScreenProps {
  playerName: string;
  players: string[];
  onComplete: (ejected: string | null) => void;
}

const MeetingScreen: React.FC<MeetingScreenProps> = ({ playerName, players, onComplete }) => {
  const [timer, setTimer] = useState(20);
  const [voted, setVoted] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [phase, setPhase] = useState<'voting' | 'reveal'>('voting');
  const [ejected, setEjected] = useState<string | null>(null);

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

  // Simulate AI votes
  useEffect(() => {
    const others = players.filter((p) => p !== playerName);
    const target = others[Math.floor(Math.random() * others.length)];
    others.forEach((voter, i) => {
      setTimeout(() => {
        setVotes((v) => ({
          ...v,
          [target]: (v[target] || 0) + 1,
        }));
      }, 5000 + i * 3000);
    });
  }, []);

  useEffect(() => {
    if (timer === 0 && phase === 'voting') {
      setPhase('reveal');
      const finalVotes = { ...votes };
      if (voted) finalVotes[voted] = (finalVotes[voted] || 0) + 1;
      const sorted = Object.entries(finalVotes).sort((a, b) => b[1] - a[1]);
      const ej = sorted.length > 0 ? sorted[0][0] : null;
      setEjected(ej);
      setTimeout(() => onComplete(ej), 3000);
    }
  }, [timer, phase]);

  const handleVote = (target: string) => {
    if (voted || phase !== 'voting') return;
    setVoted(target);
    setVotes((v) => ({ ...v, [target]: (v[target] || 0) + 1 }));
  };

  return (
    <div className="h-full flex flex-col items-center justify-center font-mono">
      <div
        className="text-center mb-6"
        style={{
          borderBottom: '1px solid var(--crt-red)',
          paddingBottom: '1rem',
        }}
      >
        <p className="crt-glow-red font-terminal text-3xl crt-glitch">
          ⚠ EMERGENCY MEETING ⚠
        </p>
        <p className={`font-terminal text-xl mt-2 ${timer <= 5 ? 'crt-glow-red' : 'crt-glow'}`}>
          TIME: {timer}s
        </p>
      </div>

      {phase === 'voting' && (
        <div className="space-y-3 w-full max-w-md">
          <p className="crt-glow text-center mb-4">VOTE TO EJECT:</p>
          {players.map((player) => (
            <button
              key={player}
              className={`w-full ascii-box cursor-pointer text-left flex items-center justify-between ${voted === player ? 'border-[var(--crt-red)]' : ''}`}
              onClick={() => handleVote(player)}
              disabled={!!voted || player === playerName}
              style={{
                borderColor: voted === player ? 'var(--crt-red)' : 'var(--crt-dim)',
                opacity: player === playerName ? 0.5 : 1,
              }}
            >
              <span className="crt-glow font-terminal text-lg">{player}</span>
              <span style={{ color: 'var(--crt-dim)' }}>
                {player === playerName ? '(YOU)' : voted === player ? '[VOTED]' : '[VOTE]'}
              </span>
            </button>
          ))}
          <button
            className="w-full crt-button mt-2"
            onClick={() => { if (!voted) setVoted('SKIP'); }}
            disabled={!!voted}
          >
            SKIP VOTE
          </button>
        </div>
      )}

      {phase === 'reveal' && (
        <div className="text-center space-y-4">
          {ejected ? (
            <>
              <p className="crt-glow-red font-terminal text-4xl crt-glitch">{ejected}</p>
              <p className="crt-glow font-terminal text-xl">HAS BEEN EJECTED</p>
              <p className="font-mono" style={{ color: 'var(--crt-dim)' }}>
                . . .
              </p>
            </>
          ) : (
            <p className="crt-glow font-terminal text-2xl">NO ONE WAS EJECTED</p>
          )}
        </div>
      )}
    </div>
  );
};

export default MeetingScreen;
