import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  Heart,
  Users,
  BookOpen,
  MessageSquare,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calendar,
  Crown,
  Flame,
  Activity,
  Database,
  Star,
  Sparkles,
  PlusCircle,
  FolderOpen,
  Check,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import { cn } from '@/lib/utils';

const CHART_COLORS = ['#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#6366f1'];

function useGreeting() {
  return useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 6) return 'İyi geceler';
    if (hour < 12) return 'Günaydın';
    if (hour < 18) return 'İyi günler';
    return 'İyi akşamlar';
  }, []);
}

interface KPICardProps {
  title: string;
  value: number | string;
  previousValue?: number;
  icon: LucideIcon;
  gradient: string;
  iconBg: string;
  suffix?: string;
  loading?: boolean;
}

function KPICard({ title, value, previousValue, icon: Icon, gradient, iconBg, suffix = '', loading }: KPICardProps) {
  const numValue = typeof value === 'number' ? value : parseInt(value) || 0;
  const change = previousValue ? ((numValue - previousValue) / previousValue) * 100 : 0;
  const isPositive = change > 0;
  const isNeutral = change === 0;

  if (loading) {
    return (
      <div className="relative overflow-hidden bg-card border border-border/50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start justify-between mb-3">
          <Skeleton className="h-10 w-10 rounded-xl" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="h-4 w-20 mb-2" />
        <Skeleton className="h-8 w-24" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group relative overflow-hidden bg-card border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-border transition-all duration-300"
    >
      <div className={cn('absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity bg-gradient-to-br', gradient)} />

      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm bg-gradient-to-br', iconBg)}>
            <Icon className="h-5 w-5" />
          </div>
          {previousValue !== undefined && (
            <div
              className={cn(
                'flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md',
                isNeutral
                  ? 'text-muted-foreground bg-muted'
                  : isPositive
                    ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                    : 'text-red-700 dark:text-red-400 bg-red-500/10'
              )}
            >
              {isNeutral ? (
                <Minus className="h-3 w-3" />
              ) : isPositive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline gap-1.5 mt-1.5">
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {typeof value === 'number' ? value.toLocaleString('tr-TR') : value}
          </span>
          {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
        </div>
        {previousValue !== undefined && (
          <p className="text-[10px] text-muted-foreground mt-1">geçen haftaya göre</p>
        )}
      </div>
    </motion.div>
  );
}

interface SystemStatusProps {
  label: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  themeClass: string;
  iconColor: string;
}

function SystemStatusCard({ label, value, subtext, icon: Icon, themeClass, iconColor }: SystemStatusProps) {
  return (
    <div className={cn('p-4 rounded-xl border flex flex-col justify-between relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5', themeClass)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</span>
        <Icon className={cn('h-4 w-4', iconColor)} />
      </div>
      <div>
        <div className="text-2xl font-black tracking-tight">{value}</div>
        <div className="text-[10px] font-medium opacity-65 mt-0.5">{subtext}</div>
      </div>
    </div>
  );
}

interface SecondaryStatProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  gradient: string;
  bgClass: string;
}

function SecondaryStat({ label, value, icon: Icon, gradient, bgClass }: SecondaryStatProps) {
  return (
    <div className="group p-4 rounded-2xl bg-card border border-border/40 hover:border-border transition-all shadow-sm flex items-center gap-3.5">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br text-white shadow-sm', gradient, bgClass)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">{label}</div>
        <div className="text-lg sm:text-xl font-black text-foreground tracking-tight mt-0.5">{value}</div>
      </div>
    </div>
  );
}

interface QuickActionProps {
  label: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  gradient: string;
}

function QuickAction({ label, description, icon: Icon, onClick, gradient }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className="group w-full flex items-center gap-3.5 p-3.5 rounded-xl bg-card border border-border/50 hover:border-violet-500/30 hover:shadow-md transition-all duration-200"
    >
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm bg-gradient-to-br group-hover:scale-110 transition-transform duration-200', gradient)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="font-semibold text-sm text-foreground truncate">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-violet-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0" />
    </button>
  );
}

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityTitle: string | null;
  timestamp: string;
  username: string;
}

const ACTION_LABELS: Record<string, string> = {
  create: 'oluşturdu',
  update: 'güncelledi',
  delete: 'sildi',
  view: 'görüntüledi',
  publish: 'yayınladı',
  unpublish: 'yayından kaldırdı',
  approve: 'onayladı',
  reject: 'reddetti',
};

const ENTITY_LABELS: Record<string, string> = {
  dream: 'Rüya',
  category: 'Kategori',
  user: 'Kullanıcı',
  comment: 'Yorum',
  blog_post: 'Blog',
  blog_category: 'Blog Kategorisi',
  setting: 'Ayar',
};

function getActionIcon(action: string): { icon: LucideIcon; color: string } {
  switch (action) {
    case 'create':
      return { icon: PlusCircle, color: 'text-emerald-500 bg-emerald-500/10' };
    case 'update':
      return { icon: Activity, color: 'text-blue-500 bg-blue-500/10' };
    case 'delete':
      return { icon: TrendingDown, color: 'text-red-500 bg-red-500/10' };
    case 'approve':
      return { icon: Check, color: 'text-emerald-500 bg-emerald-500/10' };
    case 'view':
      return { icon: Eye, color: 'text-violet-500 bg-violet-500/10' };
    default:
      return { icon: Clock, color: 'text-slate-500 bg-slate-500/10' };
  }
}

interface DashboardData {
  totals: {
    dreams: number;
    blogPosts: number;
    users: number;
    comments: number;
    pendingComments: number;
    categories: number;
    totalViews: number;
    totalLikes: number;
    featured: number;
    blogDrafts: number;
    totalMessages: number;
    unreadMessages: number;
  };
  weekly: {
    thisWeekDreams: number;
    lastWeekDreams: number;
    thisWeekUsers: number;
    lastWeekUsers: number;
    thisWeekComments: number;
    lastWeekComments: number;
  };
  dailyData: Array<{ date: string; dreams: number; users: number; comments: number }>;
  categoryData: Array<{ name: string; value: number }>;
  topDreams: Array<{ id: string; title: string; slug: string; view_count: number; like_count: number }>;
  topBlogPosts: Array<{ id: string; title: string; slug: string; view_count: number; like_count: number }>;
}

interface UnifiedDashboardProps {
  onNavigate?: (tab: string) => void;
}

export function UnifiedDashboard({ onNavigate }: UnifiedDashboardProps) {
  const greeting = useGreeting();
  const now = new Date();

  const { data: stats, isLoading } = useQuery<DashboardData>({
    queryKey: ['unified-dashboard'],
    queryFn: async () => {
      const weekAgo = subDays(now, 7);
      const twoWeeksAgo = subDays(now, 14);
      const monthAgo = subDays(now, 30);

      const [
        dreamsResult,
        categoriesResult,
        usersResult,
        commentsResult,
        featuredResult,
        viewsResult,
        likesResult,
        blogResult,
        blogDraftsResult,
        messagesResult,
        messagesUnreadResult,
        blogPostsResult,
      ] = await Promise.all([
        supabase.from('dreams').select('id, created_at, view_count, like_count, title, slug'),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id, created_at'),
        supabase.from('comments').select('id, created_at, is_approved'),
        supabase.from('dreams').select('id', { count: 'exact', head: true }).eq('is_featured', true),
        supabase.from('dreams').select('view_count'),
        supabase.from('dreams').select('like_count'),
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('is_published', false),
        supabase.from('contact_messages').select('id', { count: 'exact', head: true }),
        supabase.from('contact_messages').select('id', { count: 'exact', head: true }).eq('is_read', false),
        supabase.from('blog_posts').select('id, created_at, view_count, like_count, title, slug'),
      ]);

      const dreams = dreamsResult.data || [];
      const users = usersResult.data || [];
      const comments = commentsResult.data || [];
      const blogPosts = blogPostsResult.data || [];

      const totalViews = viewsResult.data?.reduce((s, d) => s + (d.view_count || 0), 0) || 0;
      const totalLikes = likesResult.data?.reduce((s, d) => s + (d.like_count || 0), 0) || 0;

      const inWindow = (d: string) => {
        const t = new Date(d).getTime();
        return t >= weekAgo.getTime();
      };
      const inLastWindow = (d: string) => {
        const t = new Date(d).getTime();
        return t >= twoWeeksAgo.getTime() && t < weekAgo.getTime();
      };

      const thisWeekDreams = dreams.filter(d => inWindow(d.created_at)).length;
      const lastWeekDreams = dreams.filter(d => inLastWindow(d.created_at)).length;
      const thisWeekUsers = users.filter(u => inWindow(u.created_at)).length;
      const lastWeekUsers = users.filter(u => inLastWindow(u.created_at)).length;
      const thisWeekComments = comments.filter(c => inWindow(c.created_at)).length;
      const lastWeekComments = comments.filter(c => inLastWindow(c.created_at)).length;

      const dailyData = eachDayOfInterval({ start: monthAgo, end: now }).map(date => {
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        const dreamsCount = dreams.filter(d => {
          const t = new Date(d.created_at);
          return t >= dayStart && t <= dayEnd;
        }).length;
        const usersCount = users.filter(u => {
          const t = new Date(u.created_at);
          return t >= dayStart && t <= dayEnd;
        }).length;
        const commentsCount = comments.filter(c => {
          const t = new Date(c.created_at);
          return t >= dayStart && t <= dayEnd;
        }).length;
        return {
          date: format(date, 'd MMM', { locale: tr }),
          dreams: dreamsCount,
          users: usersCount,
          comments: commentsCount,
        };
      });

      const categoryDist = await supabase
        .from('dreams')
        .select('category_id, categories(name)')
        .not('category_id', 'is', null);

      const categoryMap = new Map<string, number>();
      categoryDist.data?.forEach((d: any) => {
        const name = d.categories?.name || 'Kategorisiz';
        categoryMap.set(name, (categoryMap.get(name) || 0) + 1);
      });
      const categoryData = Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      const topDreams = [...dreams]
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 5)
        .map(d => ({ id: d.id, title: d.title, slug: d.slug, view_count: d.view_count || 0, like_count: d.like_count || 0 }));

      const topBlogPosts = [...blogPosts]
        .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
        .slice(0, 5)
        .map(p => ({ id: p.id, title: p.title, slug: p.slug, view_count: p.view_count || 0, like_count: p.like_count || 0 }));

      return {
        totals: {
          dreams: dreams.length,
          blogPosts: blogResult.count || 0,
          users: users.length,
          comments: comments.length,
          pendingComments: comments.filter(c => !c.is_approved).length,
          categories: categoriesResult.count || 0,
          totalViews,
          totalLikes,
          featured: featuredResult.count || 0,
          blogDrafts: blogDraftsResult.count || 0,
          totalMessages: messagesResult.count || 0,
          unreadMessages: messagesUnreadResult.count || 0,
        },
        weekly: { thisWeekDreams, lastWeekDreams, thisWeekUsers, lastWeekUsers, thisWeekComments, lastWeekComments },
        dailyData,
        categoryData,
        topDreams,
        topBlogPosts,
      };
    },
    staleTime: 60000,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityItem[]>({
    queryKey: ['admin-recent-activity'],
    queryFn: async () => {
      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select('id, user_id, action, entity_type, entity_title, created_at')
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      if (!logs || logs.length === 0) return [];
      const userIds = [...new Set(logs.map(l => l.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, username, full_name')
        .in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return logs.map(log => {
        const profile = profileMap.get(log.user_id);
        return {
          id: log.id,
          action: log.action,
          entityType: log.entity_type,
          entityTitle: log.entity_title,
          timestamp: log.created_at,
          username: profile?.full_name || profile?.username || 'Sistem',
        };
      });
    },
  });

  const systemStatusItems: SystemStatusProps[] = [
    { label: 'Uptime', value: '99.9%', subtext: 'Son 30 gün', icon: Crown, themeClass: 'bg-gradient-to-br from-emerald-50/50 to-emerald-50/20 dark:from-emerald-950/20 dark:to-emerald-950/5 border-emerald-200/50 dark:border-emerald-900/20 text-emerald-900 dark:text-emerald-200', iconColor: 'text-emerald-500' },
    { label: 'Yanıt', value: '45ms', subtext: 'Ortalama süre', icon: Flame, themeClass: 'bg-gradient-to-br from-blue-50/50 to-blue-50/20 dark:from-blue-950/20 dark:to-blue-950/5 border-blue-200/50 dark:border-blue-900/20 text-blue-900 dark:text-blue-200', iconColor: 'text-blue-500' },
    { label: 'Sistem', value: 'Çevrimiçi', subtext: 'Tüm servisler', icon: Activity, themeClass: 'bg-gradient-to-br from-violet-50/50 to-violet-50/20 dark:from-violet-950/20 dark:to-violet-950/5 border-violet-200/50 dark:border-violet-900/20 text-violet-900 dark:text-violet-200', iconColor: 'text-violet-500' },
    { label: 'Veritabanı', value: '12', subtext: 'Aktif bağlantı', icon: Database, themeClass: 'bg-gradient-to-br from-amber-50/50 to-amber-50/20 dark:from-amber-950/20 dark:to-amber-950/5 border-amber-200/50 dark:border-amber-900/20 text-amber-900 dark:text-amber-200', iconColor: 'text-amber-500' },
  ];

  const mainKpis: KPICardProps[] = [
    { title: 'Toplam Rüya', value: stats?.totals.dreams || 0, icon: BookOpen, gradient: 'from-violet-500 to-purple-500', iconBg: 'from-violet-500 to-purple-600' },
    { title: 'Blog Yazıları', value: stats?.totals.blogPosts || 0, previousValue: stats ? Math.max(stats.totals.blogPosts - stats.weekly.thisWeekDreams, 0) : 0, icon: FileText, gradient: 'from-blue-500 to-cyan-500', iconBg: 'from-blue-500 to-cyan-600' },
    { title: 'Kullanıcılar', value: stats?.totals.users || 0, previousValue: stats ? Math.max(stats.totals.users - stats.weekly.thisWeekUsers, 0) : 0, icon: Users, gradient: 'from-emerald-500 to-teal-500', iconBg: 'from-emerald-500 to-teal-600' },
    { title: 'Yorumlar', value: stats?.totals.pendingComments || 0, icon: MessageSquare, gradient: 'from-amber-500 to-orange-500', iconBg: 'from-amber-500 to-orange-600' },
    { title: 'Toplam Görüntülenme', value: stats?.totals.totalViews || 0, icon: Eye, gradient: 'from-pink-500 to-rose-500', iconBg: 'from-pink-500 to-rose-600' },
  ];

  const secondaryStats: SecondaryStatProps[] = [
    { label: 'Öne Çıkan Rüya', value: stats?.totals.featured || 0, icon: Star, gradient: 'from-yellow-500 to-amber-500', bgClass: 'bg-yellow-500/10' },
    { label: 'Toplam Beğeni', value: (stats?.totals.totalLikes || 0).toLocaleString('tr-TR'), icon: Heart, gradient: 'from-rose-500 to-pink-500', bgClass: 'bg-rose-500/10' },
    { label: 'Bu Hafta Rüya', value: stats?.weekly.thisWeekDreams || 0, previousValue: stats?.weekly.lastWeekDreams || 0, icon: TrendingUp, gradient: 'from-emerald-500 to-teal-500', bgClass: 'bg-emerald-500/10' },
    { label: 'Onay Bekleyen', value: stats?.totals.pendingComments || 0, icon: Clock, gradient: 'from-amber-500 to-orange-500', bgClass: 'bg-amber-500/10' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-500/8 via-fuchsia-500/8 to-pink-500/8 border border-violet-500/15 rounded-2xl p-6">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.5) 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        </div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PremiumBadge>
                <Sparkles className="h-3 w-3" />
                Yönetim Paneli
              </PremiumBadge>
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {format(now, "d MMMM yyyy, EEEE", { locale: tr })}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              <GradientText>{greeting}!</GradientText>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sitenin tüm metrikleri ve son aktiviteleri tek bakışta.
            </p>
          </div>
          {stats && (stats.totals.pendingComments > 0 || stats.totals.unreadMessages > 0) && (
            <div className="flex flex-wrap items-center gap-2">
              {stats.totals.pendingComments > 0 && (
                <button
                  onClick={() => onNavigate?.('comments')}
                  className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15 transition-colors"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                  </span>
                  <span className="text-xs font-bold">{stats.totals.pendingComments} bekleyen yorum</span>
                  <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              )}
              {stats.totals.unreadMessages > 0 && (
                <button
                  onClick={() => onNavigate?.('messages')}
                  className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/15 transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold">{stats.totals.unreadMessages} okunmamış mesaj</span>
                  <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* System status row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {systemStatusItems.map((item) => (
          <SystemStatusCard key={item.label} {...item} />
        ))}
      </div>

      {/* Main KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {mainKpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} loading={isLoading} />
        ))}
      </div>

      {/* Secondary stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {secondaryStats.map((item) => (
          <SecondaryStat key={item.label} {...item} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-2 bg-card border border-border/50 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-sm">
                  <TrendingUp className="h-3.5 w-3.5" />
                </div>
                30 Günlük Aktivite Trendi
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Rüya, kullanıcı ve yorum aktiviteleri</p>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full rounded-xl" />
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.dailyData || []}>
                  <defs>
                    <linearGradient id="dreamsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="commentsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis className="text-xs" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    }}
                  />
                  <Area type="monotone" dataKey="dreams" stroke="#8b5cf6" fillOpacity={1} fill="url(#dreamsGrad)" strokeWidth={2} name="Rüyalar" />
                  <Area type="monotone" dataKey="users" stroke="#10b981" fillOpacity={1} fill="url(#usersGrad)" strokeWidth={2} name="Kullanıcılar" />
                  <Area type="monotone" dataKey="comments" stroke="#f59e0b" fillOpacity={1} fill="url(#commentsGrad)" strokeWidth={2} name="Yorumlar" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="flex items-center justify-center gap-5 mt-3 text-[11px] font-semibold text-muted-foreground">
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-violet-500" /> Rüyalar</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Kullanıcılar</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Yorumlar</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-sm">
                  <BookOpen className="h-3.5 w-3.5" />
                </div>
                Kategori Dağılımı
              </h3>
              <p className="text-xs text-muted-foreground mt-1">En çok rüya içeren kategoriler</p>
            </div>
          </div>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full rounded-xl" />
          ) : (stats?.categoryData?.length || 0) > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.categoryData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stats?.categoryData?.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
              Henüz yeterli veri yok
            </div>
          )}
        </motion.div>
      </div>

      {/* Top content + Quick actions + Recent activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center text-white shadow-sm">
                <BookOpen className="h-3.5 w-3.5" />
              </div>
              En Çok Görüntülenen Rüyalar
            </h3>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-6 h-6 rounded-md flex-shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : (stats?.topDreams?.length || 0) === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Henüz rüya yok</div>
          ) : (
            <div className="space-y-2">
              {stats?.topDreams.map((dream, idx) => (
                <Link
                  key={dream.id}
                  to={`/ruya/${dream.slug}`}
                  target="_blank"
                  className="group flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className={cn(
                    'w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black flex-shrink-0',
                    idx === 0 ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                    : idx === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500 text-white'
                    : idx === 2 ? 'bg-gradient-to-br from-orange-600 to-amber-700 text-white'
                    : 'bg-muted text-muted-foreground'
                  )}>
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground line-clamp-1 flex-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                    {dream.title}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
                    <Eye className="h-3 w-3" />
                    {dream.view_count.toLocaleString('tr-TR')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-sm">
                <FileText className="h-3.5 w-3.5" />
              </div>
              En Çok Görüntülenen Blog
            </h3>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-6 h-6 rounded-md flex-shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : (stats?.topBlogPosts?.length || 0) === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Henüz blog yazısı yok</div>
          ) : (
            <div className="space-y-2">
              {stats?.topBlogPosts.map((post, idx) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  target="_blank"
                  className="group flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <span className={cn(
                    'w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black flex-shrink-0',
                    idx === 0 ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white'
                    : idx === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500 text-white'
                    : idx === 2 ? 'bg-gradient-to-br from-orange-600 to-amber-700 text-white'
                    : 'bg-muted text-muted-foreground'
                  )}>
                    {idx + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground line-clamp-1 flex-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {post.title}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold">
                    <Eye className="h-3 w-3" />
                    {post.view_count.toLocaleString('tr-TR')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-sm">
                <Activity className="h-3.5 w-3.5" />
              </div>
              Son Aktiviteler
            </h3>
          </div>
          {activitiesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <Skeleton className="w-7 h-7 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (activities?.length || 0) === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">Henüz aktivite yok</div>
          ) : (
            <div className="space-y-2.5">
              {activities?.slice(0, 6).map((activity) => {
                const { icon: AIcon, color } = getActionIcon(activity.action);
                return (
                  <div key={activity.id} className="flex items-start gap-2.5 group">
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', color)}>
                      <AIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed">
                        <span className="font-semibold text-foreground">{activity.username}</span>{' '}
                        <span className="text-muted-foreground">{ACTION_LABELS[activity.action] || activity.action}</span>{' '}
                        <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                          {ENTITY_LABELS[activity.entityType] || activity.entityType}
                        </span>
                      </p>
                      {activity.entityTitle && (
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">"{activity.entityTitle}"</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="bg-card border border-border/50 rounded-2xl p-5 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            Hızlı İşlemler
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction
            label="Yeni Rüya Ekle"
            description="Yeni tabir oluştur"
            icon={PlusCircle}
            onClick={() => onNavigate?.('dreams')}
            gradient="from-violet-500 to-purple-500"
          />
          <QuickAction
            label="Yeni Blog Yaz"
            description="Blog içeriği ekle"
            icon={FileText}
            onClick={() => onNavigate?.('blog')}
            gradient="from-blue-500 to-cyan-500"
          />
          <QuickAction
            label="Kategori Yönet"
            description="Kategorileri düzenle"
            icon={FolderOpen}
            onClick={() => onNavigate?.('categories')}
            gradient="from-emerald-500 to-teal-500"
          />
          <QuickAction
            label="Yorumları İncele"
            description="Bekleyen onaylar"
            icon={MessageSquare}
            onClick={() => onNavigate?.('comments')}
            gradient="from-amber-500 to-orange-500"
          />
        </div>
      </motion.div>
    </div>
  );
}
