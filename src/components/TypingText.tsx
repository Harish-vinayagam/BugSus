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
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setDone(true);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span className={`crt-glow ${className}`}>
      {displayed}
      {showCursor && !done && <span className="crt-cursor" />}
    </span>
  );
};

export default TypingText;
