import { useState, useEffect } from 'react';

interface FinalScreenProps {
  winner: 'engineers' | 'intern';
  internName: string;
  playerRole: 'engineer' | 'intern';
  onPlayAgain: () => void;
  onExit: () => void;
}

const FinalScreen: React.FC<FinalScreenProps> = ({ winner, internName, playerRole, onPlayAgain, onExit }) => {
  const [confetti, setConfetti] = useState<{ id: number; left: number; delay: number }[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (winner === 'engineers') {
      const pieces = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
      }));
      setConfetti(pieces);
    }
    const t = setTimeout(() => setShowDetails(true), 800);
    return () => clearTimeout(t);
  }, [winner]);

  const isWin = winner === 'engineers';
  const playerWon = (isWin && playerRole === 'engineer') || (!isWin && playerRole === 'intern');

  return (
    <div className="h-full flex flex-col items-center justify-center font-mono relative overflow-hidden">
      {/* Confetti for engineer win */}
      {isWin && confetti.map((c) => (
        <div
          key={c.id}
          className="confetti-green"
          style={{ left: `${c.left}%`, animationDelay: `${c.delay}s`, top: '-10px' }}
        />
      ))}

      <div className={`text-center space-y-5 ${!isWin ? 'crt-glitch' : ''}`}>
        {/* Big ASCII outcome */}
        <pre className={`font-terminal text-lg leading-tight ${isWin ? 'crt-glow' : 'crt-glow-red'}`}>
          {isWin
            ? `
 ██╗    ██╗██╗███╗   ██╗
 ██║    ██║██║████╗  ██║
 ██║ █╗ ██║██║██╔██╗ ██║
 ██║███╗██║██║██║╚██╗██║
 ╚███╔███╔╝██║██║ ╚████║
  ╚══╝╚══╝ ╚═╝╚═╝  ╚═══╝`
            : `
 ███████╗ █████╗ ██╗██╗     
 ██╔════╝██╔══██╗██║██║     
 █████╗  ███████║██║██║     
 ██╔══╝  ██╔══██║██║██║     
 ██║     ██║  ██║██║███████╗
 ╚═╝     ╚═╝  ╚═╝╚═╝╚══════╝`}
        </pre>

        <p className={`font-terminal text-2xl ${isWin ? 'crt-glow' : 'crt-glow-red'}`}>
          {isWin ? 'CODE COMPILED. INTERN EXPOSED.' : 'SABOTAGE SUCCESSFUL.'}
        </p>

        <p className="font-mono text-sm" style={{ color: 'var(--crt-dim)' }}>
          {isWin
            ? 'THE CODEBASE IS SAFE. FOR NOW.'
            : 'THE INTERN HAS CORRUPTED THE REPO.'}
        </p>

        {/* Intern reveal card */}
        {showDetails && (
          <div
            className="ascii-box py-3 px-6 mx-auto max-w-sm text-center mt-2"
            style={{
              borderColor: isWin ? 'var(--crt-accent)' : 'var(--crt-red)',
              background: 'rgba(0,0,0,0.4)',
              animation: 'fadeInLine 0.4s ease-out',
            }}
          >
            <p className="text-xs mb-1" style={{ color: 'var(--crt-dim)' }}>THE INTERN WAS</p>
            <p
              className="font-terminal text-3xl"
              style={{
                color: isWin ? 'var(--crt-accent)' : 'var(--crt-red)',
                textShadow: isWin ? 'var(--crt-glow-accent)' : 'var(--crt-glow-red)',
              }}
            >
              {internName || 'UNKNOWN'}
            </p>
            <p
              className="text-xs mt-2 font-terminal"
              style={{ color: playerWon ? 'var(--crt-green)' : 'var(--crt-red)' }}
            >
              {playerWon ? '▲ YOU WIN THIS ROUND' : '▼ YOU LOSE THIS ROUND'}
            </p>
          </div>
        )}

        <div className="flex gap-4 justify-center mt-6">
          <button className="crt-button crt-button-accent text-lg px-8 py-2" onClick={onPlayAgain}>
            PLAY_AGAIN
          </button>
          <button className="crt-button text-lg px-8 py-2" onClick={onExit}>
            EXIT_TO_HOME
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalScreen;
