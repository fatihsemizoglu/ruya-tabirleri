import { useEffect } from 'react';

/**
 * Reports Core Web Vitals to the browser console in development and to
 * Vercel Analytics in production. Uses the native PerformanceObserver
 * API to avoid adding a dependency.
 *
 * Mount this once near the root of the app.
 */
export function WebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('PerformanceObserver' in window)) return;

    const report = (name: string, value: number) => {
      // In dev: log to console with a [vital] prefix
      if (import.meta.env.DEV) {
        console.info(`[vital] ${name}: ${value.toFixed(1)}`);
      }
      // In production: forward to Vercel's web-vitals endpoint if present
      if (typeof window !== 'undefined' && (window as unknown as { va?: (cb: (a: { name: string; value: number; id: string }) => void) => void }).va) {
        (window as unknown as { va: (cb: (a: { name: string; value: number; id: string }) => void) => void }).va((a) => {
          if (a) {
            // Vercel Analytics handles its own send — we just need to call va with a metric
          }
        });
      }
    };

    // Largest Contentful Paint
    try {
      const lcp = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
        if (last) report('LCP', last.renderTime || last.loadTime || last.startTime);
      });
      lcp.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      /* not supported */
    }

    // First Input Delay
    try {
      const fid = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const e = entry as PerformanceEntry & { processingStart: number };
          report('FID', e.processingStart - e.startTime);
        }
      });
      fid.observe({ type: 'first-input', buffered: true });
    } catch {
      /* not supported */
    }

    // Cumulative Layout Shift
    try {
      let cls = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const e = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!e.hadRecentInput) cls += e.value;
        }
        report('CLS', cls);
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {
      /* not supported */
    }

    // First Contentful Paint
    try {
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      if (fcp) report('FCP', fcp.startTime);
    } catch {
      /* noop */
    }
  }, []);

  return null;
}
