import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DAYS = 7;
const VISIT_KEY = 'pwa-visit-count';
const SCROLL_THRESHOLD = 500;
const MIN_DELAY_MS = 15_000;
const MAX_DELAY_MS = 45_000;

export function InstallPrompt() {
  const { isInstallable, isInstalled, installApp } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Cooldown: re-show after 7 days
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const ts = parseInt(dismissedAt, 10);
      if (Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
      }
    }

    // Increment visit counter (used to defer the prompt until at least the 2nd visit)
    const visits = parseInt(localStorage.getItem(VISIT_KEY) ?? '0', 10) + 1;
    localStorage.setItem(VISIT_KEY, String(visits));

    if (visits < 2) return;
  }, []);

  useEffect(() => {
    if (isDismissed || !isInstallable || isInstalled) return;
    if (typeof window === 'undefined') return;

    let scrolled = false;
    let timer: number | null = null;

    const onScroll = () => {
      if (scrolled) return;
      if (window.scrollY > SCROLL_THRESHOLD) {
        scrolled = true;
        // User has scrolled — show sooner
        if (timer) window.clearTimeout(timer);
        timer = window.setTimeout(show, MIN_DELAY_MS);
      }
    };

    const show = () => setIsVisible(true);

    // Default timer (in case user never scrolls): show after MAX_DELAY_MS
    const fallback = window.setTimeout(show, MAX_DELAY_MS);
    // If scrolled before the fallback fires, we'll cancel it
    timer = fallback;

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timer) window.clearTimeout(timer);
    };
  }, [isInstallable, isInstalled, isDismissed]);

  const handleInstall = async () => {
    const installed = await installApp();
    if (installed) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (!isInstallable || isInstalled || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-24 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-30"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl p-4 backdrop-blur-xl">
            <button
              onClick={handleDismiss}
              aria-label="Kapat"
              className="absolute top-2 right-2 flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground">
                  Uygulamayı Yükle
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Rüya Tabirleri'ni telefonuna yükle, offline erişim ve hızlı açılış keyfini yaşa!
                </p>

                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={handleInstall}
                    size="sm"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Yükle
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    variant="ghost"
                    size="sm"
                  >
                    Daha Sonra
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
