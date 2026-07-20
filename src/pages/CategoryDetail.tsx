import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Eye, Heart, Search, SlidersHorizontal, ChevronUp, TrendingUp, Clock,
  Star, Grid3X3, List, Filter, Tag, Folder, ArrowLeft, Sparkles, BookOpen, ArrowUpRight, X, Zap
} from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { captureError } from '@/lib/logger';
import type { Category, Dream } from '@/types/database';
import { Seo } from '@/components/Seo';

type SortOption = 'popular' | 'newest' | 'oldest' | 'most-liked' | 'alphabetical';
type ViewMode = 'grid' | 'list';

const ITEMS_PER_PAGE = 12;

const gradientPalette = [
  'from-violet-500 to-fuchsia-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-rose-500',
  'from-pink-500 to-purple-500',
  'from-amber-500 to-orange-500',
  'from-indigo-500 to-violet-500',
  'from-rose-500 to-pink-500',
];

const pickGradient = (seed: string) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return gradientPalette[Math.abs(hash) % gradientPalette.length];
};

function AnimatedCounter({ value }: { value: number }) {
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

  return <span ref={ref}>{count.toLocaleString('tr-TR')}</span>;
}

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: [0.25, 0.25, 0, 1] as [number, number, number, number] },
  }),
};

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

  const totalViews = dreams.reduce((sum, d) => sum + d.view_count, 0);
  const totalLikes = dreams.reduce((sum, d) => sum + d.like_count, 0);
  const featuredCount = dreams.filter(d => d.is_featured).length;
  const featuredGradient = category ? pickGradient(category.id + category.slug) : gradientPalette[0];

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen">
          <div className="container py-12">
            <div className="space-y-8">
              <Skeleton className="h-4 w-32 rounded-full" />
              <div className="flex items-center gap-4">
                <Skeleton className="w-20 h-20 rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-10 w-1/2 rounded-xl" />
                  <Skeleton className="h-4 w-1/3 rounded-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-5">
                    <Skeleton className="h-10 w-10 rounded-xl mb-3" />
                    <Skeleton className="h-3 w-20 mb-2 rounded-full" />
                    <Skeleton className="h-7 w-16 rounded-lg" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-5">
                    <Skeleton className="h-1 w-full rounded-full mb-4" />
                    <div className="flex items-start justify-between mb-4">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-4/5 mb-3" />
                    <div className="space-y-2 mb-4">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-11/12" />
                      <Skeleton className="h-3 w-3/4" />
                    </div>
                    <div className="flex gap-1.5 mb-4">
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border/40">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!category) {
    return (
      <Layout>
        <Seo title="Kategori Bulunamadı" path="/kategoriler" noindex />
        <div className="min-h-screen">
          <div className="container py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto text-center"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center mx-auto mb-8">
                <Folder className="h-12 w-12 text-primary" />
              </div>
              <h1 className="text-3xl font-serif-dream font-bold mb-4">Kategori Bulunamadı</h1>
              <p className="text-muted-foreground mb-8">
                Aradığınız kategori mevcut değil veya kaldırılmış olabilir.
              </p>
              <Button asChild size="lg" className="rounded-xl dream-gradient">
                <Link to="/kategoriler">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kategorilere Dön
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo
        title={`${category.name} Rüya Tabirleri`}
        description={category.description || `${category.name} kategorisindeki rüya tabirleri ve yorumları.`}
        path={`/kategori/${category.slug}`}
      />
      <div className="min-h-screen">
        {/* Hero Header */}
        <section className="relative overflow-hidden pb-6">
          <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${featuredGradient}`} />
          <div className={`absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${featuredGradient}`} />

          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />

          <div className="container relative py-8 md:py-12">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Button variant="ghost" size="sm" asChild className="mb-6 rounded-xl">
                <Link to="/kategoriler">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Tüm Kategoriler
                </Link>
              </Button>
            </motion.div>

            <div className="grid lg:grid-cols-[auto_1fr] gap-8 items-start">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className={`w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-gradient-to-br ${featuredGradient} flex items-center justify-center shadow-2xl shadow-primary/20`}
              >
                <CategoryIcon icon={category.icon} className="text-5xl md:text-6xl" />
              </motion.div>

              <div className="flex-1">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="mb-4"
                >
                  <PremiumBadge>
                    <Sparkles className="h-3.5 w-3.5" />
                    {category.name} Rüya Tabirleri
                  </PremiumBadge>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="text-4xl md:text-5xl lg:text-6xl font-serif-dream font-bold leading-tight mb-4"
                >
                  <span className={`bg-gradient-to-br ${featuredGradient} bg-clip-text text-transparent`}>
                    {category.name}
                  </span>
                  {' '}<GradientText>Rüya Tabirleri</GradientText>
                </motion.h1>

                {category.description && (
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-lg text-muted-foreground max-w-2xl leading-relaxed"
                  >
                    {category.description}
                  </motion.p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="container pb-6">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08 } },
            }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            {[
              { icon: BookOpen, label: 'Rüya Tabiri', value: dreams.length, gradient: 'from-violet-500/10 to-violet-500/5', iconBg: 'from-violet-500/20 to-violet-500/5', color: 'text-violet-600 dark:text-violet-400', border: 'hover:border-violet-500/30' },
              { icon: Eye, label: 'Toplam Görüntülenme', value: totalViews, gradient: 'from-blue-500/10 to-blue-500/5', iconBg: 'from-blue-500/20 to-blue-500/5', color: 'text-blue-600 dark:text-blue-400', border: 'hover:border-blue-500/30' },
              { icon: Heart, label: 'Toplam Beğeni', value: totalLikes, gradient: 'from-rose-500/10 to-rose-500/5', iconBg: 'from-rose-500/20 to-rose-500/5', color: 'text-rose-600 dark:text-rose-400', border: 'hover:border-rose-500/30' },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 },
                  }}
                  className={`bg-gradient-to-br ${stat.gradient} border border-border/50 rounded-2xl p-5 ${stat.border} hover:shadow-lg transition-all duration-300 group`}
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${stat.iconBg} mb-3 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 font-medium">
                    {stat.label}
                  </p>
                  <p className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    <AnimatedCounter value={stat.value} />
                  </p>
                </motion.div>
              );
            })}
          </motion.div>

          {featuredCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md hover:border-amber-500/30 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Star className="w-5 h-5 text-amber-600 fill-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {featuredCount} öne çıkan rüya tabiri
                </p>
                <p className="text-xs text-muted-foreground">
                  Editör tarafından seçilen en iyi içerikler
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
            </motion.div>
          )}
        </section>

        {/* Sticky Filter Bar */}
        <section className="sticky top-16 z-40 bg-background/70 backdrop-blur-xl border-y border-border/40 -mx-4 px-4 mb-8 shadow-lg shadow-black/5">
          <div className="container py-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Bu kategoride ara..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setDisplayCount(ITEMS_PER_PAGE);
                  }}
                  className="pl-11 h-11 rounded-xl border-border/50 bg-muted/30 focus-visible:bg-background focus-visible:border-primary/30 transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-11 rounded-xl relative border-border/50 bg-muted/30">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtrele
                      {activeFilterCount > 0 && (
                        <Badge className="ml-2 h-5 min-w-5 px-1.5 flex items-center justify-center text-xs rounded-full">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 rounded-xl" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Filtreler</h4>
                        {activeFilterCount > 0 && (
                          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="rounded-lg">
                            Temizle
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <Checkbox
                          id="featured"
                          checked={showFeaturedOnly}
                          onCheckedChange={(checked) => {
                            setShowFeaturedOnly(checked as boolean);
                            setDisplayCount(ITEMS_PER_PAGE);
                          }}
                        />
                        <label htmlFor="featured" className="text-sm flex items-center gap-2 cursor-pointer flex-1">
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                          Sadece Öne Çıkanlar
                        </label>
                      </div>

                      {allKeywords.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium px-2">
                            <Tag className="h-4 w-4" />
                            Anahtar Kelimeler
                          </div>
                          <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                            {allKeywords.map(keyword => (
                              <div key={keyword} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                <Checkbox
                                  id={`keyword-${keyword}`}
                                  checked={selectedKeywords.includes(keyword)}
                                  onCheckedChange={() => toggleKeyword(keyword)}
                                />
                                <label htmlFor={`keyword-${keyword}`} className="text-sm cursor-pointer flex-1">
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
                  <SelectTrigger className="h-11 rounded-xl w-[180px] border-border/50 bg-muted/30">
                    <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Sırala" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
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

            {(activeFilterCount > 0 || searchQuery) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/40"
              >
                <span className="text-xs text-muted-foreground font-medium">Aktif:</span>
                {showFeaturedOnly && (
                  <Badge variant="secondary" className="rounded-full gap-1 pr-1">
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
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
                  <Badge key={keyword} variant="secondary" className="rounded-full gap-1 pr-1">
                    {keyword}
                    <button onClick={() => toggleKeyword(keyword)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {searchQuery && (
                  <Badge variant="secondary" className="rounded-full gap-1 pr-1">
                    "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="rounded-lg text-xs h-7 text-muted-foreground hover:text-foreground">
                  Tümünü Temizle
                </Button>
              </motion.div>
            )}
          </div>
        </section>

        {/* Results */}
        <section className="container pb-16">
          {searchQuery && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground mb-6"
            >
              "<span className="font-medium text-foreground">{searchQuery}</span>" için{' '}
              <span className="font-semibold text-foreground">{filteredAndSortedDreams.length}</span> sonuç bulundu
            </motion.p>
          )}

          {displayedDreams.length > 0 ? (
            <>
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.04 } },
                }}
                className={viewMode === 'grid'
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
                  : "flex flex-col gap-3"
                }
              >
                {displayedDreams.map((dream, index) => (
                  <DreamCard
                    key={dream.id}
                    dream={dream}
                    viewMode={viewMode}
                    gradient={pickGradient(dream.id) ?? ''}
                    index={index}
                  />
                ))}
              </motion.div>

              {hasMore && (
                <div className="flex justify-center mt-12">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={loadMore}
                    className="rounded-xl px-8 h-12 border-border hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-all"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Daha Fazla Göster
                    <span className="ml-2 text-muted-foreground text-sm">
                      ({filteredAndSortedDreams.length - displayCount} kaldı)
                    </span>
                  </Button>
                </div>
              )}
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center mx-auto mb-6">
                <Search className="h-12 w-12 text-primary" />
              </div>
              {searchQuery ? (
                <>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Sonuç Bulunamadı</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    "{searchQuery}" için bu kategoride sonuç bulunamadı.
                  </p>
                  <Button variant="outline" onClick={() => setSearchQuery('')} className="rounded-xl">
                    Aramayı Temizle
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-semibold mb-2 text-foreground">Henüz Rüya Yok</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Bu kategoride henüz rüya tabiri bulunmuyor. Kısa süre içinde eklenecektir.
                  </p>
                </>
              )}
            </motion.div>
          )}
        </section>

        {/* Scroll to Top */}
        {showScrollTop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
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

function DreamCard({
  dream,
  viewMode,
  gradient,
  index,
}: {
  dream: Dream;
  viewMode: ViewMode;
  gradient: string;
  index: number;
}) {
  if (viewMode === 'list') {
    return (
      <motion.div variants={cardVariants} custom={index}>
        <Link
          to={`/ruya/${dream.slug}`}
          className="group flex items-center gap-4 bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-4 hover:border-primary/30 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
        >
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {dream.is_featured && (
                <Badge variant="secondary" className="rounded-full text-xs gap-1">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  Öne Çıkan
                </Badge>
              )}
              {dream.keywords && dream.keywords.length > 0 && (
                <Badge variant="outline" className="rounded-full text-xs">
                  {dream.keywords[0]}
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

          <div className="flex items-center gap-3 shrink-0 text-sm text-muted-foreground">
            <div className="hidden sm:flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span className="font-semibold text-xs">{dream.view_count.toLocaleString('tr-TR')}</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Heart className="h-3.5 w-3.5" />
              <span className="font-semibold text-xs">{dream.like_count.toLocaleString('tr-TR')}</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div variants={cardVariants} custom={index}>
      <Link
        to={`/ruya/${dream.slug}`}
        className="group relative block bg-card/60 backdrop-blur-sm border border-border/50 rounded-2xl p-6 overflow-hidden hover:border-primary/30 hover:bg-card/80 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1.5 transition-all duration-500 h-full flex flex-col"
      >
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />
        <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.08] blur-2xl transition-opacity pointer-events-none`} />

        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />

        <div className="relative flex flex-col h-full">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shrink-0 group-hover:scale-110 transition-transform duration-300`}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {dream.is_featured && (
              <Badge variant="secondary" className="rounded-full text-xs gap-1 shrink-0">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                Öne Çıkan
              </Badge>
            )}
          </div>

          <h3 className="text-lg font-serif-dream font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
            {dream.title}
          </h3>

          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 leading-relaxed flex-1">
            {dream.content}
          </p>

          {dream.keywords && dream.keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {dream.keywords.slice(0, 3).map((keyword) => (
                <span
                  key={keyword}
                  className="text-xs px-2.5 py-1 rounded-full bg-muted/70 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                >
                  #{keyword}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/40 mt-auto">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-semibold">
                <Eye className="h-3.5 w-3.5" />
                {dream.view_count.toLocaleString('tr-TR')}
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <Heart className="h-3.5 w-3.5" />
                {dream.like_count.toLocaleString('tr-TR')}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:bg-primary/10">
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
