import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Eye, Heart, Star, ChevronUp, BookOpen, Search, Grid3X3, List, ArrowUpDown, TrendingUp, Sparkles, Filter } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
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
import { dreamsApi, categoriesApi, type Dream, type Category } from '@/lib/api';

const alphabet = 'ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');

type SortOption = 'title' | 'views' | 'likes' | 'newest';
type ViewMode = 'grid' | 'list';

export default function AlphabetList() {
  const { letter } = useParams<{ letter?: string }>();
  const navigate = useNavigate();
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [letterCounts, setLetterCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Filter & Sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('title');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showOnlyFeatured, setShowOnlyFeatured] = useState(false);
  
  const selectedLetter = letter?.toUpperCase() || 'A';

  // Fetch all dreams to get letter counts
  useEffect(() => {
    const fetchLetterCounts = async () => {
      const response = await dreamsApi.getAll({ limit: 10000 });
      
      if (response.success && response.data) {
        const counts: Record<string, number> = {};
        alphabet.forEach(char => counts[char] = 0);
        
        response.data.forEach(dream => {
          const firstLetter = dream.title.charAt(0).toUpperCase();
          if (counts[firstLetter] !== undefined) {
            counts[firstLetter]++;
          }
        });
        
        setLetterCounts(counts);
      }
    };

    fetchLetterCounts();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const response = await categoriesApi.getAll();
      if (response.success && response.data) setCategories(response.data);
    };
    fetchCategories();
  }, []);

  // Fetch dreams for selected letter
  useEffect(() => {
    const fetchDreams = async () => {
      setIsLoading(true);
      try {
        const response = await dreamsApi.getAll({
          search: selectedLetter,
          limit: 1000,
          sort_by: 'title',
          sort_order: 'asc'
        });

        if (!response.success) throw new Error(response.error);
        
        // Filter dreams that start with the selected letter
        const filteredDreams = (response.data || []).filter(dream => 
          dream.title.toUpperCase().startsWith(selectedLetter)
        );
        
        setDreams(filteredDreams);
      } catch (error) {
        console.error('Error fetching dreams:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDreams();
    setSearchQuery(''); // Reset search when letter changes
  }, [selectedLetter]);

  // Scroll to top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories.find(c => c.id === categoryId);
  };

  // Filter and sort dreams
  const filteredDreams = useMemo(() => {
    let result = [...dreams];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(dream => 
        dream.title.toLowerCase().includes(query) ||
        dream.content.toLowerCase().includes(query) ||
        dream.keywords?.some(k => k.toLowerCase().includes(query))
      );
    }

    // Filter featured only
    if (showOnlyFeatured) {
      result = result.filter(dream => dream.is_featured);
    }

    // Sort
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

  // Calculate stats
  const stats = useMemo(() => {
    const totalDreams = Object.values(letterCounts).reduce((a, b) => a + b, 0);
    const lettersWithDreams = Object.values(letterCounts).filter(c => c > 0).length;
    const mostPopularLetter = Object.entries(letterCounts).sort((a, b) => b[1] - a[1])[0];
    
    return {
      totalDreams,
      lettersWithDreams,
      mostPopularLetter: mostPopularLetter ? { letter: mostPopularLetter[0], count: mostPopularLetter[1] } : null,
      currentLetterCount: letterCounts[selectedLetter] || 0,
    };
  }, [letterCounts, selectedLetter]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLetterClick = (char: string) => {
    navigate(`/az/${char.toLowerCase()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-bold mb-4">
            A'dan Z'ye Rüya Tabirleri
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tüm rüya tabirlerine alfabetik sırayla göz atın. Aradığınız rüyayı bulmak için bir harf seçin.
          </p>
          
          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-6 mt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4 text-primary" />
              <span><strong className="text-foreground">{stats.totalDreams}</strong> toplam rüya tabiri</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span><strong className="text-foreground">{stats.lettersWithDreams}</strong> aktif harf</span>
            </div>
            {stats.mostPopularLetter && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>En popüler: <strong className="text-foreground">{stats.mostPopularLetter.letter}</strong> ({stats.mostPopularLetter.count})</span>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Alphabet Navigation */}
        <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm py-4 -mx-4 px-4 mb-8 border-b border-border/50">
          <div className="flex flex-wrap justify-center gap-1.5 max-w-4xl mx-auto">
            {alphabet.map((char) => {
              const count = letterCounts[char] || 0;
              const isActive = selectedLetter === char;
              const isEmpty = count === 0;
              
              return (
                <button
                  key={char}
                  onClick={() => handleLetterClick(char)}
                  disabled={isEmpty}
                  className={`
                    relative w-9 h-9 md:w-10 md:h-10 rounded-lg flex items-center justify-center 
                    font-medium text-sm md:text-base transition-all duration-200
                    ${isActive 
                      ? 'dream-gradient text-primary-foreground scale-110 shadow-lg' 
                      : isEmpty
                        ? 'bg-muted/50 text-muted-foreground/50 cursor-not-allowed'
                        : 'bg-muted hover:bg-primary/10 hover:scale-105'
                    }
                  `}
                  title={`${char} - ${count} rüya`}
                >
                  {char}
                  {count > 0 && !isActive && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary/20 rounded-full text-[10px] flex items-center justify-center text-primary">
                      {count > 9 ? '9+' : count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Current Letter Header */}
        <div className="flex items-center justify-center gap-6 mb-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-border" />
          <div className="text-center">
            <span className="text-6xl md:text-8xl font-serif font-bold text-gradient leading-none">
              {selectedLetter}
            </span>
            <p className="text-muted-foreground mt-2 flex items-center justify-center gap-2">
              <BookOpen className="h-4 w-4" />
              {isLoading ? 'Yükleniyor...' : `${dreams.length} rüya tabiri`}
            </p>
          </div>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-border" />
        </div>

        {/* Search & Filters */}
        {dreams.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search within letter */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`"${selectedLetter}" harfinde ara...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Featured Filter */}
              <Button
                variant={showOnlyFeatured ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowOnlyFeatured(!showOnlyFeatured)}
                className={showOnlyFeatured ? 'dream-gradient' : ''}
              >
                <Star className={`h-4 w-4 mr-2 ${showOnlyFeatured ? 'fill-current' : ''}`} />
                Öne Çıkanlar
              </Button>

              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Sırala
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Sıralama</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy('title')}>
                    Alfabetik (A-Z)
                    {sortBy === 'title' && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('views')}>
                    <Eye className="h-4 w-4 mr-2" />
                    En Çok Görüntülenen
                    {sortBy === 'views' && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('likes')}>
                    <Heart className="h-4 w-4 mr-2" />
                    En Çok Beğenilen
                    {sortBy === 'likes' && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('newest')}>
                    En Yeni
                    {sortBy === 'newest' && <span className="ml-auto">✓</span>}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* View Mode */}
              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Results info */}
        {(searchQuery || showOnlyFeatured) && !isLoading && (
          <div className="mb-6 text-sm text-muted-foreground">
            {filteredDreams.length} sonuç bulundu
            {searchQuery && <span> - "{searchQuery}" için</span>}
            {showOnlyFeatured && <span> - Öne çıkanlar</span>}
          </div>
        )}

        {/* Dreams Grid/List */}
        {isLoading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`dream-card animate-pulse ${viewMode === 'list' ? 'flex items-center gap-4' : ''}`}>
                <div className="h-4 bg-muted rounded w-20 mb-4" />
                <div className="h-6 bg-muted rounded w-3/4 mb-3" />
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-5/6" />
              </div>
            ))}
          </div>
        ) : filteredDreams.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDreams.map((dream, index) => {
                const category = getCategoryName(dream.category_id);
                return (
                  <Link
                    key={dream.id}
                    to={`/ruya/${dream.slug}`}
                    className="group dream-card animate-fade-in hover:shadow-lg transition-all duration-300"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      {category && (
                        <Badge variant="secondary" className="text-xs">
                          {category.icon} {category.name}
                        </Badge>
                      )}
                      {dream.is_featured && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    <h3 className="text-xl font-serif font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {dream.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                      {dream.content}
                    </p>

                    {/* Keywords */}
                    {Array.isArray(dream.keywords) && dream.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {dream.keywords.slice(0, 3).map((keyword) => (
                          <span key={keyword} className="text-xs px-2 py-0.5 rounded-full bg-muted">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-3 border-t border-border/50">
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
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDreams.map((dream, index) => {
                const category = getCategoryName(dream.category_id);
                return (
                  <Link
                    key={dream.id}
                    to={`/ruya/${dream.slug}`}
                    className="group flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all animate-fade-in"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    {/* Letter indicator */}
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-serif font-bold text-primary shrink-0">
                      {dream.title.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {category && (
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {category.icon} {category.name}
                          </Badge>
                        )}
                        {dream.is_featured && (
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
                        )}
                      </div>
                      <h3 className="font-medium group-hover:text-primary transition-colors line-clamp-1">
                        {dream.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{dream.content}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {(dream.view_count || 0).toLocaleString('tr-TR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {(dream.like_count || 0).toLocaleString('tr-TR')}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )
        ) : dreams.length > 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-serif font-semibold mb-2">Sonuç bulunamadı</h3>
            <p className="text-muted-foreground mb-6">
              Arama kriterlerinize uygun rüya tabiri bulunamadı.
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setShowOnlyFeatured(false);
              }}
            >
              Filtreleri Temizle
            </Button>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl font-serif font-bold text-muted-foreground">{selectedLetter}</span>
            </div>
            <h3 className="text-xl font-serif font-semibold mb-2">Henüz rüya tabiri yok</h3>
            <p className="text-muted-foreground mb-6">
              "{selectedLetter}" harfi ile başlayan rüya tabiri bulunamadı.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-sm text-muted-foreground">Diğer harfleri deneyin:</span>
              {alphabet.filter(c => (letterCounts[c] || 0) > 0).slice(0, 5).map(char => (
                <Button
                  key={char}
                  variant="outline"
                  size="sm"
                  onClick={() => handleLetterClick(char)}
                >
                  {char}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Quick Navigation */}
        {filteredDreams.length > 6 && (
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Diğer harflere hızlıca geçin
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {alphabet.filter(c => (letterCounts[c] || 0) > 0 && c !== selectedLetter).map(char => (
                <Button
                  key={char}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLetterClick(char)}
                  className="w-8 h-8 p-0"
                >
                  {char}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Letter Statistics */}
        <div className="mt-12 pt-8 border-t border-border">
          <h3 className="text-lg font-serif font-semibold mb-6 text-center">Harf Dağılımı</h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {alphabet.map(char => {
              const count = letterCounts[char] || 0;
              const isActive = selectedLetter === char;
              const maxCount = Math.max(...Object.values(letterCounts));
              const intensity = count > 0 ? Math.max(0.1, count / maxCount) : 0;
              
              return (
                <button
                  key={char}
                  onClick={() => count > 0 && handleLetterClick(char)}
                  disabled={count === 0}
                  className={`
                    relative p-3 rounded-lg text-center transition-all duration-200
                    ${isActive 
                      ? 'dream-gradient text-primary-foreground shadow-lg' 
                      : count === 0
                        ? 'bg-muted/30 text-muted-foreground/30 cursor-not-allowed'
                        : 'hover:scale-105 cursor-pointer'
                    }
                  `}
                  style={!isActive && count > 0 ? { 
                    backgroundColor: `hsl(var(--primary) / ${intensity * 0.3})` 
                  } : {}}
                >
                  <span className="text-lg font-serif font-bold">{char}</span>
                  <span className={`block text-xs mt-1 ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <Button
            variant="outline"
            size="icon"
            className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg animate-fade-in"
            onClick={scrollToTop}
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
        )}
      </div>
    </Layout>
  );
}
