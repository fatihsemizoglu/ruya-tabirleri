import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, Sparkles, Layers, TrendingUp, Grid3X3, List, Eye, Heart, X, SlidersHorizontal, ChevronDown, Star, BookOpen, ArrowUp } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { PremiumBackground, PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { supabase } from '@/integrations/supabase/client';
import { SearchAutocomplete } from '@/components/search/SearchAutocomplete';
import { AdvancedFilters, type AdvancedFilterState } from '@/components/search/AdvancedFilters';
import type { DreamSearchResult, Category } from '@/types/database';

type ViewMode = 'grid' | 'list';

const popularSearches = [
  'yılan', 'su', 'ölüm', 'uçmak', 'düşmek', 'altın', 'köpek', 'at',
  'bebek', 'ev', 'araba', 'para', 'diş', 'saç', 'kan'
];

const RECENT_SEARCHES_KEY = 'dream_recent_searches';
const MAX_RECENT_SEARCHES = 10;

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<DreamSearchResult[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [relatedDreams, setRelatedDreams] = useState<DreamSearchResult[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [maxStats, setMaxStats] = useState({ maxViews: 1000, maxLikes: 500 });
  const [currentPage, setCurrentPage] = useState(1);
  const RESULTS_PER_PAGE = 24;
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Advanced filters state
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>({
    showFeaturedOnly: false,
    selectedCategories: [],
    minViews: 0,
    minLikes: 0,
    sortBy: 'relevance'
  });

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Scroll listener for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch categories and max stats
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (data) setCategories(data as Category[]);
    };

    const fetchMaxStats = async () => {
      const { data } = await supabase
        .from('dreams')
        .select('view_count, like_count')
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        setMaxStats({
          maxViews: Math.ceil((data[0].view_count || 1000) / 100) * 100,
          maxLikes: Math.ceil((data[0].like_count || 500) / 50) * 50
        });
      }
    };

    fetchCategories();
    fetchMaxStats();
  }, []);

  // Perform search when query changes
  useEffect(() => {
    if (query) {
      performSearch(query);
      fetchRelatedDreams(query);
    } else {
      setResults([]);
      setRelatedDreams([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Apply filters and sorting
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // Featured filter
    if (advancedFilters.showFeaturedOnly) {
      // Note: search_dreams doesn't return is_featured, so we'd need to fetch separately
      // For now, we'll filter client-side if we have the data
    }

    // Category filter
    if (advancedFilters.selectedCategories.length > 0) {
      filtered = filtered.filter(dream => 
        dream.category_id && advancedFilters.selectedCategories.includes(dream.category_id)
      );
    }

    // Popularity filters
    if (advancedFilters.minViews > 0) {
      filtered = filtered.filter(dream => (dream.view_count || 0) >= advancedFilters.minViews);
    }
    if (advancedFilters.minLikes > 0) {
      filtered = filtered.filter(dream => (dream.like_count || 0) >= advancedFilters.minLikes);
    }

    // Sort results
    switch (advancedFilters.sortBy) {
      case 'views':
        filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case 'likes':
        filtered.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
        break;
      case 'newest':
        // Keep original order for newest as the RPC doesn't return created_at
        break;
      case 'relevance':
      default:
        filtered.sort((a, b) => (b.rank || 0) - (a.rank || 0));
        break;
    }

    return filtered;
  }, [results, advancedFilters]);

  // Pagination
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * RESULTS_PER_PAGE;
    return filteredResults.slice(start, start + RESULTS_PER_PAGE);
  }, [filteredResults, currentPage]);

  const totalPages = Math.ceil(filteredResults.length / RESULTS_PER_PAGE);

  // Query değişince sayfa 1'e dön
  useEffect(() => {
    setCurrentPage(1);
  }, [query, advancedFilters]);

  const performSearch = async (searchTerm: string) => {
    setIsLoading(true);
    try {
      // Büyük limit (8610+ rüyayı kapsayacak şekilde)
      const { data, error } = await supabase.rpc('search_dreams', {
        search_query: searchTerm,
        limit_count: 10000
      });

      if (error) throw error;
      setResults((data as DreamSearchResult[]) || []);
      setCurrentPage(1);

      // Save to recent searches
      saveRecentSearch(searchTerm);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelatedDreams = async (searchTerm: string) => {
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
      console.error('Related dreams error:', error);
    }
  };

  const saveRecentSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const removeRecentSearch = (term: string) => {
    const updated = recentSearches.filter(s => s !== term);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

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

  const handlePopularSearch = (term: string) => {
    handleSearch(term);
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || '';
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

  return (
    <Layout>
      <div className="container py-8 md:py-12 relative">
        {/* Search Header */}
        <div className="max-w-3xl mx-auto mb-10">
          <div className="text-center mb-8">
            <div className="mb-4">
              <PremiumBadge>
                <Sparkles className="h-3.5 w-3.5" />
                Gelişmiş Arama
              </PremiumBadge>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.025em] mb-3 text-foreground">
              Rüya <GradientText>Ara</GradientText>
            </h1>
            <p className="text-muted-foreground">
              Binlerce rüya tabiri arasında arayın
            </p>
          </div>
          
          {/* Search Form with Autocomplete */}
          <SearchAutocomplete
            ref={searchInputRef}
            initialQuery={query}
            onSearch={handleSearch}
            recentSearches={recentSearches}
            onClearRecentSearches={clearRecentSearches}
            onRemoveRecentSearch={removeRecentSearch}
          />

          {/* Quick Category Filters */}
          {!query && categories.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                <Layers className="h-4 w-4" />
                <span>Kategorilere Göre Ara</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.slice(0, 8).map((category) => (
                  <Link
                    key={category.id}
                    to={`/kategori/${category.slug}`}
                    className="px-4 py-2 text-sm rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground transition-colors flex items-center gap-2"
                  >
                    <span>{category.icon}</span>
                    <span>{category.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches */}
          {!query && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                <span>Popüler Aramalar</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => handlePopularSearch(term)}
                    className="px-3 py-1.5 text-sm rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {query && (
          <div className="flex flex-col lg:flex-row gap-8">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-muted-foreground">
                    {isLoading ? (
                      'Aranıyor...'
                    ) : (
                      <>
                        <span className="font-medium text-foreground">"{query}"</span> için{' '}
                        <span className="font-medium text-foreground">{filteredResults.length}</span> sonuç
                        {activeFilterCount > 0 && (
                          <span className="text-primary"> ({activeFilterCount} filtre aktif)</span>
                        )}
                      </>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="hidden sm:flex border rounded-lg overflow-hidden">
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="rounded-none h-9 w-9"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="rounded-none h-9 w-9"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Results */}
              {isLoading ? (
                <div className={viewMode === 'grid'
                  ? "grid grid-cols-1 md:grid-cols-2 gap-6"
                  : "space-y-4"
                }>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="dream-card">
                      <Skeleton className="h-4 w-20 rounded-full mb-4" />
                      <Skeleton className="h-6 w-3/4 mb-3" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredResults.length > 0 ? (
                <>
                  {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {paginatedResults.map((dream, index) => (
                        <Link
                          key={dream.id}
                          to={`/ruya/${dream.slug}`}
                          className="group dream-card render-optimize"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            {dream.category_id && (
                              <Badge variant="secondary">
                                {getCategoryName(dream.category_id)}
                              </Badge>
                            )}
                            {index < 3 && (
                              <Badge className="dream-gradient text-white">
                                Top {index + 1}
                              </Badge>
                            )}
                          </div>
                          <h3 className="text-xl font-serif font-semibold mb-3 group-hover:text-primary transition-colors">
                            {dream.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                            {dream.content}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{(dream.view_count || 0).toLocaleString('tr-TR')}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              <span>{(dream.like_count || 0).toLocaleString('tr-TR')}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {paginatedResults.map((dream, index) => (
                        <Link
                          key={dream.id}
                          to={`/ruya/${dream.slug}`}
                          className="group block dream-card render-optimize"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                {index < 3 && (
                                  <Badge className="dream-gradient text-white">
                                    #{index + 1}
                                  </Badge>
                                )}
                                {dream.category_id && (
                                  <Badge variant="secondary">
                                    {getCategoryName(dream.category_id)}
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-lg font-serif font-semibold mb-2 group-hover:text-primary transition-colors">
                                {dream.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {dream.content}
                              </p>
                            </div>
                            <div className="flex sm:flex-col items-center gap-4 sm:gap-2 text-sm text-muted-foreground sm:text-right">
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{(dream.view_count || 0).toLocaleString('tr-TR')}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="h-4 w-4" />
                                <span>{(dream.like_count || 0).toLocaleString('tr-TR')}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-10 flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => {
                          setCurrentPage(p => Math.max(1, p - 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="rounded-lg"
                      >
                        Önceki
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                          let page = i + 1;
                          if (totalPages > 7) {
                            if (currentPage > 4) page = currentPage - 3 + i;
                            if (currentPage > totalPages - 4) page = totalPages - 6 + i;
                          }
                          if (page < 1 || page > totalPages) return null;
                          return (
                            <Button
                              key={page}
                              variant={page === currentPage ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                setCurrentPage(page);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="rounded-lg min-w-9"
                            >
                              {page}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => {
                          setCurrentPage(p => Math.min(totalPages, p + 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="rounded-lg"
                      >
                        Sonraki
                      </Button>
                      <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
                        Sayfa {currentPage} / {totalPages}
                      </span>
                    </div>
                  )}

                  {/* Related Dreams Section */}
                  {relatedDreams.length > 0 && paginatedResults.length < 6 && currentPage === 1 && (
                    <div className="mt-12 pt-8 border-t">
                      <div className="flex items-center gap-2 mb-6">
                        <Star className="h-5 w-5 text-primary" />
                        <h2 className="text-xl font-serif font-semibold">Popüler Rüyalar</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {relatedDreams.filter(d => !filteredResults.some(r => r.id === d.id)).slice(0, 3).map((dream) => (
                          <Link
                            key={dream.id}
                            to={`/ruya/${dream.slug}`}
                            className="group p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <h4 className="font-medium mb-2 group-hover:text-primary transition-colors line-clamp-1">
                              {dream.title}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Eye className="h-3 w-3" />
                                {(dream.view_count || 0).toLocaleString('tr-TR')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {(dream.like_count || 0).toLocaleString('tr-TR')}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState
                  icon="search"
                  title="Sonuç bulunamadı"
                  description={`"${query}" için eşleşen rüya tabiri bulunamadı.${activeFilterCount > 0 ? ' Filtreleri temizlemeyi deneyin.' : ''}`}
                  action={activeFilterCount > 0 ? {
                    label: 'Filtreleri Temizle',
                    onClick: () => setAdvancedFilters({
                      showFeaturedOnly: false,
                      selectedCategories: [],
                      minViews: 0,
                      minLikes: 0,
                      sortBy: 'relevance'
                    })
                  } : undefined}
                >
                  <div className="max-w-md mx-auto">
                    <p className="text-sm text-muted-foreground mb-3">Bunları da deneyebilirsiniz:</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {popularSearches.slice(0, 6).map((term) => (
                        <button
                          key={term}
                          onClick={() => handlePopularSearch(term)}
                          className="px-3 py-1.5 text-sm rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </EmptyState>
              )}
            </div>
          </div>
        )}

        {/* Empty State - No Query */}
        {!query && (
          <div className="mt-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border">
                <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold text-primary">1000+</div>
                <div className="text-sm text-muted-foreground">Rüya Tabiri</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-accent/10 to-accent/5 border">
                <Layers className="h-8 w-8 mx-auto mb-2 text-accent-foreground" />
                <div className="text-2xl font-bold">{categories.length}</div>
                <div className="text-sm text-muted-foreground">Kategori</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-muted to-muted/50 border">
                <Eye className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-sm text-muted-foreground">Görüntüleme</div>
              </div>
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-muted to-muted/50 border">
                <Heart className="h-8 w-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">5K+</div>
                <div className="text-sm text-muted-foreground">Beğeni</div>
              </div>
            </div>

            {/* Browse by Letter */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-serif font-semibold mb-4">Alfabetik Arama</h2>
              <div className="flex flex-wrap justify-center gap-1">
                {'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('').map((letter) => (
                  <Link
                    key={letter}
                    to={`/az/${letter}`}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-colors font-medium"
                  >
                    {letter}
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/populer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <TrendingUp className="h-4 w-4" />
                Popüler Rüyalar
              </Link>
              <Link
                to="/kategoriler"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Layers className="h-4 w-4" />
                Tüm Kategoriler
              </Link>
            </div>
          </div>
        )}

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 p-3 rounded-full dream-gradient text-white shadow-lg hover:shadow-xl transition-all z-50"
            aria-label="Yukarı çık"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}
      </div>
    </Layout>
  );
}
