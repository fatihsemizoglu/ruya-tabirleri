import { useRegisterSW } from 'virtual:pwa-register/react';
import type { RegisterSWOptions } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function SWUpdatePrompt() {
  const options: RegisterSWOptions = {
    onRegistered: (r) => {
      r && setInterval(() => {
        r.update();
      }, 60 * 60 * 1000);
    },
  };
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW(options);

  const close = () => {
    setNeedRefresh(false);
  };

  return (
    <AnimatePresence>
      {needRefresh && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-6 left-6 right-6 z-50 mx-auto max-w-md"
        >
          <div className="bg-card border border-border/60 rounded-2xl p-4 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <RefreshCw className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">Yeni Sürüm Mevcut</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Uygulamayı güncellemek için yenileyin.
                </p>
              </div>
              <button
                onClick={close}
                className="shrink-0 w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <Button
              size="sm"
              onClick={() => updateServiceWorker(true)}
              className="w-full mt-3 rounded-xl h-10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Güncelle ve Yenile
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
