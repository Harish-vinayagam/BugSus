import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook to handle page visibility changes.
 * Useful for:
 * - Pausing timers when tab is hidden
 * - Resuming/reconnecting when tab becomes visible
 * - Preventing freezes due to browser tab suspension
 */
export const usePageVisibility = (
  onHidden?: () => void,
  onVisible?: () => void,
) => {
  const isHiddenRef = useRef(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const hidden = document.hidden;
      isHiddenRef.current = hidden;

      if (hidden) {
        console.log('[visibility] tab hidden');
        onHidden?.();
      } else {
        console.log('[visibility] tab visible');
        onVisible?.();
      }
    };

    // Check initial state
    isHiddenRef.current = document.hidden;

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onHidden, onVisible]);

  return isHiddenRef.current;
};
