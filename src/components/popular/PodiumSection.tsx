import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Medal, Eye, Heart, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import type { Dream, Category } from '@/types/database';

interface PodiumSectionProps {
  trending: Dream[];
  categories: Record<string, Category>;
}

export function PodiumSection({ trending, categories }: PodiumSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="mt-16 pt-12 border-t border-border/40"
    >
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-4"
        >
          <Trophy className="h-3.5 w-3.5" />
          Şampiyonlar
        </motion.div>
        <h2 className="text-2xl md:text-3xl font-bold font-serif-dream text-foreground">
          En Popüler 3 Rüya
        </h2>
        <p className="text-sm text-muted-foreground mt-1.5">
          Tüm zamanların en çok ilgi gören rüya tabirleri
        </p>
      </div>

      {/* Podium layout: 2nd | 1st | 3rd */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-end max-w-5xl mx-auto">
        {[trending[1]!, trending[0]!, trending[2]!].map((dream, displayIndex) => {
          const realIndex = displayIndex === 0 ? 1 : displayIndex === 1 ? 0 : 2;
          const medals = ['🥇', '🥈', '🥉'];
          const labels = ['Birinci', 'İkinci', 'Üçüncü'];
          const gradients = [
            'from-amber-400 to-yellow-500 shadow-amber-500/20',
            'from-slate-300 to-slate-400 shadow-slate-400/20',
            'from-orange-400 to-amber-600 shadow-orange-500/20',
          ];
          const borderColors = [
            'border-amber-500/30 hover:border-amber-400/50',
            'border-slate-400/30 hover:border-slate-300/50',
            'border-orange-500/30 hover:border-orange-400/50',
          ];
          const bgGradients = [
            'bg-gradient-to-br from-amber-500/5 to-yellow-500/5',
            'bg-gradient-to-br from-slate-400/5 to-slate-300/5',
            'bg-gradient-to-br from-orange-500/5 to-amber-500/5',
          ];
          const podiumHeight = displayIndex === 1 ? 'md:pb-0' : 'md:pb-6';
          const category = dream.category_id ? categories[dream.category_id] : null;

          return (
            <motion.div
              key={dream.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + displayIndex * 0.1 }}
              className={`${podiumHeight}`}
            >
              <Link
                to={`/ruya/${dream.slug}`}
                className={`group relative block overflow-hidden rounded-2xl ${bgGradients[realIndex]} p-6 border ${borderColors[realIndex]} hover:shadow-xl hover:-translate-y-1.5 transition-all duration-500`}
              >
                {/* Top gradient bar */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradients[realIndex]}`} />

                {/* Decorative glow */}
                <div className={`absolute -top-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${gradients[realIndex]} opacity-[0.08] blur-2xl`} />

                <div className="relative">
                  {/* Medal badge */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r ${gradients[realIndex]} bg-opacity-10 text-xs font-bold text-white`}>
                      <Medal className="h-3 w-3" />
                      {labels[realIndex]}
                    </div>
                    <span className="text-3xl drop-shadow-lg group-hover:scale-110 transition-transform">
                      {medals[realIndex]}
                    </span>
                  </div>

                  {category && (
                    <Badge variant="secondary" className="mb-3 gap-1 rounded-full">
                      <CategoryIcon icon={category.icon} className="h-3.5 w-3.5" /> {category.name}
                    </Badge>
                  )}

                  <h3 className="text-lg font-bold font-serif-dream mb-2 group-hover:text-primary transition-colors pr-6 line-clamp-2">
                    {dream.title}
                  </h3>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                    {dream.content}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-blue-500" />
                      <span className="text-blue-600 dark:text-blue-400">{(dream.view_count || 0).toLocaleString('tr-TR')}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5 text-rose-500" />
                      <span className="text-rose-600 dark:text-rose-400">{(dream.like_count || 0).toLocaleString('tr-TR')}</span>
                    </span>
                    <span className="ml-auto">
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
