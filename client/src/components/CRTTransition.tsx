import { useState, useEffect, useRef } from 'react';
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
  // During an exit animation we freeze the OLD children so the outgoing screen
  // stays visible while it animates away.  At ALL other times we render the
  // live `children` prop so that prop updates (e.g. socketStatus changing from
  // 'connecting' → 'in_room') are never swallowed by a stale snapshot.
  const [frozenChildren, setFrozenChildren] = useState<ReactNode>(null);
  const [phase, setPhase]   = useState<Phase>('idle');
  const [activeStyle, setActiveStyle] = useState<TransitionStyle>('scan');
  const prevKeyRef = useRef(transitionKey);
  const isAnimating  = useRef(false);

  useEffect(() => {
    // Only animate when the screen (transitionKey) actually changes
    if (transitionKey === prevKeyRef.current) return;

    const ts = style ?? styleForScreen(transitionKey);
    prevKeyRef.current = transitionKey;

    if (isAnimating.current) {
      // A transition is already running — just let it finish; the new children
      // will appear naturally when phase goes back to 'idle'.
      return;
    }

    isAnimating.current = true;
    setActiveStyle(ts);

    // Freeze current children for the exit animation
    setFrozenChildren(children);
    setPhase('exit');

    setTimeout(() => {
      // Exit done — switch to enter phase; clear frozen so live children render
      setFrozenChildren(null);
      setPhase('enter');
      setTimeout(() => {
        setPhase('idle');
        isAnimating.current = false;
      }, ENTER_MS[ts]);
    }, EXIT_MS[ts]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitionKey]);

  const cls = phase === 'idle'
    ? ''
    : `crt-tx-${activeStyle}-${phase}`;

  return (
    <div className={`crt-tx-wrapper ${cls}`} style={{ height: '100%', width: '100%' }}>
      {phase === 'exit' && frozenChildren ? frozenChildren : children}
    </div>
  );
};

export default CRTTransition;
