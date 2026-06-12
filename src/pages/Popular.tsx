import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Eye, Heart, Star, ChevronUp, Loader2, Flame, Award, Sparkles, Search, Grid3X3, List, Clock, Filter, ArrowUpRight } from 'lucide-react';
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
import type { Dream, Category } from '@/types/database';
import { Seo } from '@/components/Seo';

const ITEMS_PER_PAGE = 12;

type TimeFilter = 'all' | 'today' | 'week' | 'month' | 'year';
type ViewMode = 'grid' | 'list';

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
      console.error('Error fetching dreams:', error);
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
      console.error('Error loading more dreams:', error);
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
      value: totalStats.totalDreams.toLocaleString('tr-TR'),
      label: 'Toplam Rüya',
      color: 'from-orange-500 to-red-500',
      bg: 'bg-orange-500/10',
      text: 'text-orange-600 dark:text-orange-400',
    },
    {
      icon: Eye,
      value: totalStats.totalViews.toLocaleString('tr-TR'),
      label: 'Görüntülenme',
      color: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/10',
      text: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: Heart,
      value: totalStats.totalLikes.toLocaleString('tr-TR'),
      label: 'Beğeni',
      color: 'from-rose-500 to-pink-500',
      bg: 'bg-rose-500/10',
      text: 'text-rose-600 dark:text-rose-400',
    },
    {
      icon: Award,
      value: featured.length.toString(),
      label: 'Öne Çıkan',
      color: 'from-amber-500 to-yellow-500',
      bg: 'bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-400',
    },
  ];

  const timeFilterLabels: Record<TimeFilter, string> = {
    all: 'Tüm Zamanlar',
    today: 'Bugün',
    week: 'Bu Hafta',
    month: 'Bu Ay',
    year: 'Bu Yıl',
  };

  // Seçili kategorinin bilgisini getir
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
        <div>
          <Link
            to={`/ruya/${dream.slug}`}
            style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
            className="render-optimize group flex items-center gap-4 bg-card border border-border/50 rounded-2xl p-4 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 animate-fadeIn"
          >
            <div className="shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              #{index + 1}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                {dream.is_featured && (
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500 shrink-0" />
                )}
                {category && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <CategoryIcon icon={category.icon} className="h-3.5 w-3.5" /> {category.name}
                  </Badge>
                )}
              </div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {dream.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                {dream.content}
              </p>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-sm text-muted-foreground">
              <div className="hidden sm:flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                <span className="font-medium text-xs">
                  {(dream.view_count || 0).toLocaleString('tr-TR')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5" />
                <span className="font-medium text-xs">
                  {(dream.like_count || 0).toLocaleString('tr-TR')}
                </span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </Link>
        </div>
      );
    }

    return (
      <div className={isTopThree ? 'md:col-span-1' : ''}>
        <Link
          to={`/ruya/${dream.slug}`}
          style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
          className={`render-optimize group relative block h-full bg-card border border-border/50 rounded-2xl p-6 overflow-hidden hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-500 animate-fadeIn`}
        >
          {/* Top gradient bar */}
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${rankGradient}`} />

          {/* Hover shine */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />

          <div className="relative">
            {/* Top row: rank + category */}
            <div className="flex items-center justify-between mb-4">
              <div className={`flex items-center gap-2 ${isTopThree ? '' : ''}`}>
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                    isTopThree
                      ? `bg-gradient-to-br ${rankGradient} text-white shadow-lg`
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isTopThree ? ['🥇', '🥈', '🥉'][index] : `#${index + 1}`}
                </div>
                {dream.is_featured && (
                  <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                )}
              </div>
              {category && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <CategoryIcon icon={category.icon} className="h-3.5 w-3.5" /> {category.name}
                </Badge>
              )}
            </div>

            {/* Title */}
            <h3 className={`font-bold font-serif-dream text-foreground mb-3 group-hover:text-primary transition-colors duration-300 line-clamp-2 ${isTopThree ? 'text-xl' : 'text-lg'}`}>
              {dream.title}
            </h3>

            {/* Excerpt */}
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed">
              {dream.content}
            </p>

            {/* Keywords */}
            {dream.keywords && dream.keywords.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {dream.keywords.slice(0, 3).map((keyword) => (
                  <span
                    key={keyword}
                    className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                  >
                    #{keyword}
                  </span>
                ))}
              </div>
            )}

            {/* Footer stats */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  <span className="font-semibold">{(dream.view_count || 0).toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-3.5 w-3.5" />
                  <span className="font-semibold">{(dream.like_count || 0).toLocaleString('tr-TR')}</span>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  };

  const DreamGrid = ({ dreams, type, hasMore }: { dreams: Dream[]; type?: 'viewed' | 'liked' | 'featured'; hasMore?: boolean }) => {
    return (
      <div className="space-y-8">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {dreams.map((dream, index) => (
              <DreamCard key={dream.id} dream={dream} index={index} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
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
              className="rounded-xl px-8 border-border hover:border-primary/30 hover:bg-primary/5"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                'Daha Fazla Göster'
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3'}>
      {Array.from({ length: 6 }).map((_, i) =>
        viewMode === 'grid' ? (
          <div key={i} className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500/30 via-fuchsia-500/30 to-pink-500/30" />
            <div className="flex items-start justify-between mb-4">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-6 w-4/5 mb-3" />
            <div className="space-y-2 mb-5">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="h-3.5 w-11/12" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border/40">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </div>
          </div>
        ) : (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5 bg-card border border-border/40 rounded-xl">
            <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        )
      )}
    </div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="bg-card border border-border/40 rounded-2xl">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-10">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
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
                </div>
              );
            })}
          </div>
        )}

        {/* Sticky Filters Bar */}
        <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl p-3 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Popüler rüyalarda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl bg-muted/30 border-border/50 focus-visible:bg-background"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
                <SelectTrigger className="w-[150px] h-10 rounded-xl bg-muted/30 border-border/50">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(timeFilterLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[240px] h-10 rounded-xl bg-muted/30 border-border/50">
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
                <SelectContent>
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
                  className={`h-10 w-10 rounded-none ${
                    viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={`h-10 w-10 rounded-none ${
                    viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''
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
          <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground flex-wrap animate-in fade-in slide-in-from-top-1 duration-200">
            <span>Filtreler:</span>
            {timeFilter !== 'all' && (
              <Badge variant="secondary" className="rounded-full">
                {timeFilterLabels[timeFilter]}
              </Badge>
            )}
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="rounded-full">
                {categories[selectedCategory]?.name}
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="rounded-full">
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
              className="text-xs h-7 rounded-full"
            >
              Temizle
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-8 h-12 p-1 bg-muted/30 rounded-2xl">
            <TabsTrigger
              value="trending"
              className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-2"
            >
              <Flame className="h-4 w-4" />
              <span className="hidden sm:inline">Trend</span>
            </TabsTrigger>
            <TabsTrigger
              value="viewed"
              className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Görüntülenen</span>
            </TabsTrigger>
            <TabsTrigger
              value="liked"
              className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-2"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Beğenilen</span>
            </TabsTrigger>
            <TabsTrigger
              value="featured"
              className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-2"
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

        {/* Top 3 Highlights */}
        {!isLoading && trending.length >= 3 && (
          <section className="mt-16 pt-10 border-t border-border/50">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-3">
                <Award className="h-3.5 w-3.5" />
                Şampiyonlar
              </div>
              <h2 className="text-2xl md:text-3xl font-bold font-serif-dream text-foreground">
                En Popüler 3 Rüya
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {trending.slice(0, 3).map((dream, index) => {
                const medals = ['🥇', '🥈', '🥉'];
                const gradients = [
                  'from-amber-500/15 to-amber-500/5 border-amber-500/30',
                  'from-slate-400/15 to-slate-400/5 border-slate-400/30',
                  'from-orange-500/15 to-orange-500/5 border-orange-500/30',
                ];
                const category = dream.category_id ? categories[dream.category_id] : null;

                return (
                  <div key={dream.id}>
                    <Link
                      to={`/ruya/${dream.slug}`}
                      className={`group relative block overflow-hidden rounded-2xl bg-card p-6 border ${gradients[index]} hover:shadow-xl hover:-translate-y-1 transition-all duration-500`}
                    >
                      <div className="absolute top-3 right-3 text-3xl group-hover:scale-110 transition-transform">
                        {medals[index]}
                      </div>

                      {category && (
                        <Badge variant="secondary" className="mb-3 gap-1">
                          <CategoryIcon icon={category.icon} className="h-3.5 w-3.5" /> {category.name}
                        </Badge>
                      )}

                      <h3 className="text-lg font-bold font-serif-dream mb-2 group-hover:text-primary transition-colors pr-10 line-clamp-2">
                        {dream.title}
                      </h3>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {dream.content}
                      </p>

                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                          <Eye className="h-3.5 w-3.5" />
                          {(dream.view_count || 0).toLocaleString('tr-TR')}
                        </span>
                        <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                          <Heart className="h-3.5 w-3.5" />
                          {(dream.like_count || 0).toLocaleString('tr-TR')}
                        </span>
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Scroll to Top */}
        {showScrollTop && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in zoom-in duration-200">
            <Button
              size="icon"
              onClick={scrollToTop}
              className="rounded-full shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 h-12 w-12"
            >
              <ChevronUp className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
