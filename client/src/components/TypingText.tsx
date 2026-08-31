import { useState, useEffect } from 'react';

interface TypingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  showCursor?: boolean;
}

const TypingText: React.FC<TypingTextProps> = ({
  text,
  speed = 40,
  onComplete,
  className = '',
  showCursor = true,
}) => {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);

    let fallbackInterval: ReturnType<typeof setInterval> | null = null;
    let worker: Worker | null = null;

    const startFallback = () => {
      let i = 0;
      fallbackInterval = setInterval(() => {
        if (i < text.length) {
          setDisplayed(text.slice(0, i + 1));
          i++;
        } else {
          if (fallbackInterval) clearInterval(fallbackInterval);
          setDone(true);
          onComplete?.();
        }
      }, speed);
    };

    // Try to use a dedicated Worker so timers aren't throttled when tab is hidden.
    try {
      if (typeof Worker !== 'undefined') {
        // Vite supports importing workers via new URL(..., import.meta.url)
        worker = new Worker(new URL('../workers/typingWorker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (e: MessageEvent<any>) => {
          const data = e.data;
          if (typeof data.i === 'number') {
            setDisplayed(text.slice(0, data.i));
          }
          if (data.done) {
            setDone(true);
            onComplete?.();
          }
        };
        worker.postMessage({ cmd: 'start', speed, length: text.length });
      } else {
        startFallback();
      }
    } catch (err) {
      // Worker creation can fail in some environments; fall back to timers
      startFallback();
    }

    return () => {
      if (worker) {
        try { worker.postMessage({ cmd: 'stop' }); } catch (e) {}
        worker.terminate();
      }
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [text, speed]);

  return (
    <span className={`crt-glow ${className}`}>
      {displayed}
      {showCursor && !done && <span className="crt-cursor" />}
    </span>
  );
};

export default TypingText;
