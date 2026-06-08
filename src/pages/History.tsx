import { useState, useEffect, useMemo } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Clock, Trash2, Eye, Heart, Search, Calendar, TrendingUp, Filter, X, ArrowRight } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface HistoryItem {
  id: string;
  dream_id: string;
  viewed_at: string;
  dream: {
    id: string;
    title: string;
    slug: string;
    content: string;
    view_count: number | null;
    like_count: number | null;
    category_id: string | null;
  } | null;
  category?: {
    name: string;
    slug: string;
  } | null;
}

type TimeFilter = 'all' | 'today' | 'week' | 'month';

export default function History() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchHistory();
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name');
    if (data) setCategories(data);
  };

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('view_history')
        .select(`
          id,
          dream_id,
          viewed_at,
          dream:dreams(id, title, slug, content, view_count, like_count, category_id)
        `)
        .eq('user_id', user!.id)
        .order('viewed_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Remove duplicates, keep only the latest view for each dream
      const uniqueHistory = data?.reduce((acc: HistoryItem[], curr: any) => {
        const exists = acc.find(h => h.dream_id === curr.dream_id);
        if (!exists && curr.dream) {
          acc.push({
            id: curr.id,
            dream_id: curr.dream_id,
            viewed_at: curr.viewed_at,
            dream: curr.dream,
          });
        }
        return acc;
      }, []) || [];

      // Fetch category info for each dream
      const categoryIds = [...new Set(uniqueHistory.map(h => h.dream?.category_id).filter(Boolean))];
      if (categoryIds.length > 0) {
        const { data: catData } = await supabase
          .from('categories')
          .select('id, name, slug')
          .in('id', categoryIds);

        if (catData) {
          const catMap = new Map(catData.map(c => [c.id, c]));
          uniqueHistory.forEach(h => {
            if (h.dream?.category_id) {
              h.category = catMap.get(h.dream.category_id) || null;
            }
          });
        }
      }

      setHistory(uniqueHistory);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      const { error } = await supabase
        .from('view_history')
        .delete()
        .eq('user_id', user!.id);

      if (error) throw error;
      toast({ title: 'Geçmiş temizlendi' });
      setHistory([]);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Hata', description: error.message });
    }
  };

  const removeItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('view_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setHistory(history.filter(h => h.id !== id));
      toast({ title: 'Öğe geçmişten kaldırıldı' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Hata', description: error.message });
    }
  };

  // Filter and search logic
  const filteredHistory = useMemo(() => {
    let result = [...history];

    // Time filter
    const now = new Date();
    if (timeFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      result = result.filter(h => new Date(h.viewed_at) >= today);
    } else if (timeFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(h => new Date(h.viewed_at) >= weekAgo);
    } else if (timeFilter === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      result = result.filter(h => new Date(h.viewed_at) >= monthAgo);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(h => h.dream?.category_id === categoryFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(h => 
        h.dream?.title.toLowerCase().includes(query) ||
        h.dream?.content.toLowerCase().includes(query)
      );
    }

    return result;
  }, [history, timeFilter, categoryFilter, searchQuery]);

  // Group by date
  const groupedHistory = useMemo(() => {
    const groups: { [key: string]: HistoryItem[] } = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    filteredHistory.forEach(item => {
      const itemDate = new Date(item.viewed_at);
      let dateKey: string;

      if (itemDate.toDateString() === today.toDateString()) {
        dateKey = 'Bugün';
      } else if (itemDate.toDateString() === yesterday.toDateString()) {
        dateKey = 'Dün';
      } else {
        dateKey = itemDate.toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: itemDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    return groups;
  }, [filteredHistory]);

  // Stats
  const stats = useMemo(() => {
    const totalViewed = history.length;
    const thisWeek = history.filter(h => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(h.viewed_at) >= weekAgo;
    }).length;
    const categoryCount = new Set(history.map(h => h.dream?.category_id).filter(Boolean)).size;
    
    return { totalViewed, thisWeek, categoryCount };
  }, [history]);

  const hasActiveFilters = timeFilter !== 'all' || categoryFilter !== 'all' || searchQuery.trim();

  const clearFilters = () => {
    setTimeFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/giris" replace />;
  }

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-1">Görüntüleme Geçmişi</h1>
            <p className="text-muted-foreground">
              Son görüntülediğiniz rüya tabirleri
            </p>
          </div>
          {history.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Geçmişi Temizle
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Geçmişi temizle</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tüm görüntüleme geçmişiniz silinecek. Bu işlem geri alınamaz.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>İptal</AlertDialogCancel>
                  <AlertDialogAction onClick={clearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Temizle
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Stats */}
        {history.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalViewed}</p>
                  <p className="text-sm text-muted-foreground">Toplam Görüntüleme</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.thisWeek}</p>
                  <p className="text-sm text-muted-foreground">Bu Hafta</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Filter className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.categoryCount}</p>
                  <p className="text-sm text-muted-foreground">Farklı Kategori</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {history.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Geçmişte ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Time Filter */}
            <Select value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Zaman" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Zamanlar</SelectItem>
                <SelectItem value="today">Bugün</SelectItem>
                <SelectItem value="week">Bu Hafta</SelectItem>
                <SelectItem value="month">Bu Ay</SelectItem>
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {/* Results Info */}
        {hasActiveFilters && filteredHistory.length > 0 && (
          <p className="text-sm text-muted-foreground mb-4">
            {filteredHistory.length} sonuç bulundu
          </p>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : history.length > 0 ? (
          filteredHistory.length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedHistory).map(([dateKey, items]) => (
                <div key={dateKey}>
                  {/* Date Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-semibold">{dateKey}</h2>
                    <Badge variant="secondary">{items.length}</Badge>
                  </div>

                  {/* Items */}
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start sm:items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all group"
                      >
                        <Link to={`/ruya/${item.dream?.slug}`} className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                            <h3 className="font-medium group-hover:text-primary transition-colors truncate">
                              {item.dream?.title}
                            </h3>
                            {item.category && (
                              <Badge variant="outline" className="text-xs w-fit">
                                {item.category.name}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                            {item.dream?.content.substring(0, 150)}...
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(item.viewed_at).toLocaleTimeString('tr-TR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {(item.dream?.view_count || 0).toLocaleString('tr-TR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-3 w-3" />
                              {(item.dream?.like_count || 0).toLocaleString('tr-TR')}
                            </span>
                          </div>
                        </Link>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="hidden sm:inline-flex opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Link to={`/ruya/${item.dream?.slug}`}>
                              Oku
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Sonuç bulunamadı</h3>
              <p className="text-muted-foreground mb-4">
                Arama kriterlerinize uygun kayıt bulunamadı.
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Filtreleri Temizle
              </Button>
            </div>
          )
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Clock className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-serif font-semibold mb-2">Geçmişiniz boş</h3>
            <p className="text-muted-foreground mb-6">
              Görüntülediğiniz rüya tabirleri burada listelenecek.
            </p>
            <Button asChild className="dream-gradient text-primary-foreground">
              <Link to="/ruya-tabirleri">Rüya Tabirlerine Göz At</Link>
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
