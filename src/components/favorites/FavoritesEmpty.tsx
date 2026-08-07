import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { EmptyState as PremiumEmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

export function FavoritesEmpty({ message }: { message: string }) {
  return (
    <div className="bg-card border border-border/40 rounded-2xl">
      <PremiumEmptyState
        icon="search"
        title={message}
        description="Filtreleri değiştirerek veya aramayı temizleyerek yeni sonuçlar keşfedebilirsiniz."
      />
    </div>
  );
}

export function NoFavorites() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card border border-border/40 rounded-2xl"
    >
      <PremiumEmptyState
        icon={Heart}
        title="Henüz favori eklemediniz"
        description="Beğendiğiniz rüya tabirlerini favorilerinize ekleyerek koleksiyonunuzu oluşturun."
      />
      <div className="flex justify-center pb-8">
        <Button asChild className="rounded-xl">
          <Link to="/">Rüya Tabirlerine Göz At</Link>
        </Button>
      </div>
    </motion.div>
  );
}
