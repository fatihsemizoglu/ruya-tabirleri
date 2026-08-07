import { motion } from 'framer-motion';
import { Flame, Eye, Heart, Award } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

interface PopularStatsProps {
  totalDreams: number;
  totalViews: number;
  totalLikes: number;
  featuredCount: number;
}

export function PopularStats({ totalDreams, totalViews, totalLikes, featuredCount }: PopularStatsProps) {
  const stats = [
    {
      icon: Flame,
      value: totalDreams,
      label: 'Toplam Rüya',
      bg: 'bg-gradient-to-br from-orange-500/10 to-rose-500/10',
      iconBg: 'bg-gradient-to-br from-orange-500/20 to-rose-500/20',
      color: 'text-orange-600 dark:text-orange-400',
      border: 'hover:border-orange-500/30',
    },
    {
      icon: Eye,
      value: totalViews,
      label: 'Görüntülenme',
      bg: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
      iconBg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
      color: 'text-blue-600 dark:text-blue-400',
      border: 'hover:border-blue-500/30',
    },
    {
      icon: Heart,
      value: totalLikes,
      label: 'Beğeni',
      bg: 'bg-gradient-to-br from-rose-500/10 to-pink-500/10',
      iconBg: 'bg-gradient-to-br from-rose-500/20 to-pink-500/20',
      color: 'text-rose-600 dark:text-rose-400',
      border: 'hover:border-rose-500/30',
    },
    {
      icon: Award,
      value: featuredCount,
      label: 'Öne Çıkan',
      bg: 'bg-gradient-to-br from-amber-500/10 to-yellow-500/10',
      iconBg: 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20',
      color: 'text-amber-600 dark:text-amber-400',
      border: 'hover:border-amber-500/30',
    },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.08 } },
      }}
      className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10"
    >
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            variants={{
              hidden: { opacity: 0, y: 20 },
              show: { opacity: 1, y: 0 },
            }}
            className={`group ${stat.bg} border border-border/50 rounded-2xl p-4 sm:p-5 ${stat.border} hover:shadow-lg transition-all duration-300`}
          >
            <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
              <Icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold font-serif-dream text-foreground tracking-tight">
              <AnimatedCounter value={stat.value} />
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
              {stat.label}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
