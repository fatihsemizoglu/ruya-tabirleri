import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Eye, Heart, Search, SlidersHorizontal, ArrowUp, TrendingUp, Clock, Star, Grid3X3, List, Filter, X, Tag, Folder, icons } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { categoriesApi, dreamsApi, type Category, type Dream } from '@/lib/api';

type SortOption = 'popular' | 'newest' | 'oldest' | 'most-liked' | 'alphabetical';
type ViewMode = 'grid' | 'list';

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

  useEffect(() => {
    if (slug) {
      fetchCategoryAndDreams();
    }
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchCategoryAndDreams = async () => {
    setIsLoading(true);
    try {
      // Fetch category
      const categoryResponse = await categoriesApi.getBySlug(slug!);

      if (!categoryResponse.success || !categoryResponse.data) {
        setCategory(null);
        return;
      }

      const categoryData = categoryResponse.data;
      setCategory(categoryData);

      // Fetch dreams for this category
      const dreamsResponse = await categoriesApi.getDreams(slug!, 1, 1000);
      
      if (dreamsResponse.success && dreamsResponse.data) {
        setDreams(dreamsResponse.data);
      } else {
        setDreams([]);
      }
    } catch (error) {
      console.error('Error fetching category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get all unique keywords
  const allKeywords = useMemo(() => {
    const keywordSet = new Set<string>();
    dreams.forEach(dream => {
      if (Array.isArray(dream.keywords)) {
        dream.keywords.forEach(k => keywordSet.add(k));
      }
    });
    return Array.from(keywordSet).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [dreams]);

  // Filter and sort dreams
  const filteredAndSortedDreams = useMemo(() => {
    let result = [...dreams];

    // Featured filter
    if (showFeaturedOnly) {
      result = result.filter(dream => dream.is_featured);
    }

    // Keyword filter
    if (selectedKeywords.length > 0) {
      result = result.filter(dream =>
        selectedKeywords.some(keyword => dream.keywords?.includes(keyword))
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        dream =>
          dream.title.toLowerCase().includes(query) ||
          dream.content.toLowerCase().includes(query) ||
          dream.keywords?.some(k => k.toLowerCase().includes(query))
      );
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'most-liked':
        result.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
        break;
      case 'alphabetical':
        result.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
        break;
    }

    return result;
  }, [dreams, searchQuery, sortBy, showFeaturedOnly, selectedKeywords]);

  const activeFilterCount = (showFeaturedOnly ? 1 : 0) + selectedKeywords.length;

  const clearAllFilters = () => {
    setShowFeaturedOnly(false);
    setSelectedKeywords([]);
    setSearchQuery('');
    setDisplayCount(ITEMS_PER_PAGE);
  };

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords(prev =>
      prev.includes(keyword)
        ? prev.filter(k => k !== keyword)
        : [...prev, keyword]
    );
    setDisplayCount(ITEMS_PER_PAGE);
  };

  const displayedDreams = filteredAndSortedDreams.slice(0, displayCount);
  const hasMore = displayCount < filteredAndSortedDreams.length;

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setSearchParams({ sort: value });
    setDisplayCount(ITEMS_PER_PAGE);
  };

  const loadMore = () => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Stats
  const totalViews = dreams.reduce((sum, d) => sum + (d.view_count || 0), 0);
  const totalLikes = dreams.reduce((sum, d) => sum + (d.like_count || 0), 0);
  const featuredCount = dreams.filter(d => d.is_featured).length;

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-24 mb-4" />
            <div className="h-10 bg-muted rounded w-1/2 mb-4" />
            <div className="h-6 bg-muted rounded w-3/4 mb-8" />
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-muted rounded-xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-48 bg-muted rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!category) {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Grid3X3 className="h-10 w-10 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-serif font-bold mb-4">Kategori Bulunamadı</h1>
            <p className="text-muted-foreground mb-6">Aradığınız kategori mevcut değil veya kaldırılmış olabilir.</p>
            <Button asChild>
              <Link to="/kategoriler">Kategorilere Dön</Link>
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Back Button */}
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/kategoriler">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kategorilere Dön
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            {category.icon && (
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                {(() => {
                  const iconName = category.icon.charAt(0).toUpperCase() + category.icon.slice(1).replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
                  const IconComp = icons[iconName as keyof typeof icons];
                  return IconComp ? <IconComp className="w-8 h-8 text-primary" /> : <Folder className="w-8 h-8 text-primary" />;
                })()}
              </div>
            )}
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold">
                {category.name}
              </h1>
              <p className="text-muted-foreground">
                {dreams.length} rüya tabiri
              </p>
            </div>
          </div>
          {category.description && (
            <p className="text-lg text-muted-foreground max-w-3xl">
              {category.description}
            </p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500/10 to-blue-600/5">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Eye className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-muted-foreground">Görüntülenme</span>
              </div>
              <p className="text-2xl font-bold">{totalViews.toLocaleString('tr-TR')}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-gradient-to-br from-rose-500/10 to-rose-600/5">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Heart className="h-4 w-4 text-rose-600" />
                <span className="text-xs text-muted-foreground">Beğeni</span>
              </div>
              <p className="text-2xl font-bold">{totalLikes.toLocaleString('tr-TR')}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-gradient-to-br from-amber-500/10 to-amber-600/5">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Star className="h-4 w-4 text-amber-600" />
                <span className="text-xs text-muted-foreground">Öne Çıkan</span>
              </div>
              <p className="text-2xl font-bold">{featuredCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Bu kategoride ara..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setDisplayCount(ITEMS_PER_PAGE);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {/* Filter Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="relative">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrele
                    {activeFilterCount > 0 && (
                      <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Filtreler</h4>
                      {activeFilterCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                          Temizle
                        </Button>
                      )}
                    </div>
                    
                    {/* Featured Filter */}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="featured"
                        checked={showFeaturedOnly}
                        onCheckedChange={(checked) => {
                          setShowFeaturedOnly(checked as boolean);
                          setDisplayCount(ITEMS_PER_PAGE);
                        }}
                      />
                      <label htmlFor="featured" className="text-sm flex items-center gap-2 cursor-pointer">
                        <Star className="h-4 w-4 text-amber-500" />
                        Sadece Öne Çıkanlar
                      </label>
                    </div>

                    {/* Keywords Filter */}
                    {allKeywords.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Tag className="h-4 w-4" />
                          Anahtar Kelimeler
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-1">
                          {allKeywords.map(keyword => (
                            <div key={keyword} className="flex items-center space-x-2">
                              <Checkbox
                                id={`keyword-${keyword}`}
                                checked={selectedKeywords.includes(keyword)}
                                onCheckedChange={() => toggleKeyword(keyword)}
                              />
                              <label
                                htmlFor={`keyword-${keyword}`}
                                className="text-sm cursor-pointer"
                              >
                                {keyword}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Select value={sortBy} onValueChange={(value) => handleSortChange(value as SortOption)}>
                <SelectTrigger className="w-[180px]">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sırala" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      En Popüler
                    </div>
                  </SelectItem>
                  <SelectItem value="newest">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      En Yeni
                    </div>
                  </SelectItem>
                  <SelectItem value="oldest">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      En Eski
                    </div>
                  </SelectItem>
                  <SelectItem value="most-liked">
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      En Beğenilen
                    </div>
                  </SelectItem>
                  <SelectItem value="alphabetical">
                    <div className="flex items-center gap-2">
                      <List className="h-4 w-4" />
                      A-Z Sırala
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)} className="hidden md:block">
                <TabsList>
                  <TabsTrigger value="grid">
                    <Grid3X3 className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="list">
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          {/* Active Filters Display */}
          {(activeFilterCount > 0 || searchQuery) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Aktif filtreler:</span>
              {showFeaturedOnly && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Öne Çıkanlar
                  <button
                    onClick={() => setShowFeaturedOnly(false)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {selectedKeywords.map(keyword => (
                <Badge key={keyword} variant="secondary" className="flex items-center gap-1">
                  {keyword}
                  <button
                    onClick={() => toggleKeyword(keyword)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Arama: {searchQuery}
                  <button
                    onClick={() => setSearchQuery('')}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Tümünü Temizle
              </Button>
            </div>
          )}
        </div>

        {/* Results Info */}
        {searchQuery && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              "{searchQuery}" için <span className="font-medium">{filteredAndSortedDreams.length}</span> sonuç bulundu
            </p>
          </div>
        )}

        {/* Dreams Grid/List */}
        {displayedDreams.length > 0 ? (
          <>
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "flex flex-col gap-4"
            }>
              {displayedDreams.map((dream, index) => (
                <Link
                  key={dream.id}
                  to={`/ruya/${dream.slug}`}
                  className={`group animate-fade-in ${
                    viewMode === 'grid' 
                      ? 'dream-card' 
                      : 'flex gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all'
                  }`}
                  style={{ animationDelay: `${(index % ITEMS_PER_PAGE) * 30}ms` }}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-serif font-semibold group-hover:text-primary transition-colors line-clamp-2">
                          {dream.title}
                        </h3>
                        {dream.is_featured && (
                          <Badge variant="secondary" className="ml-2 shrink-0">
                            <Star className="h-3 w-3 mr-1" />
                            Öne Çıkan
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {dream.content}
                      </p>
                      {Array.isArray(dream.keywords) && dream.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {dream.keywords.slice(0, 3).map((keyword, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-auto">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{(dream.view_count || 0).toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          <span>{(dream.like_count || 0).toLocaleString('tr-TR')}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-serif font-semibold group-hover:text-primary transition-colors">
                            {dream.title}
                          </h3>
                          {dream.is_featured && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Öne Çıkan
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {dream.content}
                        </p>
                        {Array.isArray(dream.keywords) && dream.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {dream.keywords.slice(0, 4).map((keyword, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end justify-center gap-1 text-sm text-muted-foreground shrink-0">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{(dream.view_count || 0).toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          <span>{(dream.like_count || 0).toLocaleString('tr-TR')}</span>
                        </div>
                      </div>
                    </>
                  )}
                </Link>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-8">
                <Button variant="outline" size="lg" onClick={loadMore}>
                  Daha Fazla Göster ({filteredAndSortedDreams.length - displayCount} kaldı)
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            {searchQuery ? (
              <>
                <h3 className="text-lg font-medium mb-2">Sonuç Bulunamadı</h3>
                <p className="text-muted-foreground mb-4">
                  "{searchQuery}" için bu kategoride sonuç bulunamadı.
                </p>
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Aramayı Temizle
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">Bu kategoride henüz rüya tabiri yok.</p>
            )}
          </div>
        )}

        {/* Scroll to Top */}
        {showScrollTop && (
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-6 right-6 rounded-full shadow-lg z-50 animate-fade-in"
            onClick={scrollToTop}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Layout>
  );
}
