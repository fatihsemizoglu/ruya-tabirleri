import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWA } from '@/hooks/usePWA';

export function OfflineIndicator() {
  const { isOnline } = usePWA();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2"
        >
          <WifiOff className="w-4 h-4" />
          <span>Çevrimdışısınız - Bazı özellikler sınırlı olabilir</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRetry}
            className="ml-2 h-8 gap-1.5 bg-amber-100/80 hover:bg-amber-100 text-amber-950"
          >
            <RefreshCw className="w-3 h-3" />
            Tekrar Dene
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
