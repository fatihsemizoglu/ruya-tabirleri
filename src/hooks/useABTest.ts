import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ABVariant {
  id: string;
  name: string;
  payload: Record<string, unknown>;
  weight?: number;
}

export interface ABTestConfig {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: ABVariant[];
  winner?: string;
}

interface UseABTestOptions {
  enabled?: boolean;
  userId?: string;
  cacheKey?: string;
}

interface UseABTestResult {
  variant: ABVariant | null;
  isLoading: boolean;
  error: string | null;
  trackEvent: (event: string, data?: { timeOnPage?: number }) => void;
  refresh: () => void;
}

const CACHE_PREFIX = 'ab_variant_';

function getCachedVariant(testId: string): { variantId: string; userId: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + testId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCachedVariant(testId: string, variantId: string, userId: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_PREFIX + testId, JSON.stringify({ variantId, userId }));
  } catch (_error) {
    // localStorage may be unavailable in private browsing or SSR-like contexts.
  }
}

function generateUserId(): string {
  if (typeof window === 'undefined') return 'srv';
  let id = localStorage.getItem('ab_user_id');
  if (!id) {
    id = 'u-' + Math.random().toString(36).slice(2) + '-' + Date.now().toString(36);
    localStorage.setItem('ab_user_id', id);
  }
  return id;
}

export function useABTest(testId: string, options: UseABTestOptions = {}): UseABTestResult {
  const { enabled = true, userId: providedUserId, cacheKey } = options;
  const effectiveTestId = cacheKey || testId;
  const userId = useMemo(() => providedUserId || (typeof window !== 'undefined' ? generateUserId() : 'srv'), [providedUserId]);

  const [variant, setVariant] = useState<ABVariant | null>(null);
  const [test, setTest] = useState<ABTestConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignment = useCallback(async (force = false) => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const cached = !force ? getCachedVariant(effectiveTestId) : null;
      if (cached && cached.userId === userId) {
        // Use cached assignment
        const { data } = await supabase.functions.invoke('ab-test-manager', {
          body: { action: 'get', id: testId },
        });
        if (data?.test) {
          setTest(data.test);
          const v = data.test.variants.find((vv: ABVariant) => vv.id === cached.variantId);
          if (v) {
            setVariant(v);
            setIsLoading(false);
            return;
          }
        }
      }

      // Fetch test config and assign
      const { data, error: fnError } = await supabase.functions.invoke('ab-test-manager', {
        body: { action: 'assign', id: testId, user_id: userId },
      });
      if (fnError) throw fnError;
      if (data?.variant) {
        setVariant(data.variant);
        setCachedVariant(effectiveTestId, data.variant.id, userId);
        // Auto-track view
        trackEventInternal(testId, data.variant.id, userId, 'view');
      } else {
        // Test not found or not running - return first variant
        setVariant(null);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(message);
      console.warn('A/B test assignment failed:', message);
    } finally {
      setIsLoading(false);
    }
  }, [testId, effectiveTestId, userId, enabled]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  const trackEvent = useCallback(
    (event: string, data?: { timeOnPage?: number }) => {
      if (!variant) return;
      trackEventInternal(testId, variant.id, userId, event, data?.timeOnPage);
    },
    [testId, variant, userId]
  );

  const refresh = useCallback(() => {
    fetchAssignment(true);
  }, [fetchAssignment]);

  return { variant, isLoading, error, trackEvent, refresh };
}

async function trackEventInternal(testId: string, variantId: string, userId: string, event: string, timeOnPage?: number) {
  try {
    await supabase.functions.invoke('ab-test-manager', {
      body: {
        action: 'track',
        id: testId,
        user_id: userId,
        variant_id: variantId,
        event,
        time_on_page: timeOnPage,
      },
    });
  } catch (err) {
    console.warn('Track event failed:', err);
  }
}

/**
 * Utility to track page view with time-on-page on unload
 */
export function useTrackTimeOnPage(testId: string, variantId: string, userId: string) {
  useEffect(() => {
    if (!testId || !variantId) return;
    const start = Date.now();
    const send = () => {
      const elapsed = Math.round((Date.now() - start) / 1000);
      if (elapsed > 1) {
        // Use sendBeacon if available to ensure delivery on unload
        if (navigator.sendBeacon) {
          const body = JSON.stringify({
            action: 'track',
            id: testId,
            variant_id: variantId,
            user_id: userId,
            event: 'time_on_page',
            time_on_page: elapsed,
          });
          try {
            const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ab-test-manager`;
            navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
            return;
          } catch (_error) {
            // Fall back to the normal invoke path below.
          }
        }
        trackEventInternal(testId, variantId, userId, 'time_on_page', elapsed);
      }
    };
    window.addEventListener('beforeunload', send);
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') send();
    });
    return () => {
      window.removeEventListener('beforeunload', send);
    };
  }, [testId, variantId, userId]);
}
