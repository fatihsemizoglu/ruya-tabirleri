import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  TrendingUp, Eye, Heart, Star, ChevronUp, Loader2, Flame, Award,
  Search, Grid3X3, List, Clock, Filter, ArrowUpRight, Sparkles,
  Trophy, Medal, Zap, BarChart3
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState as PremiumEmptyState } from '@/components/ui/empty-state';
import { Layout } from '@/components/layout/Layout';
import { PremiumBackground, PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { captureError } from '@/lib/logger';
import type { Dream, Category } from '@/types/database';
import { Seo } from '@/components/Seo';

const ITEMS_PER_PAGE = 12;

type TimeFilter = 'all' | 'today' | 'week' | 'month' | 'year';
type ViewMode = 'grid' | 'list';

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const startTime = performance.now();
    let raf: number;
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return <span ref={ref}>{count.toLocaleString('tr-TR')}{suffix}</span>;
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: [0.25, 0.25, 0, 1] as [number, number, number, number] },
  }),
};

export default function Popular() {
  const [mostViewed, setMostViewed] = useState<Dream[]>([]);
  const [mostLiked, setMostLiked] = useState<Dream[]>([]);
  const [featured, setFeatured] = useState<Dream[]>([]);
  const [trending, setTrending] = useState<Dream[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trending');
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [viewedPage, setViewedPage] = useState(1);
  const [likedPage, setLikedPage] = useState(1);
  const [featuredPage, setFeaturedPage] = useState(1);
  const [hasMoreViewed, setHasMoreViewed] = useState(true);
  const [hasMoreLiked, setHasMoreLiked] = useState(true);
  const [hasMoreFeatured, setHasMoreFeatured] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [totalStats, setTotalStats] = useState({
    totalDreams: 0,
    totalViews: 0,
    totalLikes: 0,
  });

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setShowScrollTop(window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getTimeFilterDate = useCallback(() => {
    const now = new Date();
    switch (timeFilter) {
      case 'today':
        return new Date(now.setHours(0, 0, 0, 0)).toISOString();
      case 'week':
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
      default:
        return null;
    }
  }, [timeFilter]);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('categories').select('*');
    if (data) {
      const categoryMap: Record<string, Category> = {};
      data.forEach((cat) => {
        categoryMap[cat.id] = cat as Category;
      });
      setCategories(categoryMap);
    }
  }, []);

  const fetchTotalStats = useCallback(async () => {
    const { data } = await supabase
      .from('dreams')
      .select('view_count, like_count')
      .eq('is_published', true);

    if (data) {
      setTotalStats({
        totalDreams: data.length,
        totalViews: data.reduce((sum, d) => sum + (d.view_count || 0), 0),
        totalLikes: data.reduce((sum, d) => sum + (d.like_count || 0), 0),
      });
    }
  }, []);

  const fetchDreams = useCallback(async () => {
    setIsLoading(true);
    try {
      const timeFilterDate = getTimeFilterDate();

      const buildQuery = () => {
        let query = supabase
          .from('dreams')
          .select('*')
          .eq('is_published', true);

        if (timeFilterDate) {
          query = query.gte('created_at', timeFilterDate);
        }

        return query;
      };

      const { data: trendingData } = await buildQuery()
        .order('view_count', { ascending: false })
        .order('like_count', { ascending: false })
        .limit(ITEMS_PER_PAGE);

      const withScore = (trendingData || []).map(dream => ({
        ...dream,
        score: (dream.view_count || 0) * 0.3 + (dream.like_count || 0) * 0.7
      }));
      withScore.sort((a, b) => b.score - a.score);
      setTrending(withScore as Dream[]);

      const { data: viewedData } = await buildQuery()
        .order('view_count', { ascending: false })
        .limit(ITEMS_PER_PAGE);
      setMostViewed((viewedData as Dream[]) || []);
      setHasMoreViewed((viewedData?.length || 0) === ITEMS_PER_PAGE);

      const { data: likedData } = await buildQuery()
        .order('like_count', { ascending: false })
        .limit(ITEMS_PER_PAGE);
      setMostLiked((likedData as Dream[]) || []);
      setHasMoreLiked((likedData?.length || 0) === ITEMS_PER_PAGE);

      const { data: featuredData } = await buildQuery()
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(ITEMS_PER_PAGE);
      setFeatured((featuredData as Dream[]) || []);
      setHasMoreFeatured((featuredData?.length || 0) === ITEMS_PER_PAGE);
    } catch (error) {
      captureError(error, { tags: { feature: 'popular' }, extra: { context: 'fetch-dreams' } });
    } finally {
      setIsLoading(false);
    }
  }, [getTimeFilterDate]);

  useEffect(() => {
    fetchCategories();
    fetchTotalStats();
  }, [fetchCategories, fetchTotalStats]);

  useEffect(() => {
    fetchDreams();
  }, [fetchDreams]);

  const loadMore = async (type: 'viewed' | 'liked' | 'featured') => {
    setLoadingMore(true);
    try {
      const timeFilterDate = getTimeFilterDate();

      let query = supabase
        .from('dreams')
        .select('*')
        .eq('is_published', true);

      if (timeFilterDate) {
        query = query.gte('created_at', timeFilterDate);
      }

      if (type === 'viewed') {
        const offset = viewedPage * ITEMS_PER_PAGE;
        const { data } = await query
          .order('view_count', { ascending: false })
          .range(offset, offset + ITEMS_PER_PAGE - 1);
        if (data) {
          setMostViewed(prev => [...prev, ...(data as Dream[])]);
          setHasMoreViewed(data.length === ITEMS_PER_PAGE);
          setViewedPage(prev => prev + 1);
        }
      } else if (type === 'liked') {
        const offset = likedPage * ITEMS_PER_PAGE;
        const { data } = await query
          .order('like_count', { ascending: false })
          .range(offset, offset + ITEMS_PER_PAGE - 1);
        if (data) {
          setMostLiked(prev => [...prev, ...(data as Dream[])]);
          setHasMoreLiked(data.length === ITEMS_PER_PAGE);
          setLikedPage(prev => prev + 1);
        }
      } else {
        const offset = featuredPage * ITEMS_PER_PAGE;
        const { data } = await query
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .range(offset, offset + ITEMS_PER_PAGE - 1);
        if (data) {
          setFeatured(prev => [...prev, ...(data as Dream[])]);
          setHasMoreFeatured(data.length === ITEMS_PER_PAGE);
          setFeaturedPage(prev => prev + 1);
        }
      }
    } catch (error) {
      captureError(error, { tags: { feature: 'popular' }, extra: { context: 'load-more' } });
    } finally {
      setLoadingMore(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredTrending = useMemo(() => {
    let result = [...trending];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q) || d.keywords?.some(k => k.toLowerCase().includes(q)));
    }
    if (selectedCategory !== 'all') result = result.filter(d => d.category_id === selectedCategory);
    return result;
  }, [trending, searchQuery, selectedCategory]);

  const filteredViewed = useMemo(() => {
    let result = [...mostViewed];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q) || d.keywords?.some(k => k.toLowerCase().includes(q)));
    }
    if (selectedCategory !== 'all') result = result.filter(d => d.category_id === selectedCategory);
    return result;
  }, [mostViewed, searchQuery, selectedCategory]);

  const filteredLiked = useMemo(() => {
    let result = [...mostLiked];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q) || d.keywords?.some(k => k.toLowerCase().includes(q)));
    }
    if (selectedCategory !== 'all') result = result.filter(d => d.category_id === selectedCategory);
    return result;
  }, [mostLiked, searchQuery, selectedCategory]);

  const filteredFeatured = useMemo(() => {
    let result = [...featured];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q) || d.keywords?.some(k => k.toLowerCase().includes(q)));
    }
    if (selectedCategory !== 'all') result = result.filter(d => d.category_id === selectedCategory);
    return result;
  }, [featured, searchQuery, selectedCategory]);

  const stats = [
    {
      icon: Flame,
      value: totalStats.totalDreams,
      label: 'Toplam Rüya',
      gradient: 'from-orange-500 to-rose-500',
      bg: 'bg-gradient-to-br from-orange-500/10 to-rose-500/10',
      iconBg: 'bg-gradient-to-br from-orange-500/20 to-rose-500/20',
      color: 'text-orange-600 dark:text-orange-400',
      border: 'hover:border-orange-500/30',
    },
    {
      icon: Eye,
      value: totalStats.totalViews,
      label: 'Görüntülenme',
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-gradient-to-br from-blue-500/10 to-cyan-500/10',
      iconBg: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
      color: 'text-blue-600 dark:text-blue-400',
      border: 'hover:border-blue-500/30',
    },
    {
      icon: Heart,
      value: totalStats.totalLikes,
      label: 'Beğeni',
      gradient: 'from-rose-500 to-pink-500',
      bg: 'bg-gradient-to-br from-rose-500/10 to-pink-500/10',
      iconBg: 'bg-gradient-to-br from-rose-500/20 to-pink-500/20',
      color: 'text-rose-600 dark:text-rose-400',
      border: 'hover:border-rose-500/30',
    },
    {
      icon: Award,
      value: featured.length,
      label: 'Öne Çıkan',
      gradient: 'from-amber-500 to-yellow-500',
      bg: 'bg-gradient-to-br from-amber-500/10 to-yellow-500/10',
      iconBg: 'bg-gradient-to-br from-amber-500/20 to-yellow-500/20',
      color: 'text-amber-600 dark:text-amber-400',
      border: 'hover:border-amber-500/30',
    },
  ];

  const timeFilterLabels: Record<TimeFilter, string> = {
    all: 'Tüm Zamanlar',
    today: 'Bugün',
    week: 'Bu Hafta',
    month: 'Bu Ay',
    year: 'Bu Yıl',
  };

  const selectedCategoryData = selectedCategory !== 'all' ? categories[selectedCategory] : null;

  const DreamCard = ({ dream, index }: { dream: Dream; index: number }) => {
    const category = dream.category_id ? categories[dream.category_id] : null;
    const isTopThree = activeTab === 'trending' && index < 3;
    const rankGradient = isTopThree
      ? index === 0
        ? 'from-amber-400 to-yellow-500'
        : index === 1
        ? 'from-slate-300 to-slate-400'
        : 'from-orange-400 to-amber-600'
      : 'from-primary/50 to-primary';

    if (viewMode === 'list') {
      return (
        <motion.div variants={cardVariants} custom={index}>
          <Link
            to={`/ruya/${dream.slug}`}
            className="group flex items-center gap-2.5 border-b border-border/20 px-1 py-2 hover:bg-accent/20 transition-colors"
          >
            <span className={`shrink-0 w-5 h-5 rounded flex items-center justify-center text-[9px] font-semibold ${
              isTopThree
                ? `bg-gradient-to-br ${rankGradient} text-white`
                : 'text-muted-foreground/40'
            }`}>
              {index + 1}
            </span>
            <h3 className="flex-1 min-w-0 text-[12px] font-medium text-foreground/85 group-hover:text-primary truncate transition-colors">
              {dream.title}
            </h3>
            {category && (
              <span className="hidden sm:block text-[10px] text-muted-foreground/50 shrink-0">
                {category.name}
              </span>
            )}
            {dream.is_featured && (
              <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400 shrink-0" />
            )}
          </Link>
        </motion.div>
      );
    }

    return (
      <motion.div variants={cardVariants} custom={index}>
        <Link
          to={`/ruya/${dream.slug}`}
          className={`group relative block bg-card border border-border/40 rounded-lg p-2.5 hover:border-primary/20 hover:bg-accent/30 transition-all duration-200`}
        >
          <div className="flex items-start gap-2">
            <div
              className={`shrink-0 w-5 h-5 rounded flex items-center justify-center text-[9px] font-semibold ${
                isTopThree
                  ? `bg-gradient-to-br ${rankGradient} text-white`
                  : 'bg-muted text-muted-foreground/60'
              }`}
            >
              {index + 1}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[11px] font-medium text-foreground/90 group-hover:text-primary leading-snug line-clamp-1 transition-colors">
                {dream.title}
              </h3>
              {category && (
                <span className="text-[9px] text-muted-foreground/50 mt-0.5 block truncate">
                  {category.name}
                </span>
              )}
            </div>
            {dream.is_featured && (
              <Star className="h-2.5 w-2.5 text-amber-400 fill-amber-400 shrink-0 mt-0.5" />
            )}
          </div>
        </Link>
      </motion.div>
    );
  };

  const DreamGrid = ({ dreams, type, hasMore }: { dreams: Dream[]; type?: 'viewed' | 'liked' | 'featured'; hasMore?: boolean }) => {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2">
            {dreams.map((dream, index) => (
              <DreamCard key={dream.id} dream={dream} index={index} />
            ))}
          </div>
        ) : (
          <div className="space-y-0">
            {dreams.map((dream, index) => (
              <DreamCard key={dream.id} dream={dream} index={index} />
            ))}
          </div>
        )}

        {type && hasMore && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => loadMore(type)}
              disabled={loadingMore}
              className="rounded-xl px-8 h-12 border-border hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Daha Fazla Göster
                </>
              )}
            </Button>
          </div>
        )}
      </motion.div>
    );
  };

  const LoadingSkeleton = () => (
    <div className={viewMode === 'grid' ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2' : 'space-y-1'}>
      {Array.from({ length: 14 }).map((_, i) =>
        viewMode === 'grid' ? (
          <div key={i} className="bg-card border border-border/30 rounded-lg p-2.5">
            <div className="flex items-start gap-2">
              <Skeleton className="h-5 w-5 rounded shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2 w-2/3" />
              </div>
            </div>
          </div>
        ) : (
          <div key={i} className="flex items-center gap-2.5 px-1 py-2 border-b border-border/10">
            <Skeleton className="h-5 w-5 rounded shrink-0" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-2 w-16 hidden sm:block" />
          </div>
        )
      )}
    </div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-8">
      <PremiumEmptyState
        icon="search"
        title={message}
        description="Filtreleri değiştirerek veya aramayı temizleyerek yeni sonuçlar keşfedebilirsiniz."
      />
    </div>
  );

  return (
    <Layout>
      <Seo
        title="Popüler Rüya Tabirleri"
        description="En çok okunan ve aranan popüler rüya tabirleri. Trend rüya yorumlarını keşfedin."
        path="/populer"
      />
      <PremiumBackground variant="soft" className="absolute -top-20" />
      <div className="container py-8 md:py-12 relative">
        {/* Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-4"
          >
            <PremiumBadge>
              <TrendingUp className="h-3.5 w-3.5" />
              Trend Listeler
            </PremiumBadge>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.025em] text-foreground mb-3 leading-[1.05]"
          >
            Popüler{' '}
            <GradientText>Rüya Tabirleri</GradientText>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            En çok aranan ve beğenilen rüya tabirlerini keşfedin.
          </motion.p>
        </div>

        {/* Stats Cards */}
        {!isLoading && (
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
        )}

        {/* Sticky Filters Bar */}
        <div className="sticky top-16 z-30 bg-background/70 backdrop-blur-xl border border-border/40 rounded-2xl p-3 mb-6 shadow-lg shadow-black/5">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Popüler rüyalarda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:bg-background focus-visible:border-primary/30 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
                <SelectTrigger className="w-[150px] h-11 rounded-xl bg-muted/30 border-border/50">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Object.entries(timeFilterLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[240px] h-11 rounded-xl bg-muted/30 border-border/50">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                  {selectedCategoryData ? (
                    <>
                      <CategoryIcon icon={selectedCategoryData.icon} className="h-4 w-4 text-foreground mr-1.5 shrink-0" />
                      <span className="truncate">{selectedCategoryData.name}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-base leading-none mr-1.5">🌙</span>
                      <SelectValue placeholder="Tüm Kategoriler" />
                    </>
                  )}
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">
                    <span className="text-base leading-none mr-2">🌙</span>
                    <span>Tüm Kategoriler</span>
                  </SelectItem>
                  {Object.values(categories).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <CategoryIcon icon={category.icon} className="h-4 w-4 text-foreground" />
                      <span>{category.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center border border-border/50 rounded-xl overflow-hidden bg-muted/30">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={`h-11 w-11 rounded-none ${
                    viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={`h-11 w-11 rounded-none ${
                    viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
                  }`}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Active filters */}
        {(searchQuery || timeFilter !== 'all' || selectedCategory !== 'all') && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-6 text-sm text-muted-foreground flex-wrap"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs font-medium">Filtreler:</span>
            {timeFilter !== 'all' && (
              <Badge variant="secondary" className="rounded-full text-xs">
                {timeFilterLabels[timeFilter]}
              </Badge>
            )}
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="rounded-full text-xs gap-1">
                <CategoryIcon icon={categories[selectedCategory]?.icon} className="h-3 w-3" />
                {categories[selectedCategory]?.name}
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="rounded-full text-xs">
                "{searchQuery}"
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setTimeFilter('all');
                setSelectedCategory('all');
              }}
              className="text-xs h-7 rounded-full text-muted-foreground hover:text-foreground"
            >
              Temizle
            </Button>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-8 h-12 p-1 bg-muted/30 rounded-2xl">
            <TabsTrigger
              value="trending"
              className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground flex items-center gap-2 text-xs sm:text-sm"
            >
              <Flame className="h-4 w-4" />
              <span className="hidden sm:inline">Trend</span>
            </TabsTrigger>
            <TabsTrigger
              value="viewed"
              className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground flex items-center gap-2 text-xs sm:text-sm"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Görüntülenen</span>
            </TabsTrigger>
            <TabsTrigger
              value="liked"
              className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground flex items-center gap-2 text-xs sm:text-sm"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Beğenilen</span>
            </TabsTrigger>
            <TabsTrigger
              value="featured"
              className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm data-[state=active]:text-foreground flex items-center gap-2 text-xs sm:text-sm"
            >
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Öne Çıkan</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="mt-0">
            {isLoading ? (
              <LoadingSkeleton />
            ) : filteredTrending.length > 0 ? (
              <DreamGrid dreams={filteredTrending} />
            ) : (
              <EmptyState message="Trend rüya tabiri bulunamadı." />
            )}
          </TabsContent>

          <TabsContent value="viewed" className="mt-0">
            {isLoading ? (
              <LoadingSkeleton />
            ) : filteredViewed.length > 0 ? (
              <DreamGrid
                dreams={filteredViewed}
                type="viewed"
                hasMore={hasMoreViewed && !searchQuery && selectedCategory === 'all'}
              />
            ) : (
              <EmptyState message="Görüntülenen rüya tabiri bulunamadı." />
            )}
          </TabsContent>

          <TabsContent value="liked" className="mt-0">
            {isLoading ? (
              <LoadingSkeleton />
            ) : filteredLiked.length > 0 ? (
              <DreamGrid
                dreams={filteredLiked}
                type="liked"
                hasMore={hasMoreLiked && !searchQuery && selectedCategory === 'all'}
              />
            ) : (
              <EmptyState message="Beğenilen rüya tabiri bulunamadı." />
            )}
          </TabsContent>

          <TabsContent value="featured" className="mt-0">
            {isLoading ? (
              <LoadingSkeleton />
            ) : filteredFeatured.length > 0 ? (
              <DreamGrid
                dreams={filteredFeatured}
                type="featured"
                hasMore={hasMoreFeatured && !searchQuery && selectedCategory === 'all'}
              />
            ) : (
              <EmptyState message="Öne çıkan rüya tabiri bulunamadı." />
            )}
          </TabsContent>
        </Tabs>

        {/* Top 3 Podium Section */}
        {!isLoading && trending.length >= 3 && (
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
        )}

        {/* Scroll to Top */}
        {showScrollTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              size="icon"
              onClick={scrollToTop}
              className="rounded-full shadow-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground hover:from-primary/90 hover:to-primary/70 h-12 w-12 hover:shadow-2xl hover:shadow-primary/25 transition-all duration-300"
            >
              <ChevronUp className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
