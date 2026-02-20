import { useState, useEffect } from 'react';

interface FinalScreenProps {
  winner: 'engineers' | 'intern';
  onPlayAgain: () => void;
  onExit: () => void;
}

const FinalScreen: React.FC<FinalScreenProps> = ({ winner, onPlayAgain, onExit }) => {
  const [confetti, setConfetti] = useState<{ id: number; left: number; delay: number }[]>([]);

  useEffect(() => {
    if (winner === 'engineers') {
      const pieces = Array.from({ length: 30 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
      }));
      setConfetti(pieces);
    }
  }, [winner]);

  const isWin = winner === 'engineers';

  return (
    <div className="h-full flex flex-col items-center justify-center font-mono relative overflow-hidden">
      {/* Green confetti for engineer win */}
      {isWin && confetti.map((c) => (
        <div
          key={c.id}
          className="confetti-green"
          style={{
            left: `${c.left}%`,
            animationDelay: `${c.delay}s`,
            top: '-10px',
          }}
        />
      ))}

      <div className={`text-center space-y-6 ${!isWin ? 'crt-glitch' : ''}`}>
        <pre
          className={`font-terminal text-lg leading-tight ${isWin ? 'crt-glow' : 'crt-glow-red'}`}
        >
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

        <p
          className={`font-terminal text-2xl ${isWin ? 'crt-glow' : 'crt-glow-red'}`}
        >
          {isWin ? 'CODE COMPILED. INTERN EXPOSED.' : 'SABOTAGE SUCCESSFUL.'}
        </p>

        <p className="font-mono" style={{ color: 'var(--crt-dim)' }}>
          {isWin
            ? 'THE CODEBASE IS SAFE. FOR NOW.'
            : 'THE INTERN HAS CORRUPTED THE REPO.'}
        </p>

        <div className="flex gap-4 justify-center mt-8">
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
