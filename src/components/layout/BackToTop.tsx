import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { haptic } from '@/lib/haptics';

const SHOW_AFTER_PX = 600;

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(min-width: 1024px)').matches) return;

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setVisible(window.scrollY > SHOW_AFTER_PX);
        ticking = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleClick = () => {
    haptic('light');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      aria-label="Yukarı dön"
      onClick={handleClick}
      className={`fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-card/90 dark:bg-slate-900/90 border border-border/60 backdrop-blur shadow-lg shadow-black/10 text-foreground hover:border-primary/40 hover:text-primary active:scale-95 transition-all duration-200 ${
        visible ? 'opacity-100 translate-y-0 scale-100' : 'pointer-events-none opacity-0 translate-y-2 scale-90'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      tabIndex={visible ? 0 : -1}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
