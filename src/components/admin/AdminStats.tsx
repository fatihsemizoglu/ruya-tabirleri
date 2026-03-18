import { useQuery } from '@tanstack/react-query';
import { BookOpen, FolderOpen, Users, FileText, Eye, Heart, Star, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendUp?: boolean;
  color: string;
  delay?: number;
}

function StatCard({ label, value, icon: Icon, trend, trendUp, color, delay = 0 }: StatCardProps) {
  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-white p-4",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
        "dark:bg-slate-900/50"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Gradient Background */}
      <div className={cn("absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100", color)} />
      
      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
            {label}
          </p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {value}
          </p>
          {trend && (
            <div className={cn(
              "mt-1.5 flex items-center gap-1 text-xs font-medium",
              trendUp ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
            )}>
              {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110",
          color.replace('bg-gradient-to-br', '').replace('/10', '/20')
        )}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export function AdminStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await adminApi.getStatistics();
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch stats');
      }
      
      const data = response.data;
      
      return {
        dreams: data.totalDreams || 0,
        categories: data.totalCategories || 0,
        users: data.totalUsers || 0,
        blogPosts: 0,
        featured: data.featuredDreams || 0,
        totalViews: data.totalViews || 0,
        totalLikes: data.totalLikes || 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-4 dark:bg-slate-900/50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-3 w-16 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-2 h-7 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const primaryStats = [
    {
      label: 'Toplam Rüya',
      value: stats?.dreams.toLocaleString('tr-TR') || 0,
      icon: BookOpen,
      color: 'bg-gradient-to-br from-blue-500 to-blue-600',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Kategoriler',
      value: stats?.categories.toLocaleString('tr-TR') || 0,
      icon: FolderOpen,
      color: 'bg-gradient-to-br from-violet-500 to-purple-600',
      trend: '+5%',
      trendUp: true,
    },
    {
      label: 'Kullanıcılar',
      value: stats?.users.toLocaleString('tr-TR') || 0,
      icon: Users,
      color: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      trend: '+8%',
      trendUp: true,
    },
    {
      label: 'Blog Yazıları',
      value: stats?.blogPosts.toLocaleString('tr-TR') || 0,
      icon: FileText,
      color: 'bg-gradient-to-br from-orange-500 to-amber-600',
      trend: '+15%',
      trendUp: true,
    },
  ];

  const secondaryStats = [
    {
      label: 'Öne Çıkan',
      value: stats?.featured.toLocaleString('tr-TR') || 0,
      icon: Star,
      color: 'bg-gradient-to-br from-yellow-400 to-amber-500',
    },
    {
      label: 'Görüntüleme',
      value: stats?.totalViews?.toLocaleString('tr-TR') || 0,
      icon: Eye,
      color: 'bg-gradient-to-br from-cyan-500 to-blue-500',
    },
    {
      label: 'Beğeni',
      value: stats?.totalLikes?.toLocaleString('tr-TR') || 0,
      icon: Heart,
      color: 'bg-gradient-to-br from-rose-500 to-pink-600',
    },
    {
      label: 'Ort. Görüntüleme',
      value: stats?.dreams && stats.dreams > 0 
        ? Math.round((stats.totalViews || 0) / stats.dreams).toLocaleString('tr-TR')
        : 0,
      icon: TrendingUp,
      color: 'bg-gradient-to-br from-indigo-500 to-violet-600',
    },
  ];

  return (
    <div className="space-y-3">
      {/* Primary Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {primaryStats.map((stat, index) => (
          <StatCard key={stat.label} {...stat} delay={index * 50} />
        ))}
      </div>
      
      {/* Secondary Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {secondaryStats.map((stat, index) => (
          <StatCard key={stat.label} {...stat} delay={(index + 4) * 50} />
        ))}
      </div>
    </div>
  );
}
