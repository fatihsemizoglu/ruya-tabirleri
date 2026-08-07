import { useReducedMotion } from 'framer-motion';

/**
 * whileInView reveal animasyon konfigürasyonunu üretir.
 * Reduce motion tercihi açıkken tüm animasyon süreleri sıfırlanır.
 * Contact bileşenleri arasında aynı desenin kopyalanmasını önler.
 */
export function useReveal(delay = 0) {
  const reduceMotion = useReducedMotion();

  return {
    initial: { opacity: 0, y: reduceMotion ? 0 : 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.18 },
    transition: {
      duration: reduceMotion ? 0 : 0.5,
      ease: 'easeOut' as const,
      delay: reduceMotion ? 0 : delay,
    },
  };
}
