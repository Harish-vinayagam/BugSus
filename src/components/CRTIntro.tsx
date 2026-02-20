import { useEffect, useState } from 'react';

interface CRTIntroProps {
  onComplete: () => void;
}

/**
 * Full-screen CRT television "power on" intro sequence.
 *
 * Phases (all timings are approximate):
 *   0 – 0 ms   : pitch-black screen
 *   0 – 120 ms : single bright horizontal line flash (tube ignition)
 *   120 – 600ms: line expands vertically with heavy brightness bloom
 *   600 –1 000ms: image stabilises, scanline noise settles
 *   1 000–1 300ms: slight flicker / static burst
 *   1 300 ms   : done – overlay fades out, content shows
 */
const CRTIntro: React.FC<CRTIntroProps> = ({ onComplete }) => {
  // phase: 'flash' | 'expand' | 'stabilise' | 'flicker' | 'done'
  const [phase, setPhase] = useState<'flash' | 'expand' | 'stabilise' | 'flicker' | 'done'>('flash');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('expand'),      120);
    const t2 = setTimeout(() => setPhase('stabilise'),   600);
    const t3 = setTimeout(() => setPhase('flicker'),    1000);
    const t4 = setTimeout(() => setPhase('done'),       1350);
    const t5 = setTimeout(() => onComplete(),           1700);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); clearTimeout(t5); };
  }, [onComplete]);

  if (phase === 'done') {
    return (
      <div
        className="crt-intro-fadeout"
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: '#0b0f0b',
          pointerEvents: 'none',
        }}
      />
    );
  }

  return (
    <div
      className={`crt-intro-overlay crt-intro-${phase}`}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0b0f0b', overflow: 'hidden' }}
    >
      {/* The "tube" element that starts as a thin line and expands */}
      <div className={`crt-tube crt-tube-${phase}`} />

      {/* Static / noise burst shown during flicker phase */}
      {phase === 'flicker' && <div className="crt-intro-static" />}

      {/* Scanlines always on top */}
      <div className="crt-scanlines" style={{ zIndex: 2 }} />
    </div>
  );
};

export default CRTIntro;
