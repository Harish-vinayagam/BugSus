import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

export type TransitionStyle = 'scan' | 'glitch' | 'dissolve' | 'flicker' | 'static' | 'poweron' | 'channel' | 'collapse';

interface CRTTransitionProps {
  /** The key that changes to trigger a transition (e.g. the screen name) */
  transitionKey: string;
  /** Override which style to use for this transition */
  style?: TransitionStyle;
  children: ReactNode;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Every screen gets a distinct, purposeful transition style */
export const styleForScreen = (screen: string): TransitionStyle => {
  switch (screen) {
    // Boot → create/join: TV powering on from nothing
    case 'boot':    return 'poweron';
    case 'create':  return 'poweron';
    case 'join':    return 'poweron';
    // Lobby: clean scan wipe
    case 'lobby':   return 'scan';
    // Game start: full static burst (channel change)
    case 'category': return 'static';
    // Role reveal: dramatic phosphor dissolve
    case 'role':    return 'dissolve';
    // Game screen: channel-change snap
    case 'game':    return 'channel';
    // Emergency / meeting: hard glitch cut — urgent
    case 'emergency': return 'glitch';
    case 'meeting': return 'glitch';
    // Summary / final: tube-power flicker
    case 'summary': return 'flicker';
    case 'final':   return 'flicker';
    default:        return 'scan';
  }
};

// Durations must match CSS animation lengths exactly
const EXIT_MS:    Record<TransitionStyle, number> = {
  scan: 480, glitch: 380, dissolve: 560, flicker: 500,
  static: 600, poweron: 320, channel: 280, collapse: 300,
};
const ENTER_MS:   Record<TransitionStyle, number> = {
  scan: 560, glitch: 460, dissolve: 660, flicker: 600,
  static: 820, poweron: 820, channel: 500, collapse: 400,
};
// Black gap between exit finishing and enter starting (ms) — cinematic beat
const GAP_MS: Record<TransitionStyle, number> = {
  scan: 60, glitch: 20, dissolve: 80, flicker: 100,
  static: 80, poweron: 60, channel: 40, collapse: 60,
};
// How long the noise overlay stays visible (covers both exit + enter)
const OVERLAY_MS: Record<TransitionStyle, number> = {
  scan: 0, glitch: 0, dissolve: 0, flicker: 0,
  static: 1420, poweron: 0, channel: 820, collapse: 0,
};

// ── Component ──────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'exit' | 'black' | 'enter';

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
  const [phase, setPhase]       = useState<Phase>('idle');
  const [activeStyle, setActiveStyle] = useState<TransitionStyle>('scan');
  const [showOverlay, setShowOverlay] = useState(false);
  const prevKeyRef   = useRef(transitionKey);
  const isAnimating  = useRef(false);

  useEffect(() => {
    // Only animate when the screen (transitionKey) actually changes
    if (transitionKey === prevKeyRef.current) return;

    const ts = style ?? styleForScreen(transitionKey);
    prevKeyRef.current = transitionKey;

    if (isAnimating.current) return;

    isAnimating.current = true;
    setActiveStyle(ts);

    // Fire the static noise overlay (for 'static' style only)
    if (OVERLAY_MS[ts] > 0) {
      setShowOverlay(true);
      setTimeout(() => setShowOverlay(false), OVERLAY_MS[ts]);
    }

    // Freeze current children for the exit animation
    setFrozenChildren(children);
    setPhase('exit');

    // After exit: hold a pure-black frame (GAP_MS), then enter
    setTimeout(() => {
      setFrozenChildren(null);
      setPhase('black');
      setTimeout(() => {
        setPhase('enter');
        setTimeout(() => {
          setPhase('idle');
          isAnimating.current = false;
        }, ENTER_MS[ts]);
      }, GAP_MS[ts]);
    }, EXIT_MS[ts]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitionKey]);

  const cls = (phase === 'idle' || phase === 'black') ? '' : `crt-tx-${activeStyle}-${phase}`;

  return (
    <div className={`crt-tx-wrapper ${cls}`} style={{ height: '100%', width: '100%' }}>
      {/* Static TV noise overlay — only visible during 'static'/'channel' transitions */}
      <div className={`crt-tx-static-overlay ${showOverlay ? 'active' : ''}`} />
      {/* During 'black' gap render nothing — screen is pure dark phosphor */}
      {phase !== 'black' && (phase === 'exit' && frozenChildren ? frozenChildren : children)}
    </div>
  );
};

export default CRTTransition;
