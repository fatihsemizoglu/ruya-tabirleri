import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, Search, Grid3X3, List, SlidersHorizontal, 
  TrendingUp, Clock, SortAsc, Eye, BookOpen, ArrowUp, Folder
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { PremiumBackground, PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { supabase } from '@/integrations/supabase/client';
import { captureError } from '@/lib/logger';
import type { Category } from '@/types/database';
import { Seo } from '@/components/Seo';

type SortOption = 'default' | 'alphabetical' | 'most-dreams' | 'newest';
type ViewMode = 'grid' | 'list';

interface CategoryWithStats extends Category {
  dream_count: number;
  total_views: number;
}

// Color palette for categories
const colorPalette = [
  { bg: 'from-rose-500/20 to-pink-500/20', accent: 'bg-rose-500', text: 'text-rose-600' },
  { bg: 'from-orange-500/20 to-amber-500/20', accent: 'bg-orange-500', text: 'text-orange-600' },
  { bg: 'from-amber-500/20 to-yellow-500/20', accent: 'bg-amber-500', text: 'text-amber-600' },
  { bg: 'from-emerald-500/20 to-teal-500/20', accent: 'bg-emerald-500', text: 'text-emerald-600' },
  { bg: 'from-cyan-500/20 to-sky-500/20', accent: 'bg-cyan-500', text: 'text-cyan-600' },
  { bg: 'from-blue-500/20 to-indigo-500/20', accent: 'bg-blue-500', text: 'text-blue-600' },
  { bg: 'from-violet-500/20 to-purple-500/20', accent: 'bg-violet-500', text: 'text-violet-600' },
  { bg: 'from-fuchsia-500/20 to-pink-500/20', accent: 'bg-fuchsia-500', text: 'text-fuchsia-600' },
];

const getColorForIndex = (index: number) => colorPalette[index % colorPalette.length] ?? colorPalette[0]!;

export default function Categories() {
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

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

  const fetchCategories = async () => {
    try {
      // Fetch categories first
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('order_index');

      if (categoriesError) throw categoriesError;
      if (!categoriesData || categoriesData.length === 0) {
        setCategories([]);
        return;
      }

      // Sadece gerekli kolonları çek - network payload'ı küçült
      // 8610+ rüya için pagination yerine aggregation yapıyoruz
      const allCategoryIds = categoriesData.map(c => c.id);
      const statsMap = new Map<string, { count: number; views: number }>();

      // Batch fetch: 1000'erli sayfalarla (Supabase max ~1000 rows per request)
      const PAGE_SIZE = 1000;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: dreamsData, error: dreamsError } = await supabase
          .from('dreams')
          .select('category_id, view_count')
          .eq('is_published', true)
          .in('category_id', allCategoryIds)
          .range(offset, offset + PAGE_SIZE - 1);

        if (dreamsError) throw dreamsError;

        if (!dreamsData || dreamsData.length === 0) {
          hasMore = false;
          break;
        }

        dreamsData.forEach(dream => {
          if (dream.category_id) {
            const existing = statsMap.get(dream.category_id) || { count: 0, views: 0 };
            statsMap.set(dream.category_id, {
              count: existing.count + 1,
              views: existing.views + (dream.view_count || 0)
            });
          }
        });

        offset += PAGE_SIZE;
        hasMore = dreamsData.length === PAGE_SIZE;
      }

      const categoriesWithStats: CategoryWithStats[] = categoriesData.map(cat => ({
        ...cat,
        order_index: cat.order_index ?? 0,
        dream_count: statsMap.get(cat.id)?.count || 0,
        total_views: statsMap.get(cat.id)?.views || 0
      }));

      setCategories(categoriesWithStats);
    } catch (error) {
      captureError(error, { tags: { feature: 'categories-page' } });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort categories
  const filteredCategories = useMemo(() => {
    let result = [...categories];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        cat =>
          cat.name.toLowerCase().includes(query) ||
          cat.description?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'alphabetical':
        result.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
        break;
      case 'most-dreams':
        result.sort((a, b) => b.dream_count - a.dream_count);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      default:
        result.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    }

    return result;
  }, [categories, searchQuery, sortBy]);

  // Stats
  const totalCategories = categories.length;
  const totalDreams = categories.reduce((sum, c) => sum + c.dream_count, 0);
  const totalViews = categories.reduce((sum, c) => sum + c.total_views, 0);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout>
      <Seo
        title="Rüya Tabirleri Kategorileri"
        description="A'dan Z'ye tüm rüya tabirleri kategorileri. İlgilendiğiniz kategoriye tıklayarak rüya tabirlerini keşfedin."
        path="/kategoriler"
      />
      <div className="container py-7 md:py-12 relative">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="mb-4">
            <PremiumBadge>
              <Folder className="h-3.5 w-3.5" />
              Tüm Kategoriler
            </PremiumBadge>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.025em] mb-4 text-foreground">
            Rüya <GradientText>Kategorileri</GradientText>
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Rüya tabirlerini kategorilere göre keşfedin ve aradığınız yorumu kolayca bulun.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-3 mb-6 xs:grid-cols-3 sm:gap-4 sm:mb-8">
          <Card className="border-none shadow-sm bg-gradient-to-br from-violet-500/10 to-purple-600/5">
            <CardContent className="p-3 text-center sm:p-4">
              <div className="flex items-center justify-center gap-1.5 mb-1 sm:gap-2">
                <Grid3X3 className="h-4 w-4 text-violet-600" />
                <span className="text-xs text-muted-foreground">Kategori</span>
              </div>
              <p className="text-xl font-bold sm:text-2xl">{totalCategories}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500/10 to-indigo-600/5">
            <CardContent className="p-3 text-center sm:p-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <BookOpen className="h-4 w-4 text-blue-600" />
                <span className="text-xs text-muted-foreground">Rüya Tabiri</span>
              </div>
              <p className="text-xl font-bold sm:text-2xl">{totalDreams.toLocaleString('tr-TR')}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500/10 to-teal-600/5">
            <CardContent className="p-3 text-center sm:p-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Eye className="h-4 w-4 text-emerald-600" />
                <span className="text-xs text-muted-foreground">Görüntülenme</span>
              </div>
              <p className="text-xl font-bold sm:text-2xl">{totalViews.toLocaleString('tr-TR')}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col gap-3 mb-8 sm:flex-row sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kategori ara..."
              aria-label="Kategori ara"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 xs:grid-cols-[1fr_auto] sm:flex">
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Varsayılan
                  </div>
                </SelectItem>
                <SelectItem value="alphabetical">
                  <div className="flex items-center gap-2">
                    <SortAsc className="h-4 w-4" />
                    A-Z Sırala
                  </div>
                </SelectItem>
                <SelectItem value="most-dreams">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    En Çok Rüya
                  </div>
                </SelectItem>
                <SelectItem value="newest">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    En Yeni
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

        {/* Search Results Info */}
        {searchQuery && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              "{searchQuery}" için <span className="font-medium">{filteredCategories.length}</span> kategori bulundu
            </p>
          </div>
        )}

        {/* Categories Grid/List */}
        {isLoading ? (
          <div className={viewMode === 'grid'
            ? "grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6"
            : "flex flex-col gap-4"
          }>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              viewMode === 'grid' ? (
                <div key={i} className="bg-card border border-border/40 rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-sm">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500/30 via-fuchsia-500/30 to-pink-500/30" />
                  <Skeleton className="h-14 w-14 rounded-xl mb-4" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ) : (
                <div key={i} className="flex items-center gap-4 p-4 bg-card border border-border/40 rounded-xl">
                  <Skeleton className="h-12 w-12 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                  <Skeleton className="h-4 w-4" />
                </div>
              )
            ))}
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6" 
            : "flex flex-col gap-4"
          }>
            {filteredCategories.map((category, index) => {
              const colors = getColorForIndex(index) ?? colorPalette[0];

              return viewMode === 'grid' ? (
                <Link
                  key={category.id}
                  to={`/kategori/${category.slug}`}
                  className="group relative overflow-hidden rounded-2xl p-4 sm:p-6 bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  <div className="relative">
                    {/* Icon */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-muted flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300">
                      <CategoryIcon icon={category.icon} className="h-7 w-7 text-foreground" />
                    </div>

                    {/* Name */}
                    <h3 className="font-serif font-semibold text-base sm:text-lg mb-1 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>

                    {/* Description */}
                    {category.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {category.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>{category.dream_count} rüya</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        <span>{category.total_views.toLocaleString('tr-TR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-5 w-5 text-primary" />
                  </div>
                </Link>
              ) : (
                <Link
                  key={category.id}
                  to={`/kategori/${category.slug}`}
                  className="group flex flex-col items-start gap-3 rounded-xl border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md sm:flex-row sm:items-center sm:gap-4 animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Icon */}
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <CategoryIcon icon={category.icon} className="h-6 w-6 text-foreground" />
                    </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-semibold text-lg group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {category.description}
                      </p>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex w-full flex-wrap items-center gap-3 text-sm text-muted-foreground sm:w-auto sm:shrink-0 sm:gap-4">
                    <Badge variant="secondary">
                      <BookOpen className="h-3 w-3 mr-1" />
                      {category.dream_count}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{category.total_views.toLocaleString('tr-TR')}</span>
                    </div>
                    <ArrowRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          searchQuery ? (
            <EmptyState
              icon="search"
              title="Sonuç bulunamadı"
              description={`"${searchQuery}" için kategori bulunamadı.`}
              action={{ label: 'Aramayı Temizle', onClick: () => setSearchQuery('') }}
            />
          ) : (
            <EmptyState
              icon="inbox"
              title="Henüz kategori eklenmemiş"
              description="Kategoriler çok yakında burada listelenecek."
            />
          )
        )}

        {/* Scroll to Top */}
        {showScrollTop && (
          <Button
            variant="outline"
            size="icon"
            aria-label="Yukarı çık"
            className="fixed right-4 mobile-floating-action lg:bottom-6 lg:right-6 rounded-full shadow-lg z-50 animate-fade-in"
            onClick={scrollToTop}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Layout>
  );
}
