import { motion } from 'framer-motion';
import { Heart, Eye, Filter } from 'lucide-react';

interface FavoritesStatsProps {
  totalFavorites: number;
  totalViews: number;
  totalLikes: number;
  distinctCategories: number;
}

export function FavoritesStats({
  totalFavorites,
  totalViews,
  totalLikes,
  distinctCategories,
}: FavoritesStatsProps) {
  const stats = [
    {
      icon: Heart,
      value: totalFavorites.toString(),
      label: 'Toplam Favori',
      bg: 'bg-rose-500/10',
      text: 'text-rose-600 dark:text-rose-400',
    },
    {
      icon: Eye,
      value: totalViews.toLocaleString('tr-TR'),
      label: 'Görüntülenme',
      bg: 'bg-blue-500/10',
      text: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: Heart,
      value: totalLikes.toLocaleString('tr-TR'),
      label: 'Beğeni',
      bg: 'bg-red-500/10',
      text: 'text-red-600 dark:text-red-400',
    },
    {
      icon: Filter,
      value: distinctCategories.toString(),
      label: 'Farklı Kategori',
      bg: 'bg-violet-500/10',
      text: 'text-violet-600 dark:text-violet-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            className="group bg-card border border-border/50 rounded-2xl p-4 sm:p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
          >
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <Icon className={`h-4.5 w-4.5 ${stat.text}`} />
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold font-serif-dream text-foreground">
              {stat.value}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
              {stat.label}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
