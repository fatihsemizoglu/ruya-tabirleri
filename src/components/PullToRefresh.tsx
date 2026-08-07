import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
}

export function PullToRefresh({ onRefresh, children, threshold = 80 }: PullToRefreshProps) {
  const [state, setState] = useState<'idle' | 'pulling' | 'refreshing'>('idle');
  const containerRef = useRef<HTMLDivElement>(null);

  // Chrome Android'de native pull-to-refresh'i bastır ki özel PTR ile
  // çift tetiklenme olmasın. Kaydırma kök scroller (html) üzerinde yapıldığı
  // için overscroll-behavior sarmalayıcıya değil kök öğeye uygulanır.
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overscrollBehaviorY;
    root.style.overscrollBehaviorY = 'contain';
    return () => {
      root.style.overscrollBehaviorY = previous;
    };
  }, []);
  const pullY = useMotionValue(0);
  const rotate = useTransform(pullY, [0, threshold], [0, 360]);
  const opacity = useTransform(pullY, [0, threshold / 2], [0, 1]);
  const startY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (state === 'refreshing') return;
    if ((containerRef.current?.scrollTop ?? 0) > 0) return;
    const touch = e.touches[0];
    if (!touch) return;
    startY.current = touch.clientY;
  }, [state]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (state === 'refreshing') return;
    if ((containerRef.current?.scrollTop ?? 0) > 0) return;
    const touch = e.touches[0];
    if (!touch) return;
    const dy = Math.max(0, touch.clientY - startY.current);
    pullY.set(Math.min(dy * 0.5, threshold * 1.5));
    if (dy > 10) setState('pulling');
  }, [state, pullY, threshold]);

  const onTouchEnd = useCallback(async () => {
    const currentY = pullY.get();
    if (currentY >= threshold && state === 'pulling') {
      setState('refreshing');
      animate(pullY, 30, { type: 'spring', stiffness: 300, damping: 30 });
      try {
        await onRefresh();
      } finally {
        setState('idle');
        animate(pullY, 0, { type: 'spring', stiffness: 300, damping: 30 });
      }
    } else {
      setState('idle');
      animate(pullY, 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
  }, [pullY, threshold, state, onRefresh]);

  return (
    <div ref={containerRef} className="relative overflow-hidden touch-pan-y overscroll-contain">
      <motion.div
        style={{ y: pullY, opacity, position: 'absolute', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 50, top: -50 }}
      >
        {state === 'refreshing' ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mt-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Yenileniyor...
          </div>
        ) : (
          <motion.div style={{ rotate }} className="mt-4">
            <RefreshCw className="h-6 w-6 text-primary/60" />
          </motion.div>
        )}
      </motion.div>
      <motion.div style={{ y: state === 'refreshing' ? pullY : pullY }}>
        {children}
      </motion.div>
    </div>
  );
}
