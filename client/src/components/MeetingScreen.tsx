import { useState, useEffect, useRef } from 'react';
import type { Player, VoteResultPayload } from '../../../shared/types';

interface MeetingScreenProps {
  playerName: string;
  players: Player[];                     // alive players from server
  triggeredBy: string;
  ejectionVotes: Record<string, number>; // targetId → count (live from server)
  voteResult: VoteResultPayload | null;  // set by server when voting ends
  onCastVote: (targetId: string | 'SKIP') => void;
  onComplete: () => void;
}

const MeetingScreen: React.FC<MeetingScreenProps> = ({
  playerName, players, triggeredBy, ejectionVotes, voteResult, onCastVote, onComplete,
}) => {
  const [timer, setTimer] = useState(30);
  const [voted, setVoted] = useState(false);
  const advancedRef = useRef(false);

  // When server sends vote result, show reveal then advance
  useEffect(() => {
    if (voteResult && !advancedRef.current) {
      advancedRef.current = true;
      setTimeout(() => onComplete(), 4000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voteResult]);

  // Visual countdown only — server owns the real deadline
  useEffect(() => {
    if (voteResult) return;
    const interval = setInterval(() => {
      setTimer((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [voteResult]);

  const handleVote = (targetId: string | 'SKIP') => {
    if (voted) return;
    setVoted(true);
    onCastVote(targetId);
  };

  return (
    <div className="h-full flex flex-col items-center justify-center font-mono">
      {/* Header */}
      <div className="text-center mb-6 w-full max-w-lg" style={{ borderBottom: '1px solid var(--crt-red)', paddingBottom: '1rem' }}>
        <p className="crt-glow-red font-terminal text-3xl crt-glitch">⚠ EMERGENCY MEETING ⚠</p>
        <p className="text-xs mt-1" style={{ color: 'var(--crt-dim)' }}>
          TRIGGERED BY: <span className="crt-glow font-terminal">{triggeredBy}</span>
        </p>
        <p className={`font-terminal text-xl mt-2 ${timer <= 5 ? 'crt-glow-red' : 'crt-glow'}`}>
          TIME: {timer}s
        </p>
      </div>

      {/* Voting phase */}
      {!voteResult && (
        <div className="space-y-3 w-full max-w-lg">
          <p className="text-center mb-4 text-xs" style={{ color: 'var(--crt-dim)' }}>
            VOTE TO EJECT A SUSPECT — MAJORITY WINS:
          </p>
          {players.map((player) => {
            const voteCount = ejectionVotes[player.id] ?? 0;
            const isMe = player.username === playerName;
            return (
              <button
                key={player.id}
                className="w-full ascii-box cursor-pointer text-left flex items-center justify-between transition-all"
                onClick={() => !isMe && handleVote(player.id)}
                disabled={voted || isMe}
                style={{ borderColor: 'var(--crt-dim)', opacity: isMe ? 0.45 : 1 }}
              >
                <span className="crt-glow font-terminal text-lg">{player.username}</span>
                <div className="flex items-center gap-3">
                  {voteCount > 0 && (
                    <span className="text-xs crt-glow-red font-terminal">
                      {'▮'.repeat(Math.min(voteCount, 5))} {voteCount}
                    </span>
                  )}
                  <span style={{ color: 'var(--crt-dim)', fontSize: '0.75rem' }}>
                    {isMe ? '(YOU)' : '[VOTE]'}
                  </span>
                </div>
              </button>
            );
          })}
          <button className="w-full crt-button mt-2 text-sm" onClick={() => handleVote('SKIP')} disabled={voted}>
            SKIP VOTE
          </button>
          {voted && (
            <p className="text-center text-sm crt-glow-red font-terminal mt-2">
              VOTE CAST — WAITING FOR RESULTS...
            </p>
          )}
        </div>
      )}

      {/* Result reveal */}
      {voteResult && (
        <div className="text-center space-y-5 w-full max-w-lg">
          {voteResult.ejectedUsername ? (
            <>
              <p className="font-terminal text-5xl crt-glitch" style={{ color: 'var(--crt-red)', textShadow: 'var(--crt-glow-red)' }}>
                {voteResult.ejectedUsername}
              </p>
              <p className="crt-glow font-terminal text-xl">HAS BEEN EJECTED</p>
              <div className="ascii-box py-3 px-4 mt-4 text-center" style={{ borderColor: voteResult.ejectedWasIntern ? 'var(--crt-accent)' : 'var(--crt-red)' }}>
                {voteResult.ejectedWasIntern ? (
                  <>
                    <p className="font-terminal text-2xl crt-glow-accent">✓ INTERN FOUND</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--crt-dim)' }}>
                      {voteResult.ejectedUsername} WAS THE INTERN. GOOD CALL.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-terminal text-2xl crt-glow-red">✗ WRONG EJECT</p>
                    <p className="text-sm mt-1" style={{ color: 'var(--crt-dim)' }}>
                      {voteResult.ejectedUsername} WAS AN ENGINEER. INTERN REMAINS.
                    </p>
                  </>
                )}
              </div>
            </>
          ) : (
            <p className="crt-glow font-terminal text-2xl">NO ONE WAS EJECTED</p>
          )}
          <p className="font-mono text-xs mt-4" style={{ color: 'var(--crt-dim)' }}>. . . RETURNING TO GAME . . .</p>
        </div>
      )}
    </div>
  );
};

export default MeetingScreen;
