import { useCallback, useEffect, useRef, useState } from 'react';

type WakeLockSentinelLike = {
  released: boolean;
  release: () => Promise<void>;
  addEventListener: (type: 'release', listener: () => void) => void;
};

type WakeLockApi = {
  request: (type: 'screen') => Promise<WakeLockSentinelLike>;
};

function getNavigatorWakeLock(): WakeLockApi | null {
  if (typeof navigator === 'undefined') return null;
  return navigator.wakeLock ?? null;
}

interface UseWakeLockResult {
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
  request: () => Promise<void>;
  release: () => Promise<void>;
}

/**
 * Hook wrapping the Screen Wake Lock API to prevent the device from sleeping.
 *
 * - Browsers release the lock when the tab is hidden; we re-acquire on visibility
 * - Auto-releases on unmount
 * - Silently no-ops where the API is not available
 */
export function useWakeLock(): UseWakeLockResult {
  const api = getNavigatorWakeLock();
  const isSupported = !!api;
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const release = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch {
        /* noop */
      }
      sentinelRef.current = null;
      setIsActive(false);
    }
  }, []);

  const request = useCallback(async () => {
    if (!api) return;
    try {
      const sentinel = await api.request('screen');
      sentinelRef.current = sentinel;
      setIsActive(true);
      setError(null);
      sentinel.addEventListener('release', () => {
        setIsActive(false);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'request-failed');
      setIsActive(false);
    }
  }, [api]);

  // Re-acquire lock when tab becomes visible again (browsers release on hide).
  useEffect(() => {
    if (!isSupported) return;
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && sentinelRef.current === null && isActive) {
        request();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [isSupported, isActive, request]);

  // Release on unmount.
  useEffect(() => {
    return () => {
      if (sentinelRef.current) {
        sentinelRef.current.release().catch(() => {});
      }
    };
  }, []);

  return { isSupported, isActive, error, request, release };
}
