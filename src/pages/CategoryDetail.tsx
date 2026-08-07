import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { captureError } from '@/lib/logger';
import type { Category, Dream } from '@/types/database';
import { Seo } from '@/components/Seo';
import { CategoryHero } from '@/components/category/CategoryHero';
import { CategoryStats } from '@/components/category/CategoryStats';
import { CategoryFilters } from '@/components/category/CategoryFilters';
import { CategoryResults } from '@/components/category/CategoryResults';
import { CategoryLoading } from '@/components/category/CategoryLoading';
import { CategoryNotFound } from '@/components/category/CategoryNotFound';
import { pickGradient } from '@/lib/category';
import type { SortOption, ViewMode } from '@/lib/category';

const ITEMS_PER_PAGE = 12;

export default function CategoryDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'popular');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [displayCount, setDisplayCount] = useState(ITEMS_PER_PAGE);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);

  const fetchCategoryAndDreams = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('slug', slug ?? '')
        .maybeSingle();

      if (categoryError) throw categoryError;
      if (!categoryData) {
        setCategory(null);
        return;
      }

      setCategory(categoryData as Category);

      const { data: dreamsData, error: dreamsError } = await supabase
        .from('dreams')
        .select('*')
        .eq('category_id', categoryData.id)
        .eq('is_published', true);

      if (dreamsError) throw dreamsError;
      setDreams((dreamsData as Dream[]) || []);
    } catch (error) {
      captureError(error, { tags: { feature: 'category-detail' } });
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      fetchCategoryAndDreams();
    }
  }, [slug, fetchCategoryAndDreams]);

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

  const allKeywords = useMemo(() => {
    const keywordSet = new Set<string>();
    dreams.forEach(dream => {
      dream.keywords?.forEach(k => keywordSet.add(k));
    });
    return Array.from(keywordSet).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [dreams]);

  const filteredAndSortedDreams = useMemo(() => {
    let result = [...dreams];

    if (showFeaturedOnly) {
      result = result.filter(dream => dream.is_featured);
    }

    if (selectedKeywords.length > 0) {
      result = result.filter(dream =>
        selectedKeywords.some(keyword => dream.keywords?.includes(keyword))
      );
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        dream =>
          dream.title.toLowerCase().includes(query) ||
          dream.content.toLowerCase().includes(query) ||
          dream.keywords?.some(k => k.toLowerCase().includes(query))
      );
    }

    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => b.view_count - a.view_count);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'most-liked':
        result.sort((a, b) => b.like_count - a.like_count);
        break;
      case 'alphabetical':
        result.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
        break;
    }

    return result;
  }, [dreams, searchQuery, sortBy, showFeaturedOnly, selectedKeywords]);

  const activeFilterCount = (showFeaturedOnly ? 1 : 0) + selectedKeywords.length;

  const resetPagination = () => setDisplayCount(ITEMS_PER_PAGE);

  const clearAllFilters = () => {
    setShowFeaturedOnly(false);
    setSelectedKeywords([]);
    setSearchQuery('');
    resetPagination();
  };

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
    resetPagination();
  };

  const displayedDreams = filteredAndSortedDreams.slice(0, displayCount);
  const hasMore = displayCount < filteredAndSortedDreams.length;

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setSearchParams({ sort: value });
    resetPagination();
  };

  const loadMore = () => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalViews = dreams.reduce((sum, d) => sum + d.view_count, 0);
  const totalLikes = dreams.reduce((sum, d) => sum + d.like_count, 0);
  const featuredCount = dreams.filter(d => d.is_featured).length;
  const featuredGradient = category
    ? pickGradient(category.id + category.slug)
    : 'from-violet-500 to-fuchsia-500';

  if (isLoading) {
    return <CategoryLoading />;
  }

  if (!category) {
    return <CategoryNotFound />;
  }

  return (
    <Layout>
      <Seo
        title={`${category.name} Rüya Tabirleri`}
        description={category.description || `${category.name} kategorisindeki rüya tabirleri ve yorumları.`}
        path={`/kategori/${category.slug}`}
      />
      <div className="min-h-screen">
        <CategoryHero category={category} featuredGradient={featuredGradient} />

        <CategoryStats
          dreamsCount={dreams.length}
          totalViews={totalViews}
          totalLikes={totalLikes}
          featuredCount={featuredCount}
        />

        <CategoryFilters
          searchQuery={searchQuery}
          onSearchChange={(value) => {
            setSearchQuery(value);
            resetPagination();
          }}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showFeaturedOnly={showFeaturedOnly}
          onFeaturedChange={(checked) => {
            setShowFeaturedOnly(checked);
            resetPagination();
          }}
          selectedKeywords={selectedKeywords}
          onToggleKeyword={toggleKeyword}
          onClearAll={clearAllFilters}
          allKeywords={allKeywords}
          activeFilterCount={activeFilterCount}
        />

        <CategoryResults
          dreams={displayedDreams}
          totalResults={filteredAndSortedDreams.length}
          searchQuery={searchQuery}
          viewMode={viewMode}
          hasMore={hasMore}
          remainingCount={filteredAndSortedDreams.length - displayCount}
          onLoadMore={loadMore}
          onClearSearch={() => setSearchQuery('')}
        />

        {showScrollTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
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
