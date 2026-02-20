import { useEffect, useState } from 'react';

interface EmergencyScreenProps {
  trigger: 'button' | 'timer';
  onComplete: () => void;
}

const GLITCH_CHARS = '!@#$%^&*<>?/|\\~`';
const randomGlitch = (text: string) =>
  text
    .split('')
    .map((c) =>
      Math.random() < 0.15
        ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
        : c
    )
    .join('');

const LINES_BUTTON = [
  '> EMERGENCY PROTOCOL TRIGGERED',
  '> ALL TASKS SUSPENDED',
  '> INITIATING CREW ASSEMBLY...',
  '> STAND BY FOR VOTE SEQUENCE',
];

const LINES_TIMER = [
  '> ROUND TIMER EXPIRED',
  '> SUSPICIOUS ACTIVITY DETECTED',
  '> CALLING EMERGENCY MEETING...',
  '> STAND BY FOR VOTE SEQUENCE',
];

const EmergencyScreen: React.FC<EmergencyScreenProps> = ({ trigger, onComplete }) => {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [glitching, setGlitching] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [headerText, setHeaderText] = useState('⚠ EMERGENCY MEETING ⚠');
  const [flashRed, setFlashRed] = useState(false);

  const LINES = trigger === 'button' ? LINES_BUTTON : LINES_TIMER;

  // Flash red every 400 ms for dramatic effect
  useEffect(() => {
    const interval = setInterval(() => setFlashRed((f) => !f), 400);
    return () => clearInterval(interval);
  }, []);

  // Glitch the header text continuously
  useEffect(() => {
    const interval = setInterval(() => {
      setHeaderText(randomGlitch('⚠ EMERGENCY MEETING ⚠'));
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Reveal terminal lines one by one
  useEffect(() => {
    let idx = 0;
    const reveal = () => {
      if (idx < LINES.length) {
        const line = LINES[idx];
        idx++;
        setVisibleLines((prev) => [...prev, line]);
        setTimeout(reveal, 700);
      } else {
        // All lines shown — start glitch burst then countdown
        setGlitching(true);
        setTimeout(() => {
          setGlitching(false);
          setCountdown(3);
        }, 900);
      }
    };
    const initial = setTimeout(reveal, 600);
    return () => clearTimeout(initial);
  }, []);

  // Countdown 3 → 2 → 1 → call onComplete
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      onComplete();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => (c ?? 1) - 1), 900);
    return () => clearTimeout(t);
  }, [countdown, onComplete]);

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center font-mono relative overflow-hidden"
      style={{
        background: flashRed ? '#1a0000' : '#0b0f0b',
        transition: 'background 0.15s',
      }}
    >
      {/* Pulsing red border */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          border: `3px solid ${flashRed ? 'var(--crt-red)' : 'transparent'}`,
          boxShadow: flashRed
            ? 'inset 0 0 60px #ff333344, 0 0 40px #ff333333'
            : 'none',
          transition: 'all 0.15s',
        }}
      />

      {/* WARNING badge */}
      <div
        className="mb-6 px-6 py-1 border font-terminal text-xs tracking-widest"
        style={{
          borderColor: 'var(--crt-red)',
          color: 'var(--crt-red)',
          textShadow: 'var(--crt-glow-red)',
          letterSpacing: '0.3em',
        }}
      >
        ██ SYSTEM ALERT ██
      </div>

      {/* Main header */}
      <h1
        className={`font-terminal text-5xl mb-8 text-center ${glitching ? 'crt-glitch' : ''}`}
        style={{
          color: 'var(--crt-red)',
          textShadow: 'var(--crt-glow-red)',
          letterSpacing: '0.1em',
          minHeight: '4rem',
        }}
      >
        {headerText}
      </h1>

      {/* Separator */}
      <div
        className="w-full max-w-lg mb-6"
        style={{ borderTop: '1px solid var(--crt-red)', opacity: 0.6 }}
      />

      {/* Terminal lines */}
      <div className="w-full max-w-lg space-y-2 mb-8 px-2">
        {visibleLines.map((line, i) => (
          <p
            key={i}
            className="font-mono text-sm"
            style={{
              color: 'var(--crt-red)',
              textShadow: 'var(--crt-glow-red)',
              animation: 'fadeInLine 0.3s ease-out',
            }}
          >
            {line}
          </p>
        ))}
        {/* Blinking cursor on last line */}
        {visibleLines.length < LINES.length && (
          <p
            className="font-mono text-sm crt-cursor"
            style={{ color: 'var(--crt-red)' }}
          >
            &gt;{' '}
          </p>
        )}
      </div>

      {/* Countdown */}
      {countdown !== null && countdown > 0 && (
        <div className="flex flex-col items-center gap-2">
          <p
            className="font-terminal text-lg"
            style={{ color: 'var(--crt-dim)', textShadow: 'var(--crt-glow)' }}
          >
            ASSEMBLING CREW IN
          </p>
          <p
            className="font-terminal text-8xl crt-glitch"
            style={{
              color: 'var(--crt-red)',
              textShadow: 'var(--crt-glow-red)',
            }}
          >
            {countdown}
          </p>
        </div>
      )}

      {/* Decorative corner brackets */}
      {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map(
        (pos, i) => (
          <span
            key={i}
            className={`absolute ${pos} font-terminal text-2xl pointer-events-none`}
            style={{
              color: 'var(--crt-red)',
              textShadow: 'var(--crt-glow-red)',
              opacity: 0.5,
            }}
          >
            {i === 0 ? '┌' : i === 1 ? '┐' : i === 2 ? '└' : '┘'}
          </span>
        )
      )}
    </div>
  );
};

export default EmergencyScreen;
