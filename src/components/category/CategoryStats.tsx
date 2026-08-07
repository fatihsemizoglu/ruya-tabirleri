import { motion } from 'framer-motion';
import { BookOpen, Eye, Heart, Star, ArrowUpRight } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

interface CategoryStatsProps {
  dreamsCount: number;
  totalViews: number;
  totalLikes: number;
  featuredCount: number;
}

export function CategoryStats({ dreamsCount, totalViews, totalLikes, featuredCount }: CategoryStatsProps) {
  return (
    <section className="container pb-6">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: { transition: { staggerChildren: 0.08 } },
        }}
        className="grid grid-cols-2 md:grid-cols-3 gap-4"
      >
        {[
          { icon: BookOpen, label: 'Rüya Tabiri', value: dreamsCount, gradient: 'from-violet-500/10 to-violet-500/5', iconBg: 'from-violet-500/20 to-violet-500/5', color: 'text-violet-600 dark:text-violet-400', border: 'hover:border-violet-500/30' },
          { icon: Eye, label: 'Toplam Görüntülenme', value: totalViews, gradient: 'from-blue-500/10 to-blue-500/5', iconBg: 'from-blue-500/20 to-blue-500/5', color: 'text-blue-600 dark:text-blue-400', border: 'hover:border-blue-500/30' },
          { icon: Heart, label: 'Toplam Beğeni', value: totalLikes, gradient: 'from-rose-500/10 to-rose-500/5', iconBg: 'from-rose-500/20 to-rose-500/5', color: 'text-rose-600 dark:text-rose-400', border: 'hover:border-rose-500/30' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 },
              }}
              className={`bg-gradient-to-br ${stat.gradient} border border-border/50 rounded-2xl p-5 ${stat.border} hover:shadow-lg transition-all duration-300 group`}
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${stat.iconBg} mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-medium">
                {stat.label}
              </p>
              <p className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                <AnimatedCounter value={stat.value} />
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {featuredCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-4 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md hover:border-amber-500/30 transition-all duration-300 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Star className="w-5 h-5 text-amber-600 fill-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {featuredCount} öne çıkan rüya tabiri
            </p>
            <p className="text-xs text-muted-foreground">
              Editör tarafından seçilen en iyi içerikler
            </p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
        </motion.div>
      )}
    </section>
  );
}
