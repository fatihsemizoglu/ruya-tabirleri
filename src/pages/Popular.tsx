import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronUp } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PremiumBackground, PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { captureError } from '@/lib/logger';
import type { Dream, Category } from '@/types/database';
import { Seo } from '@/components/Seo';
import { PopularStats } from '@/components/popular/PopularStats';
import { PopularFilters } from '@/components/popular/PopularFilters';
import { PopularTabs } from '@/components/popular/PopularTabs';
import { PodiumSection } from '@/components/popular/PodiumSection';
import type { TimeFilter, ViewMode } from '@/lib/popular';

const ITEMS_PER_PAGE = 12;

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
          <PopularStats
            totalDreams={totalStats.totalDreams}
            totalViews={totalStats.totalViews}
            totalLikes={totalStats.totalLikes}
            featuredCount={featured.length}
          />
        )}

        {/* Sticky Filters Bar + Active filters */}
        <PopularFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          selectedCategory={selectedCategory}
          onSelectedCategoryChange={setSelectedCategory}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          categories={categories}
        />

        {/* Tabs */}
        <PopularTabs
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          isLoading={isLoading}
          viewMode={viewMode}
          filteredTrending={filteredTrending}
          filteredViewed={filteredViewed}
          filteredLiked={filteredLiked}
          filteredFeatured={filteredFeatured}
          hasMoreViewed={hasMoreViewed}
          hasMoreLiked={hasMoreLiked}
          hasMoreFeatured={hasMoreFeatured}
          loadingMore={loadingMore}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          categories={categories}
          onLoadMore={loadMore}
        />

        {/* Top 3 Podium Section */}
        {!isLoading && trending.length >= 3 && (
          <PodiumSection trending={trending} categories={categories} />
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
              aria-label="Yukarı çık"
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
