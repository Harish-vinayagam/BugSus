import { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

export type TransitionStyle = 'scan' | 'glitch' | 'dissolve' | 'flicker';

interface CRTTransitionProps {
  /** The key that changes to trigger a transition (e.g. the screen name) */
  transitionKey: string;
  /** Override which style to use for this transition */
  style?: TransitionStyle;
  children: ReactNode;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Pick a style based on the destination screen */
export const styleForScreen = (screen: string): TransitionStyle => {
  if (screen === 'emergency' || screen === 'meeting') return 'glitch';
  if (screen === 'role')                               return 'dissolve';
  if (screen === 'final' || screen === 'summary')      return 'flicker';
  return 'scan';
};

// Durations must match CSS animation lengths below
const EXIT_MS: Record<TransitionStyle, number>  = { scan: 220, glitch: 180, dissolve: 280, flicker: 260 };
const ENTER_MS: Record<TransitionStyle, number> = { scan: 260, glitch: 200, dissolve: 320, flicker: 300 };

// ── Component ──────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'exit' | 'enter';

const CRTTransition: React.FC<CRTTransitionProps> = ({
  transitionKey,
  style,
  children,
}) => {
  const [displayedChildren, setDisplayedChildren] = useState(children);
  const [phase, setPhase]   = useState<Phase>('idle');
  const [activeStyle, setActiveStyle] = useState<TransitionStyle>('scan');
  const pendingKey   = useRef(transitionKey);
  const pendingStyle = useRef<TransitionStyle>('scan');
  const isAnimating  = useRef(false);

  const runTransition = useCallback((newChildren: ReactNode, ts: TransitionStyle) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    setActiveStyle(ts);
    setPhase('exit');

    setTimeout(() => {
      setDisplayedChildren(newChildren);
      setPhase('enter');
      setTimeout(() => {
        setPhase('idle');
        isAnimating.current = false;
      }, ENTER_MS[ts]);
    }, EXIT_MS[ts]);
  }, []);

  useEffect(() => {
    const ts = style ?? styleForScreen(transitionKey);
    pendingKey.current   = transitionKey;
    pendingStyle.current = ts;
    runTransition(children, ts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitionKey]);

  const cls = phase === 'idle'
    ? ''
    : `crt-tx-${activeStyle}-${phase}`;

  return (
    <div className={`crt-tx-wrapper ${cls}`} style={{ height: '100%', width: '100%' }}>
      {displayedChildren}
    </div>
  );
};

export default CRTTransition;
