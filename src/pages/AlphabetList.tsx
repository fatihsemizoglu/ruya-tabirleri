import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, Heart, Star, ChevronUp, BookOpen, Search, Grid3X3, List, ArrowUpDown, X, ArrowUpRight, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { captureError } from '@/lib/logger';
import type { Dream, Category } from '@/types/database';

const alphabet = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');

const PAGE_SIZE = 25;
const MAX_FETCH = 500;

type SortOption = 'title' | 'views' | 'likes' | 'newest';
type ViewMode = 'grid' | 'list';

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

const getMeaningfulFirstLetter = (title: string): string => {
  const clean = title.startsWith('Rüyada ') ? title.slice(7) : title;
  return clean.charAt(0).toUpperCase();
};

export default function AlphabetList() {
  const { letter } = useParams<{ letter?: string }>();
  const navigate = useNavigate();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('title');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(false);

  const selectedLetter = letter?.toUpperCase() || 'A';

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('*');
      if (data) setCategories(data as Category[]);
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchDreams = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('dreams')
          .select('*')
          .eq('is_published', true)
          .ilike('title', `Rüyada ${selectedLetter}%`)
          .order('title')
          .limit(MAX_FETCH);

        if (error) throw error;
        setDreams((data as Dream[]) || []);
        setCurrentPage(1);
      } catch (error) {
        captureError(error, { tags: { feature: 'alphabet-list' } });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDreams();
    setSearchQuery('');
  }, [selectedLetter]);

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

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories.find(c => c.id === categoryId);
  };

  const filteredDreams = useMemo(() => {
    let result = [...dreams];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(dream =>
        dream.title.toLowerCase().includes(query) ||
        dream.content.toLowerCase().includes(query) ||
        dream.keywords?.some(k => k.toLowerCase().includes(query))
      );
    }

    if (showOnlyFeatured) {
      result = result.filter(dream => dream.is_featured);
    }

    switch (sortBy) {
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title, 'tr'));
        break;
      case 'views':
        result.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case 'likes':
        result.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return result;
  }, [dreams, searchQuery, sortBy, showOnlyFeatured]);

  const letterCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const d of dreams) {
      const first = getMeaningfulFirstLetter(d.title);
      counts[first] = (counts[first] || 0) + 1;
    }
    return counts;
  }, [dreams]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy, showOnlyFeatured]);

  const totalPages = Math.max(1, Math.ceil(filteredDreams.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const paginatedDreams = filteredDreams.slice(startIdx, startIdx + PAGE_SIZE);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLetterClick = (char: string) => {
    navigate(`/az/${char.toLowerCase()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [1];
    const start = Math.max(2, safePage - 1);
    const end = Math.min(totalPages - 1, safePage + 1);
    if (start > 2) pages.push('ellipsis');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('ellipsis');
    pages.push(totalPages);
    return pages;
  };
  const activeFilterCount = (showOnlyFeatured ? 1 : 0) + (searchQuery.trim() ? 1 : 0);

  return (
    <Layout>
      <div className="min-h-screen bg-mesh">
        {/* Hero Header */}
        <section className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="container relative pt-12 pb-8 md:pt-16 md:pb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6"
              >
                <BookOpen className="w-4 h-4" />
                Alfabetik Arama
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="text-4xl md:text-5xl lg:text-6xl font-serif-dream font-bold mb-4 leading-tight"
              >
                A'dan Z'ye{' '}
                <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                  Rüya Tabirleri
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-lg text-muted-foreground max-w-2xl mx-auto"
              >
                Tüm rüya tabirlerine alfabetik sırayla göz atın. Aradığınız rüyayı bulmak için bir harf seçin.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Sticky Alphabet Navigation */}
        <section className="sticky top-16 z-40 bg-background/80 backdrop-blur-xl border-y border-border/60 -mx-4 px-4">
          <div className="container py-3">
            <div className="flex flex-wrap justify-center gap-1.5 max-w-4xl mx-auto">
              {alphabet.map((char) => {
                const isActive = selectedLetter === char;

                return (
                  <button
                    key={char}
                    onClick={() => handleLetterClick(char)}
                    className={`
                      relative w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center
                      font-semibold text-sm transition-all duration-200
                      hover:scale-110 active:scale-95
                      ${isActive
                        ? 'bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30'
                        : 'bg-muted/50 hover:bg-muted text-foreground'
                      }
                    `}
                    title={char}
                  >
                    {char}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Current Letter Display */}
        <section className="container pt-12 pb-4">
          <motion.div
            key={selectedLetter}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center gap-6"
          >
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-border" />
            <div className="text-center px-6">
              <span className="text-7xl md:text-9xl font-serif-dream font-bold leading-none bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                {selectedLetter}
              </span>
              <p className="text-sm text-muted-foreground mt-3 flex items-center justify-center gap-2">
                <BookOpen className="h-4 w-4" />
                {isLoading ? 'Yükleniyor...' : `${dreams.length} rüya tabiri`}
              </p>
            </div>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border to-border" />
          </motion.div>
        </section>

        {/* Search & Filters */}
        {dreams.length > 0 && (
          <section className="container pb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder={`"${selectedLetter}" harfinde ara...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 h-11 rounded-xl border-border/60 bg-background/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={showOnlyFeatured ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowOnlyFeatured(!showOnlyFeatured)}
                  className={`h-11 rounded-xl ${showOnlyFeatured ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' : ''}`}
                >
                  <Star className={`h-4 w-4 mr-2 ${showOnlyFeatured ? 'fill-white' : 'text-amber-500'}`} />
                  Öne Çıkanlar
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-11 rounded-xl">
                      <ArrowUpDown className="h-4 w-4 mr-2" />
                      Sırala
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuLabel>Sıralama</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSortBy('title')} className="rounded-lg">
                      Alfabetik (A-Z)
                      {sortBy === 'title' && <span className="ml-auto text-primary">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('views')} className="rounded-lg">
                      <Eye className="h-4 w-4 mr-2" />
                      En Çok Görüntülenen
                      {sortBy === 'views' && <span className="ml-auto text-primary">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('likes')} className="rounded-lg">
                      <Heart className="h-4 w-4 mr-2" />
                      En Çok Beğenilen
                      {sortBy === 'likes' && <span className="ml-auto text-primary">✓</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('newest')} className="rounded-lg">
                      <Clock className="h-4 w-4 mr-2" />
                      En Yeni
                      {sortBy === 'newest' && <span className="ml-auto text-primary">✓</span>}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="hidden md:flex items-center bg-muted/50 rounded-xl p-1 h-11">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
                    }`}
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center gap-2 mt-4"
              >
                <span className="text-xs text-muted-foreground">Aktif filtreler:</span>
                {showOnlyFeatured && (
                  <Badge variant="secondary" className="rounded-full gap-1 pr-1">
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                    Öne Çıkanlar
                    <button onClick={() => setShowOnlyFeatured(false)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {searchQuery && (
                  <Badge variant="secondary" className="rounded-full gap-1 pr-1">
                    "{searchQuery}"
                    <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setShowOnlyFeatured(false);
                  }}
                  className="rounded-lg text-xs h-7"
                >
                  Tümünü Temizle
                </Button>
              </motion.div>
            )}

            {(searchQuery || showOnlyFeatured) && !isLoading && (
              <p className="mt-4 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{filteredDreams.length}</span> sonuç bulundu
                {searchQuery && <span> "{searchQuery}" için</span>}
                {showOnlyFeatured && <span> · öne çıkanlar</span>}
              </p>
            )}
          </section>
        )}

        {/* Dreams Grid/List */}
        <section className="container pb-12">
          {isLoading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3'}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="surface animate-pulse h-48 rounded-2xl" />
              ))}
            </div>
          ) : filteredDreams.length > 0 ? (
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
              {paginatedDreams.map((dream) => {
                const category = getCategoryName(dream.category_id);
                const gradient = pickGradient(dream.id);

                if (viewMode === 'list') {
                  return (
                    <motion.div
                      key={dream.id}
                      variants={{
                        hidden: { opacity: 0, y: 16 },
                        show: { opacity: 1, y: 0 },
                      }}
                    >
                      <Link
                        to={`/ruya/${dream.slug}`}
                        className="render-optimize group flex items-center gap-4 p-4 surface hover:shadow-lg transition-all duration-300"
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl font-serif-dream font-bold text-white shrink-0 shadow-md`}>
                          {getMeaningfulFirstLetter(dream.title)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {category && (
                              <Badge variant="secondary" className="rounded-full text-xs gap-1">
                                <CategoryIcon icon={category.icon} className="h-3.5 w-3.5" /> {category.name}
                              </Badge>
                            )}
                            {dream.is_featured && (
                              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            )}
                          </div>
                          <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                            {dream.title}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {(dream.view_count || 0).toLocaleString('tr-TR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5" />
                            {(dream.like_count || 0).toLocaleString('tr-TR')}
                          </span>
                          <ArrowUpRight className="h-4 w-4 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        </div>
                      </Link>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={dream.id}
                    variants={{
                      hidden: { opacity: 0, y: 16 },
                      show: { opacity: 1, y: 0 },
                    }}
                  >
                    <Link
                      to={`/ruya/${dream.slug}`}
                      className="group relative surface p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden block"
                    >
                      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${gradient}`} />
                      <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 blur-2xl transition-opacity`} />

                      <div className="relative">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-base font-serif-dream font-bold text-white shadow-md`}>
                            {getMeaningfulFirstLetter(dream.title)}
                          </div>
                          {dream.is_featured && (
                            <Badge variant="secondary" className="rounded-full text-xs gap-1">
                              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                              Öne Çıkan
                            </Badge>
                          )}
                        </div>

                        {category && (
                          <Badge variant="outline" className="rounded-full text-xs mb-2 gap-1">
                            <CategoryIcon icon={category.icon} className="h-3.5 w-3.5" /> {category.name}
                          </Badge>
                        )}

                        <h3 className="text-base font-serif-dream font-semibold group-hover:text-primary transition-colors line-clamp-2 mb-3">
                          {dream.title}
                        </h3>

                        {dream.keywords && dream.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {dream.keywords.slice(0, 3).map((keyword) => (
                              <Badge key={keyword} variant="outline" className="rounded-full text-xs font-normal">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/60">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3.5 w-3.5" />
                              {(dream.view_count || 0).toLocaleString('tr-TR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3.5 w-3.5" />
                              {(dream.like_count || 0).toLocaleString('tr-TR')}
                            </span>
                          </div>
                          <ArrowUpRight className="h-4 w-4 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : dreams.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center mx-auto mb-6">
                <Search className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-serif-dream font-bold mb-2">Sonuç bulunamadı</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Arama kriterlerinize uygun rüya tabiri bulunamadı.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setShowOnlyFeatured(false);
                }}
                className="rounded-xl"
              >
                Filtreleri Temizle
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center mx-auto mb-6`}>
                <span className="text-5xl font-serif-dream font-bold bg-gradient-to-br from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  {selectedLetter}
                </span>
              </div>
              <h3 className="text-2xl font-serif-dream font-bold mb-2">Henüz rüya tabiri yok</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                "{selectedLetter}" harfi ile başlayan rüya tabiri bulunamadı.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="text-sm text-muted-foreground self-center">Diğer harfler:</span>
                {alphabet.filter(c => (letterCounts[c] || 0) > 0).slice(0, 8).map(char => (
                  <Button
                    key={char}
                    variant="outline"
                    size="sm"
                    onClick={() => handleLetterClick(char)}
                    className="rounded-full w-9 h-9 p-0"
                  >
                    {char}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </section>

        {/* Pagination */}
        {filteredDreams.length > 0 && totalPages > 1 && (
          <nav
            className="container pb-6"
            aria-label="Sayfalama"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{filteredDreams.length}</span> sonuç
                {' · '}
                Sayfa <span className="font-semibold text-foreground">{safePage}</span> / {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={safePage === 1}
                  aria-label="Önceki sayfa"
                  className="h-9 w-9 rounded-lg"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {getPageNumbers().map((page, idx) =>
                  page === 'ellipsis' ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="h-9 w-9 flex items-center justify-center text-muted-foreground text-sm"
                      aria-hidden
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      aria-current={safePage === page ? 'page' : undefined}
                      aria-label={`Sayfa ${page}`}
                      className={`h-9 min-w-9 px-2 rounded-lg text-sm font-semibold transition-colors ${
                        safePage === page
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => { setCurrentPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={safePage === totalPages}
                  aria-label="Sonraki sayfa"
                  className="h-9 w-9 rounded-lg"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </nav>
        )}

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
              className="rounded-full shadow-2xl h-12 w-12 bg-gradient-to-br from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
            >
              <ChevronUp className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
