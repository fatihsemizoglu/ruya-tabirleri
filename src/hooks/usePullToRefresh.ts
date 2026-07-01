import { useEffect, useRef, useState, useCallback } from 'react';

interface UsePullToRefreshOptions {
  /** Callback fired when the user pulls down past the threshold. */
  onRefresh: () => Promise<void> | void;
  /** Pull distance in px required to trigger refresh (default 80). */
  threshold?: number;
  /** Maximum pull distance in px (default 140). */
  maxPull?: number;
  /** Disable the hook entirely (e.g. when not on a touch device). */
  enabled?: boolean;
}

interface UsePullToRefreshResult {
  /** Ref to attach to the scrollable container element. */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Whether a refresh is currently in progress. */
  isRefreshing: boolean;
  /** Current pull distance in px (0 when not pulling). */
  pullDistance: number;
  /** Whether the user is currently pulling past the threshold. */
  isReady: boolean;
}

/**
 * Pull-to-refresh gesture for touch devices.
 *
 * - Only activates when the container is scrolled to the top
 * - Tracks touch Y delta, applies a resistance curve
 * - Calls onRefresh() when the user releases past the threshold
 * - Returns refs and state for the caller to render a visual indicator
 */
export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 140,
  enabled = true,
}: UsePullToRefreshOptions): UsePullToRefreshResult {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const currentPull = useRef(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
      currentPull.current = 0;
    }
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) return;
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (isRefreshing) return;
      if (el.scrollTop > 0) return;
      const touch = e.touches[0];
      if (!touch) return;
      startY.current = touch.clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startY.current === null || isRefreshing) return;
      const touch = e.touches[0];
      if (!touch) return;
      const delta = touch.clientY - startY.current;
      if (delta <= 0) {
        if (currentPull.current !== 0) {
          currentPull.current = 0;
          setPullDistance(0);
        }
        return;
      }
      // Resistance: ease out as user pulls further
      const resisted = Math.min(maxPull, delta * 0.4);
      currentPull.current = resisted;
      setPullDistance(resisted);
    };

    const onTouchEnd = () => {
      if (startY.current === null) return;
      if (currentPull.current >= threshold && !isRefreshing) {
        handleRefresh();
      } else {
        currentPull.current = 0;
        setPullDistance(0);
      }
      startY.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [enabled, threshold, maxPull, isRefreshing, handleRefresh]);

  return {
    containerRef,
    isRefreshing,
    pullDistance,
    isReady: pullDistance >= threshold,
  };
}
