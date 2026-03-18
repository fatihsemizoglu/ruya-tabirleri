import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

// Web Speech API type declarations
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
import { TrendingUp, Eye, Heart, Star, ChevronUp, Loader2, Flame, Award, Sparkles, Search, Grid3X3, List, Calendar, Clock, Filter, Mic, MicOff, Pencil, Edit } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { dreamsApi, categoriesApi, type Dream, type Category } from '@/lib/api';

const ITEMS_PER_PAGE = 12;

type TimeFilter = 'all' | 'today' | 'week' | 'month' | 'year';
type ViewMode = 'grid' | 'list';

export default function Popular() {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [mostViewed, setMostViewed] = useState<Dream[]>([]);
  const [mostLiked, setMostLiked] = useState<Dream[]>([]);
  const [featured, setFeatured] = useState<Dream[]>([]);
  const [trending, setTrending] = useState<Dream[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('trending');
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDream, setEditingDream] = useState<Dream | null>(null);
  
  // Handle click on dream card - for admins, go to admin panel
  const handleDreamClick = (dream: Dream, e: React.MouseEvent) => {
    if (isAdmin) {
      e.preventDefault();
      navigate('/admin/dreams');
    }
    // For non-admins, default Link behavior continues
  };
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Pagination states
  const [viewedPage, setViewedPage] = useState(1);
  const [likedPage, setLikedPage] = useState(1);
  const [featuredPage, setFeaturedPage] = useState(1);
  const [hasMoreViewed, setHasMoreViewed] = useState(true);
  const [hasMoreLiked, setHasMoreLiked] = useState(true);
  const [hasMoreFeatured, setHasMoreFeatured] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Stats
  const [totalStats, setTotalStats] = useState({
    totalDreams: 0,
    totalViews: 0,
    totalLikes: 0,
  });

  useEffect(() => {
    fetchCategories();
    fetchDreams();
    fetchTotalStats();

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Refetch when time filter changes
  useEffect(() => {
    fetchDreams();
  }, [timeFilter]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'tr-TR';

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');

        if (event.results[0].isFinal) {
          setSearchQuery(transcript);
        }
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleVoiceSearch = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setSearchQuery('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const fetchCategories = async () => {
    const response = await categoriesApi.getAll();
    if (response.success && response.data) {
      const categoryMap: Record<string, Category> = {};
      response.data.forEach((cat) => {
        categoryMap[cat.id] = cat;
      });
      setCategories(categoryMap);
    }
  };

  const fetchTotalStats = async () => {
    const response = await dreamsApi.getAll({ limit: 10000 });
    
    if (response.success && response.data) {
      setTotalStats({
        totalDreams: response.data.length,
        totalViews: response.data.reduce((sum, d) => sum + (d.view_count || 0), 0),
        totalLikes: response.data.reduce((sum, d) => sum + (d.like_count || 0), 0),
      });
    }
  };

  const fetchDreams = async () => {
    setIsLoading(true);
    try {
      // Trending - get most viewed and sort by combined score
      const trendingResponse = await dreamsApi.getAll({ 
        limit: ITEMS_PER_PAGE,
        sort_by: 'view_count',
        sort_order: 'desc'
      });
      
      if (trendingResponse.success && trendingResponse.data) {
        // Calculate trending score
        const withScore = trendingResponse.data.map(dream => ({
          ...dream,
          score: (dream.view_count || 0) * 0.3 + (dream.like_count || 0) * 0.7
        }));
        withScore.sort((a, b) => b.score - a.score);
        setTrending(withScore as Dream[]);
      }

      // Most viewed
      const viewedResponse = await dreamsApi.getAll({
        limit: ITEMS_PER_PAGE,
        sort_by: 'view_count',
        sort_order: 'desc'
      });
      setMostViewed(viewedResponse.data || []);
      setHasMoreViewed((viewedResponse.data?.length || 0) === ITEMS_PER_PAGE);

      // Most liked
      const likedResponse = await dreamsApi.getAll({
        limit: ITEMS_PER_PAGE,
        sort_by: 'like_count',
        sort_order: 'desc'
      });
      setMostLiked(likedResponse.data || []);
      setHasMoreLiked((likedResponse.data?.length || 0) === ITEMS_PER_PAGE);

      // Featured
      const featuredResponse = await dreamsApi.getFeatured(ITEMS_PER_PAGE);
      setFeatured(featuredResponse.data || []);
      setHasMoreFeatured((featuredResponse.data?.length || 0) === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error fetching dreams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = async (type: 'viewed' | 'liked' | 'featured') => {
    setLoadingMore(true);
    try {
      if (type === 'viewed') {
        const offset = viewedPage * ITEMS_PER_PAGE;
        const response = await dreamsApi.getAll({
          limit: ITEMS_PER_PAGE,
          page: viewedPage + 1,
          sort_by: 'view_count',
          sort_order: 'desc'
        });
        if (response.success && response.data) {
          setMostViewed(prev => [...prev, ...response.data]);
          setHasMoreViewed(response.data.length === ITEMS_PER_PAGE);
          setViewedPage(prev => prev + 1);
        }
      } else if (type === 'liked') {
        const response = await dreamsApi.getAll({
          limit: ITEMS_PER_PAGE,
          page: likedPage + 1,
          sort_by: 'like_count',
          sort_order: 'desc'
        });
        if (response.success && response.data) {
          setMostLiked(prev => [...prev, ...response.data]);
          setHasMoreLiked(response.data.length === ITEMS_PER_PAGE);
          setLikedPage(prev => prev + 1);
        }
      } else {
        const response = await dreamsApi.getFeatured((featuredPage + 1) * ITEMS_PER_PAGE);
        if (response.success && response.data) {
          const newItems = response.data.slice(featured.length);
          setFeatured(prev => [...prev, ...newItems]);
          setHasMoreFeatured(newItems.length === ITEMS_PER_PAGE);
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

  // Filter dreams based on search and category
  const filterDreams = useCallback((dreams: Dream[]) => {
    let result = [...dreams];

    if (searchQuery.trim()) {
      // Normalize query to include both "rüyada" and plain pattern
      // e.g., "uçmak" becomes "uçmak rüyada uçmak" to match both formats
      const normalizedQuery = searchQuery.toLowerCase().trim();
      const ruyadaPrefix = 'rüyada ';
      const searchTerms = [normalizedQuery];
      
      if (!normalizedQuery.startsWith(ruyadaPrefix)) {
        searchTerms.push(`${ruyadaPrefix}${normalizedQuery}`);
      }
      
      result = result.filter(dream => {
        const titleLower = dream.title.toLowerCase();
        const contentLower = dream.content.toLowerCase();
        const keywordsLower = dream.keywords?.map(k => k.toLowerCase()) || [];
        
        return searchTerms.some(term =>
          titleLower.includes(term) ||
          contentLower.includes(term) ||
          keywordsLower.some(k => k.includes(term))
        );
      });
    }

    if (selectedCategory !== 'all') {
      result = result.filter(dream => dream.category_id === selectedCategory);
    }

    return result;
  }, [searchQuery, selectedCategory]);

  const filteredTrending = useMemo(() => filterDreams(trending), [trending, filterDreams]);
  const filteredViewed = useMemo(() => filterDreams(mostViewed), [mostViewed, filterDreams]);
  const filteredLiked = useMemo(() => filterDreams(mostLiked), [mostLiked, filterDreams]);
  const filteredFeatured = useMemo(() => filterDreams(featured), [featured, filterDreams]);

  const getRankBadge = (index: number) => {
    if (index === 0) return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">🥇 1.</Badge>;
    if (index === 1) return <Badge className="bg-gray-400/20 text-gray-600 border-gray-400/30">🥈 2.</Badge>;
    if (index === 2) return <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30">🥉 3.</Badge>;
    return <Badge variant="outline" className="text-muted-foreground">#{index + 1}</Badge>;
  };

  const DreamCard = ({ dream, index }: { dream: Dream; index: number }) => {
    const category = dream.category_id ? categories[dream.category_id] : null;
    
    if (viewMode === 'list') {
      return (
        <Link
          to={`/ruya/${dream.slug}`}
          onClick={(e) => handleDreamClick(dream, e)}
          className={`group flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:shadow-lg hover:border-primary/30 transition-all duration-300 animate-fade-in ${isAdmin ? 'cursor-pointer' : ''}`}
          style={{ animationDelay: `${(index % ITEMS_PER_PAGE) * 30}ms` }}
        >
          <div className="shrink-0">
            {getRankBadge(index)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {dream.is_featured && (
                <Star className="h-3 w-3 text-accent fill-accent shrink-0" />
              )}
              {category && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  {category.icon} {category.name}
                </Badge>
              )}
              {isAdmin && (
                <Badge variant="outline" className="text-xs shrink-0 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                  <Pencil className="h-3 w-3 mr-1" /> Düzenle
                </Badge>
              )}
            </div>
            <h3 className="font-medium group-hover:text-primary transition-colors line-clamp-1">
              {dream.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">{dream.content}</p>
          </div>
          
          <div className="flex items-center gap-4 shrink-0 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              <span className="font-medium">{(dream.view_count || 0).toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="h-4 w-4" />
              <span className="font-medium">{(dream.like_count || 0).toLocaleString('tr-TR')}</span>
            </div>
          </div>
        </Link>
      );
    }
    
    return (
      <Link
        to={`/ruya/${dream.slug}`}
        onClick={(e) => handleDreamClick(dream, e)}
        className={`group block bg-card border border-border rounded-xl p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300 animate-fade-in ${isAdmin ? 'cursor-pointer' : ''}`}
        style={{ animationDelay: `${(index % ITEMS_PER_PAGE) * 50}ms` }}
      >
        <div className="flex items-center justify-between mb-4">
          {getRankBadge(index)}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                <Pencil className="h-3 w-3 mr-1" /> Düzenle
              </Badge>
            )}
            {dream.is_featured && (
              <Star className="h-4 w-4 text-accent fill-accent" />
            )}
            {category && (
              <Badge variant="secondary" className="text-xs">
                {category.icon} {category.name}
              </Badge>
            )}
          </div>
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
        
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4" />
              <span className="font-medium">{(dream.view_count || 0).toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Heart className="h-4 w-4" />
              <span className="font-medium">{(dream.like_count || 0).toLocaleString('tr-TR')}</span>
            </div>
          </div>
          <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Devamını oku →
          </span>
        </div>
      </Link>
    );
  };

  const DreamGrid = ({ dreams, type, hasMore }: { dreams: Dream[]; type?: 'viewed' | 'liked' | 'featured'; hasMore?: boolean }) => {    
    return (
      <div className="space-y-8">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="text-center pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => loadMore(type)}
              disabled={loadingMore}
              className="min-w-[200px]"
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
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-3'}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className={`bg-card border border-border rounded-xl ${viewMode === 'grid' ? 'p-6' : 'p-4 flex gap-4'} animate-pulse`}>
          <div className="h-6 w-12 bg-muted rounded shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
        <Sparkles className="h-8 w-8 text-muted-foreground" />
      </div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  const timeFilterLabels: Record<TimeFilter, string> = {
    all: 'Tüm Zamanlar',
    today: 'Bugün',
    week: 'Bu Hafta',
    month: 'Bu Ay',
    year: 'Bu Yıl',
  };

  return (
    <Layout>
      {/* Hero Section with Gradient Background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-slate-950 dark:via-indigo-950/30 dark:to-purple-950/20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-gradient-to-br from-indigo-400/10 via-purple-400/10 to-pink-400/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[350px] h-[350px] bg-gradient-to-tr from-blue-400/10 via-indigo-400/10 to-violet-400/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container py-12 md:py-16 relative">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-lg shadow-indigo-500/10 border border-indigo-100 dark:border-indigo-900 text-indigo-600 dark:text-indigo-400 text-sm font-semibold mb-6">
              <TrendingUp className="h-4 w-4" />
              <span>Trendler</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Popüler Rüya Tabirleri
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              En çok aranan ve beğenilen rüya tabirlerini keşfedin. 
              <span className="text-indigo-600 dark:text-indigo-400 font-medium">Binlerce rüya </span>
              yorumu arasından size en uygun olanı bulun.
            </p>
          </div>

          {/* Stats Cards - Improved */}
          {!isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-indigo-100 dark:border-indigo-800 rounded-2xl p-5 text-center hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Flame className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{totalStats.totalDreams.toLocaleString('tr-TR')}</div>
                <div className="text-sm text-muted-foreground font-medium">Toplam Rüya</div>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-indigo-100 dark:border-indigo-800 rounded-2xl p-5 text-center hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{totalStats.totalViews.toLocaleString('tr-TR')}</div>
                <div className="text-sm text-muted-foreground font-medium">Toplam Görüntülenme</div>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-indigo-100 dark:border-indigo-800 rounded-2xl p-5 text-center hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">{totalStats.totalLikes.toLocaleString('tr-TR')}</div>
                <div className="text-sm text-muted-foreground font-medium">Toplam Beğeni</div>
              </div>
              <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-indigo-100 dark:border-indigo-800 rounded-2xl p-5 text-center hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">{featured.length}</div>
                <div className="text-sm text-muted-foreground font-medium">Öne Çıkan</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="container py-8 md:py-12">

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Popüler rüyalarda ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-20"
            />
            {voiceSupported && (
              <button
                onClick={toggleVoiceSearch}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all duration-200 ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                }`}
                title={isListening ? 'Ses dinlemeyi durdur' : 'Sesli ara'}
              >
                {isListening ? (
                  <Mic className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
            )}
            {isListening && (
              <span className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-red-500 font-medium animate-pulse">
                Dinleniyor...
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Time Filter */}
            <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
              <SelectTrigger className="w-[160px]">
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(timeFilterLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {Object.values(categories).map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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

        {/* Active filters */}
        {(searchQuery || timeFilter !== 'all' || selectedCategory !== 'all') && (
          <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
            <span>Filtreler:</span>
            {timeFilter !== 'all' && (
              <Badge variant="secondary">{timeFilterLabels[timeFilter]}</Badge>
            )}
            {selectedCategory !== 'all' && (
              <Badge variant="secondary">{categories[selectedCategory]?.name}</Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary">"{searchQuery}"</Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setTimeFilter('all');
                setSelectedCategory('all');
              }}
              className="text-xs h-6"
            >
              Temizle
            </Button>
          </div>
        )}

        {/* Tabs - Improved Styling */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-transparent h-auto p-0">
              <TabsTrigger 
                value="trending" 
                className="flex items-center gap-2 py-3 px-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all duration-300"
              >
                <Flame className="h-4 w-4" />
                <span className="hidden sm:inline">Trend</span>
              </TabsTrigger>
              <TabsTrigger 
                value="viewed" 
                className="flex items-center gap-2 py-3 px-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all duration-300"
              >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Görüntülenen</span>
              </TabsTrigger>
              <TabsTrigger 
                value="liked" 
                className="flex items-center gap-2 py-3 px-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
              >
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Beğenilen</span>
              </TabsTrigger>
              <TabsTrigger 
                value="featured" 
                className="flex items-center gap-2 py-3 px-4 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-yellow-600 data-[state=active]:text-white transition-all duration-300"
              >
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Öne Çıkan</span>
              </TabsTrigger>
            </TabsList>

          <TabsContent value="trending">
            {isLoading ? (
              <LoadingSkeleton />
            ) : filteredTrending.length > 0 ? (
              <DreamGrid dreams={filteredTrending} />
            ) : (
              <EmptyState message="Trend rüya tabiri bulunamadı." />
            )}
          </TabsContent>

          <TabsContent value="viewed">
            {isLoading ? (
              <LoadingSkeleton />
            ) : filteredViewed.length > 0 ? (
              <DreamGrid dreams={filteredViewed} type="viewed" hasMore={hasMoreViewed && !searchQuery && selectedCategory === 'all'} />
            ) : (
              <EmptyState message="Görüntülenen rüya tabiri bulunamadı." />
            )}
          </TabsContent>

          <TabsContent value="liked">
            {isLoading ? (
              <LoadingSkeleton />
            ) : filteredLiked.length > 0 ? (
              <DreamGrid dreams={filteredLiked} type="liked" hasMore={hasMoreLiked && !searchQuery && selectedCategory === 'all'} />
            ) : (
              <EmptyState message="Beğenilen rüya tabiri bulunamadı." />
            )}
          </TabsContent>

          <TabsContent value="featured">
            {isLoading ? (
              <LoadingSkeleton />
            ) : filteredFeatured.length > 0 ? (
              <DreamGrid dreams={filteredFeatured} type="featured" hasMore={hasMoreFeatured && !searchQuery && selectedCategory === 'all'} />
            ) : (
              <EmptyState message="Öne çıkan rüya tabiri bulunamadı." />
            )}
          </TabsContent>
        </Tabs>

        {/* Top 3 Highlights */}
        {!isLoading && trending.length >= 3 && (
          <div className="mt-16 pt-8 border-t border-border">
            <h2 className="text-2xl font-serif font-bold text-center mb-8">
              <span className="text-gradient">En Popüler 3 Rüya</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {trending.slice(0, 3).map((dream, index) => {
                const medals = ['🥇', '🥈', '🥉'];
                const colors = ['from-yellow-500/20 to-yellow-500/5', 'from-gray-400/20 to-gray-400/5', 'from-orange-500/20 to-orange-500/5'];
                const category = dream.category_id ? categories[dream.category_id] : null;
                
                return (
                  <Link
                    key={dream.id}
                    to={`/ruya/${dream.slug}`}
                    className={`group relative overflow-hidden rounded-2xl p-6 bg-gradient-to-b ${colors[index]} border border-border hover:shadow-xl transition-all duration-300`}
                  >
                    <div className="absolute top-4 right-4 text-4xl">{medals[index]}</div>
                    
                    {category && (
                      <Badge variant="secondary" className="mb-4">
                        {category.icon} {category.name}
                      </Badge>
                    )}
                    
                    <h3 className="text-xl font-serif font-bold mb-3 group-hover:text-primary transition-colors pr-12">
                      {dream.title}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {dream.content}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1.5 text-blue-500">
                        <Eye className="h-4 w-4" />
                        <strong>{(dream.view_count || 0).toLocaleString('tr-TR')}</strong>
                      </span>
                      <span className="flex items-center gap-1.5 text-rose-500">
                        <Heart className="h-4 w-4" />
                        <strong>{(dream.like_count || 0).toLocaleString('tr-TR')}</strong>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Scroll to Top */}
        {showScrollTop && (
          <Button
            variant="secondary"
            size="icon"
            className="fixed bottom-6 right-6 rounded-full shadow-lg z-50 animate-fade-in"
            onClick={scrollToTop}
          >
            <ChevronUp className="h-5 w-5" />
          </Button>
        )}
      </div>
    </Layout>
  );
}
