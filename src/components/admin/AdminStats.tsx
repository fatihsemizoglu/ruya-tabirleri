import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpen, FolderOpen, Users, FileText, Eye, Heart, Star, TrendingUp, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { queryKeys } from '@/lib/query/client';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendUp?: boolean;
  gradient: string;
  glowColor: string;
  delay?: number;
  sparkline?: number[];
}

function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 32;
  const points = data.map((v, i) => 
    `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`
  ).join(' ');

  return (
    <svg width={width} height={height} className="opacity-60">
      <defs>
        <linearGradient id={`spark-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#spark-${color})`}
      />
    </svg>
  );
}

function StatCard({ label, value, icon: Icon, trend, trendUp, gradient, glowColor, delay = 0, sparkline }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: delay * 0.08, ease: 'easeOut' }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative"
    >
      {/* Glow Effect */}
      <div className={cn(
        "absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl",
        glowColor
      )} />
      
      <div className="relative overflow-hidden rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 p-5 shadow-lg shadow-slate-200/20 dark:shadow-slate-950/20">
        {/* Top Gradient Line */}
        <div className={cn("absolute top-0 left-0 right-0 h-[2px]", gradient)} />
        
        {/* Background Pattern */}
        <div className="absolute top-0 right-0 w-32 h-32 opacity-[0.03]">
          <div className={cn("w-full h-full rounded-full", gradient.replace('bg-gradient-to-br', 'bg-gradient-to-br'))} />
        </div>

        <div className="relative flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider truncate">
                {label}
              </p>
              {trend && (
                <span className={cn(
                  "inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  trendUp 
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" 
                    : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                )}>
                  {trendUp ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                  {trend}
                </span>
              )}
            </div>
            <motion.p 
              className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay * 0.08 + 0.3 }}
            >
              {value}
            </motion.p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3",
              gradient
            )}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            {sparkline && (
              <div className="text-slate-400 dark:text-slate-500">
                <MiniSparkline data={sparkline} color="indigo" />
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function AdminStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: queryKeys.admin.stats,
    queryFn: async () => {
      const response = await adminApi.getStatistics();
      if (!response.success || !response.data) throw new Error('Failed to fetch stats');
      const data = response.data;
      return {
        dreams: data.totalDreams || 0,
        categories: data.totalCategories || 0,
        users: data.totalUsers || 0,
        blogPosts: 0,
        featured: data.featuredDreams || 0,
        totalViews: data.totalViews || 0,
        totalLikes: data.totalLikes || 0,
        totalComments: data.totalComments || 0,
        avgViews: data.avgViewsPerDream || 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <motion.div 
            key={i} 
            className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/90 dark:bg-slate-900/90 p-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-3 w-16 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                <div className="mt-3 h-8 w-24 rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse" />
              </div>
              <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse" />
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  const primaryStats = [
    { label: 'Toplam Rüya', value: stats?.dreams.toLocaleString('tr-TR') || '0', icon: BookOpen, gradient: 'bg-gradient-to-br from-blue-500 to-blue-600', glowColor: 'bg-blue-500/20', trend: '+12%', trendUp: true, sparkline: [3, 5, 4, 7, 6, 8, 9] },
    { label: 'Kategoriler', value: stats?.categories.toLocaleString('tr-TR') || '0', icon: FolderOpen, gradient: 'bg-gradient-to-br from-violet-500 to-purple-600', glowColor: 'bg-violet-500/20', trend: '+5%', trendUp: true, sparkline: [2, 3, 3, 4, 4, 5, 5] },
    { label: 'Kullanıcılar', value: stats?.users.toLocaleString('tr-TR') || '0', icon: Users, gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600', glowColor: 'bg-emerald-500/20', trend: '+8%', trendUp: true, sparkline: [1, 2, 3, 2, 4, 5, 6] },
    { label: 'Blog Yazıları', value: stats?.blogPosts.toLocaleString('tr-TR') || '0', icon: FileText, gradient: 'bg-gradient-to-br from-orange-500 to-amber-600', glowColor: 'bg-orange-500/20', trend: '+15%', trendUp: true, sparkline: [0, 1, 2, 1, 3, 4, 5] },
  ];

  const secondaryStats = [
    { label: 'Öne Çıkan', value: stats?.featured.toLocaleString('tr-TR') || '0', icon: Star, gradient: 'bg-gradient-to-br from-yellow-400 to-amber-500', glowColor: 'bg-yellow-500/20', sparkline: [2, 3, 2, 4, 3, 5, 4] },
    { label: 'Görüntüleme', value: stats?.totalViews?.toLocaleString('tr-TR') || '0', icon: Eye, gradient: 'bg-gradient-to-br from-cyan-500 to-blue-500', glowColor: 'bg-cyan-500/20', sparkline: [10, 15, 12, 18, 20, 25, 30] },
    { label: 'Beğeni', value: stats?.totalLikes?.toLocaleString('tr-TR') || '0', icon: Heart, gradient: 'bg-gradient-to-br from-rose-500 to-pink-600', glowColor: 'bg-rose-500/20', sparkline: [5, 8, 6, 10, 12, 15, 18] },
    { label: 'Yorumlar', value: stats?.totalComments?.toLocaleString('tr-TR') || '0', icon: Activity, gradient: 'bg-gradient-to-br from-indigo-500 to-violet-600', glowColor: 'bg-indigo-500/20', sparkline: [3, 5, 4, 7, 8, 10, 12] },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {primaryStats.map((stat, index) => (
          <StatCard key={stat.label} {...stat} delay={index} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {secondaryStats.map((stat, index) => (
          <StatCard key={stat.label} {...stat} delay={index + 4} />
        ))}
      </div>
    </div>
  );
}
