import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  TrendingUp, 
  Calendar,
  BarChart3,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { formatDistanceToNow, subDays, format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

interface SearchStat {
  query: string;
  count: number;
  last_searched: string;
}

export function SearchAnalytics() {
  const [timeRange, setTimeRange] = useState('7');
  const queryClient = useQueryClient();

  // Fetch top searches
  const { data: topSearches, isLoading: isLoadingTop } = useQuery({
    queryKey: ['admin-search-analytics', timeRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), parseInt(timeRange)).toISOString();
      
      const { data, error } = await supabase
        .from('search_logs')
        .select('query, created_at')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Aggregate queries
      const queryMap = new Map<string, { count: number; last_searched: string }>();
      
      data?.forEach(log => {
        const normalizedQuery = log.query.toLowerCase().trim();
        const existing = queryMap.get(normalizedQuery);
        
        if (existing) {
          existing.count += 1;
          if (new Date(log.created_at) > new Date(existing.last_searched)) {
            existing.last_searched = log.created_at;
          }
        } else {
          queryMap.set(normalizedQuery, {
            count: 1,
            last_searched: log.created_at,
          });
        }
      });
      
      // Convert to array and sort by count
      const result: SearchStat[] = Array.from(queryMap.entries())
        .map(([query, stats]) => ({
          query,
          count: stats.count,
          last_searched: stats.last_searched,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20);
      
      return result;
    },
  });

  // Fetch search stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-search-stats', timeRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), parseInt(timeRange)).toISOString();
      
      const { data, error, count } = await supabase
        .from('search_logs')
        .select('*', { count: 'exact', head: false })
        .gte('created_at', startDate);
      
      if (error) throw error;
      
      // Count unique queries
      const uniqueQueries = new Set(data?.map(d => d.query.toLowerCase().trim()) || []);
      
      return {
        totalSearches: count || 0,
        uniqueQueries: uniqueQueries.size,
        avgPerDay: Math.round((count || 0) / parseInt(timeRange)),
      };
    },
  });

  // Clear old logs
  const clearLogsMutation = useMutation({
    mutationFn: async () => {
      const cutoffDate = subDays(new Date(), 30).toISOString();
      const { error } = await supabase
        .from('search_logs')
        .delete()
        .lt('created_at', cutoffDate);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-search-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-search-stats'] });
      toast.success('30 günden eski loglar temizlendi');
    },
    onError: (error: Error) => {
      toast.error(`Hata: ${error.message}`);
    },
  });

  const getPopularityBadge = (count: number, maxCount: number) => {
    const ratio = count / maxCount;
    if (ratio >= 0.8) return { variant: 'default' as const, label: 'Çok Popüler' };
    if (ratio >= 0.5) return { variant: 'secondary' as const, label: 'Popüler' };
    if (ratio >= 0.2) return { variant: 'outline' as const, label: 'Orta' };
    return { variant: 'outline' as const, label: '' };
  };

  const maxCount = topSearches?.[0]?.count || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Arama Analitiği
          </h2>
          <p className="text-muted-foreground">
            Kullanıcıların en çok aradığı kelimeler
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Son 24 saat</SelectItem>
              <SelectItem value="7">Son 7 gün</SelectItem>
              <SelectItem value="30">Son 30 gün</SelectItem>
              <SelectItem value="90">Son 90 gün</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['admin-search-analytics'] });
              queryClient.invalidateQueries({ queryKey: ['admin-search-stats'] });
            }}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Toplam Arama</p>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold">{stats?.totalSearches.toLocaleString('tr-TR')}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Benzersiz Arama</p>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold">{stats?.uniqueQueries.toLocaleString('tr-TR')}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Günlük Ortalama</p>
              {isLoadingStats ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold">{stats?.avgPerDay.toLocaleString('tr-TR')}</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Top Searches */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            En Çok Aranan Kelimeler
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearLogsMutation.mutate()}
            disabled={clearLogsMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Eski Logları Temizle
          </Button>
        </div>

        {isLoadingTop ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="w-16 h-6" />
              </div>
            ))}
          </div>
        ) : topSearches && topSearches.length > 0 ? (
          <div className="space-y-3">
            {topSearches.map((search, index) => {
              const badge = getPopularityBadge(search.count, maxCount);
              const barWidth = (search.count / maxCount) * 100;
              
              return (
                <div 
                  key={search.query} 
                  className="group relative flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Rank */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index < 3 
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>

                  {/* Query & Progress */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-slate-900 dark:text-white truncate">
                        {search.query}
                      </span>
                      {badge.label && (
                        <Badge variant={badge.variant} className="text-xs">
                          {badge.label}
                        </Badge>
                      )}
                    </div>
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>

                  {/* Count & Time */}
                  <div className="text-right">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {search.count.toLocaleString('tr-TR')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(search.last_searched), { 
                        addSuffix: true, 
                        locale: tr 
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Henüz arama verisi yok</h3>
            <p className="text-muted-foreground">
              Kullanıcılar arama yaptıkça veriler burada görünecek.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default SearchAnalytics;
