import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { AdvancedFilters } from '@/components/search/AdvancedFilters';
import { SearchHeader } from '@/components/search/SearchHeader';
import { SearchResultsHeader } from '@/components/search/SearchResultsHeader';
import { SearchResults } from '@/components/search/SearchResults';
import { SearchLanding } from '@/components/search/SearchLanding';
import { DEFAULT_FILTERS } from '@/lib/search-filters';
import type { AdvancedFilterState } from '@/lib/search-filters';
import { searchDreamsPage, RESULTS_PER_PAGE } from '@/lib/search-data';
import type { ViewMode } from '@/lib/search-data';
import type { DreamSearchResult, Category } from '@/types/database';
import { Seo } from '@/components/Seo';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { captureError } from '@/lib/logger';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState<DreamSearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const {
    recent: recentSearches,
    addSearch: addRecentSearch,
    removeSearch: removeRecentSearch,
    clear: clearRecentSearches,
  } = useRecentSearches();
  const [relatedDreams, setRelatedDreams] = useState<DreamSearchResult[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { data: categories = [] } = useQuery({
    queryKey: ['search-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description, icon, created_at')
        .order('name');
      if (error) throw error;
      return (data || []) as Category[];
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  });
  const { data: maxStats = { maxViews: 1000, maxLikes: 500 } } = useQuery({
    queryKey: ['search-max-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dreams')
        .select('view_count, like_count')
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(1);
      if (error) throw error;
      if (!data || data.length === 0) return { maxViews: 1000, maxLikes: 500 };
      const first = data[0];
      if (!first) return { maxViews: 1000, maxLikes: 500 };
      return {
        maxViews: Math.ceil((first.view_count || 1000) / 100) * 100,
        maxLikes: Math.ceil((first.like_count || 500) / 50) * 50,
      };
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [infiniteScroll, setInfiniteScroll] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Advanced filters state (DEFAULT_FILTERS'i mutasyondan korumak için klonla başlat)
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>(() => ({ ...DEFAULT_FILTERS }));

  // Scroll listener for scroll-to-top button (throttled with requestAnimationFrame)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          setShowScrollTop(window.scrollY > 400);
          ticking = false;
        });
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Query veya filtre değişince sayfa 1'e dön. Sayfa değişimi aynı commit'teki
  // fetch effect'ine yansımadığı için ref ile bir sonraki fetch atlanır —
  // böylece eski sayfa için gereksiz (hatta append'li) istek atılmaz.
  const pendingPageResetRef = useRef(false);
  useEffect(() => {
    setCurrentPage((prev) => {
      if (prev !== 1) pendingPageResetRef.current = true;
      return 1;
    });
  }, [query, advancedFilters]);

  const fetchSearchPage = useCallback(async (searchTerm: string, page: number, append = false) => {
    if (append) {
      setLoadMoreLoading(true);
    } else {
      setIsLoading(true);
    }
    try {
      const { rows: newResults, total: nextTotalCount } = await searchDreamsPage(searchTerm, page, advancedFilters);

      if (append) {
        setResults(prev => [...prev, ...newResults]);
      } else {
        setResults(newResults);
      }
      setTotalCount(nextTotalCount);

      if (page === 1) {
        addRecentSearch(searchTerm);
      }
    } catch (error) {
      captureError(error, { tags: { feature: 'search', action: append ? 'load-more' : 'fetch-page' }, extra: { searchTerm, page } });
      if (!append) {
        setResults([]);
        setTotalCount(0);
      }
    } finally {
      setIsLoading(false);
      setLoadMoreLoading(false);
    }
  }, [addRecentSearch, advancedFilters]);

  const fetchRelatedDreams = useCallback(async (_searchTerm: string) => {
    try {
      const { data } = await supabase
        .from('dreams')
        .select('id, title, slug, content, category_id, view_count, like_count')
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(6);

      if (data) {
        setRelatedDreams(data.map(d => ({ ...d, rank: 0 })) as DreamSearchResult[]);
      }
    } catch (error) {
      captureError(error, { tags: { feature: 'search', action: 'fetch-related' }, extra: { searchTerm: _searchTerm } });
    }
  }, []);

  // Infinite scroll: observe load more element
  useEffect(() => {
    if (!infiniteScroll || !query || loadMoreLoading || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target?.isIntersecting) {
          const nextPage = currentPage + 1;
          const totalPages = Math.ceil(totalCount / RESULTS_PER_PAGE);
          if (nextPage <= totalPages) {
            setCurrentPage(nextPage);
          }
        }
      },
      { rootMargin: '200px', threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => observer.disconnect();
  }, [infiniteScroll, query, currentPage, totalCount, loadMoreLoading, isLoading]);

  // Sunucu tarafı arama: sorgu, sayfa veya filtre değişince
  useEffect(() => {
    if (!query) {
      setResults([]);
      setRelatedDreams([]);
      setTotalCount(0);
      return;
    }
    // Sayfa 1'e sıfırlama bekliyorsa bu commit'i atla; sayfa 1 render'ı fetch edecek
    if (pendingPageResetRef.current) {
      pendingPageResetRef.current = false;
      return;
    }
    const append = infiniteScroll && currentPage > 1;
    fetchSearchPage(query, currentPage, append);
    if (currentPage === 1) {
      fetchRelatedDreams(query);
    }
  }, [query, currentPage, fetchSearchPage, fetchRelatedDreams, infiniteScroll]);

  // Filtreler ve sıralama artık server tarafında (search_dreams RPC) uygulanır;
  // totalCount filtrelenmiş toplamı döndüğü için sayfalama tutarlıdır.
  const totalPages = Math.ceil(totalCount / RESULTS_PER_PAGE);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('q', searchQuery.trim());
      setSearchParams(newParams);
    }
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (advancedFilters.showFeaturedOnly) count++;
    if (advancedFilters.selectedCategories.length > 0) count += advancedFilters.selectedCategories.length;
    if (advancedFilters.minViews > 0) count++;
    if (advancedFilters.minLikes > 0) count++;
    if (advancedFilters.sortBy !== 'relevance') count++;
    return count;
  }, [advancedFilters]);

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <Layout>
      <Seo
        title={query ? `"${query}" için arama` : 'Rüya Ara'}
        description="Binlerce rüya tabiri arasında arama yapın. Gelişmiş filtrelerle rüyalarınızın anlamını keşfedin."
        path="/ara"
      />
      <div className="container py-7 md:py-12 relative">
        {/* Search Header */}
        <SearchHeader
          query={query}
          categories={categories}
          searchInputRef={searchInputRef}
          onSearch={handleSearch}
          recentSearches={recentSearches}
          onClearRecentSearches={clearRecentSearches}
          onRemoveRecentSearch={removeRecentSearch}
        />

        {/* Results Section */}
        {query && (
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-72 shrink-0">
              <AdvancedFilters
                filters={advancedFilters}
                onChange={setAdvancedFilters}
                categories={categories}
                maxViews={maxStats.maxViews}
                maxLikes={maxStats.maxLikes}
              />
            </aside>

            {/* Results */}
            <div className="flex-1 min-w-0">
              {/* Results Header */}
              <SearchResultsHeader
                isLoading={isLoading}
                query={query}
                totalCount={totalCount}
                hasActiveFilters={hasActiveFilters}
                activeFilterCount={activeFilterCount}
                infiniteScroll={infiniteScroll}
                onToggleInfiniteScroll={() => setInfiniteScroll(!infiniteScroll)}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />

              {/* Results */}
              <SearchResults
                results={results}
                viewMode={viewMode}
                isLoading={isLoading}
                query={query}
                currentPage={currentPage}
                totalPages={totalPages}
                infiniteScroll={infiniteScroll}
                loadMoreLoading={loadMoreLoading}
                loadMoreRef={loadMoreRef}
                relatedDreams={relatedDreams}
                categories={categories}
                activeFilterCount={activeFilterCount}
                onPageChange={setCurrentPage}
                onClearFilters={() => setAdvancedFilters(DEFAULT_FILTERS)}
                onPopularSearch={handleSearch}
              />
            </div>
          </div>
        )}

        {/* Empty State - No Query */}
        {!query && (
          <SearchLanding categoryCount={categories.length} />
        )}

        {/* Scroll to Top Button */}
        <AnimatePresence>
          {showScrollTop && (
            <motion.button
              onClick={scrollToTop}
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.9 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              className="fixed right-4 mobile-floating-action lg:bottom-6 lg:right-6 p-3 rounded-full dream-gradient text-white shadow-lg hover:shadow-xl active:scale-95 transition-all z-50"
              aria-label="Yukarı çık"
            >
              <ArrowUp className="h-5 w-5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
