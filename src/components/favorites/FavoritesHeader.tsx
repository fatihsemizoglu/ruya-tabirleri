import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';

export function FavoritesHeader() {
  return (
    <div className="text-center mb-10">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4"
      >
        <PremiumBadge>
          <Heart className="h-3.5 w-3.5" />
          Favori Koleksiyonum
        </PremiumBadge>
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.025em] text-foreground mb-3 leading-[1.05]"
      >
        <GradientText>Favorilerim</GradientText>
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto"
      >
        Kaydettiğin rüya tabirlerini yönet ve keşfet.
      </motion.p>
    </div>
  );
}
