import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Target,
  DollarSign,
  Eye,
  Share2,
  Clock,
  Search,
  Download,
  FileDown,
  Filter,
  Sparkles,
  Crown,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { subDays, format as formatDate, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const CHART_COLORS = ['#8b5cf6', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

const CPM_RATE = 2.5;
const AI_COST_PER_INTERPRETATION = 0.002;
const AVG_READING_TIME_SECONDS = 90;

interface ContentROI {
  id: string;
  title: string;
  slug: string;
  type: 'dream' | 'blog';
  views: number;
  likes: number;
  comments: number;
  favorites: number;
  estRevenue: number;
  estCost: number;
  profit: number;
  roi: number;
  ctr: number;
  readingTime: number;
  shareRate: number;
}

interface SearchGap {
  query: string;
  count: number;
  results: number;
  intent: 'informational' | 'transactional' | 'navigational';
  lastSearched: string;
}

interface UserSegment {
  segment: 'Yeni' | 'Aktif' | 'Riskli' | 'Churned' | 'VIP';
  count: number;
  percentage: number;
  avgRevenue: number;
  color: string;
  recommendations: string[];
}

interface RealtimeMetric {
  label: string;
  value: number | string;
  change?: number;
  icon: typeof Activity;
  color: string;
}

const SEGMENT_COLORS: Record<string, string> = {
  'Yeni': '#3b82f6',
  'Aktif': '#10b981',
  'Riskli': '#f59e0b',
  'Churned': '#ef4444',
  'VIP': '#8b5cf6',
};

function classifyIntent(query: string): 'informational' | 'transactional' | 'navigational' {
  const q = query.toLowerCase();
  const transactional = ['satın al', 'fiyat', 'indirim', 'sipariş', 'abone ol', 'üye ol', 'kayıt'];
  const navigational = ['giriş', 'profil', 'ayarlar', 'site', 'anasayfa', 'menü'];
  if (transactional.some(t => q.includes(t))) return 'transactional';
  if (navigational.some(t => q.includes(t))) return 'navigational';
  return 'informational';
}

function exportToCSV(rows: Record<string, unknown>[], filename: string) {
  if (!rows.length) {
    toast.error('Dışa aktarılacak veri bulunamadı');
    return;
  }
  const firstRow = rows[0];
  if (!firstRow) return;
  const headers = Object.keys(firstRow);
  const csv = [
    headers.join(','),
    ...rows.map(r => headers.map(h => {
      const v = r[h];
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return /[,"\n]/.test(s) ? `"${s}"` : s;
    }).join(',')),
  ].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`${filename} indirildi`);
}

function exportToPDF(rows: Record<string, unknown>[], title: string, filename: string) {
  if (!rows.length) {
    toast.error('Dışa aktarılacak veri bulunamadı');
    return;
  }
  const firstRow = rows[0];
  if (!firstRow) return;
  const headers = Object.keys(firstRow);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>body{font-family:Arial,sans-serif;padding:24px}h1{color:#4f46e5}
    table{width:100%;border-collapse:collapse;margin-top:16px}
    th{background:#4f46e5;color:white;padding:8px;text-align:left}
    td{border:1px solid #e5e7eb;padding:6px;font-size:13px}
    tr:nth-child(even){background:#f9fafb}</style></head>
    <body><h1>${title}</h1><p>${formatDate(new Date(), 'dd MMMM yyyy HH:mm', { locale: tr })}</p>
    <table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map(r => `<tr>${headers.map(h => `<td>${r[h] ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
    </table></body></html>`;
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 300);
    toast.success(`${filename} yazdırma penceresi açıldı`);
  }
}

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('30');
  const [roiType, setRoiType] = useState<'all' | 'dream' | 'blog'>('all');
  const [activeTab, setActiveTab] = useState('roi');

  const startDate = useMemo(
    () => subDays(new Date(), parseInt(timeRange)).toISOString(),
    [timeRange]
  );

  // --- Content ROI ---
  const { data: roiData, isLoading: roiLoading } = useQuery({
    queryKey: ['admin-analytics-roi', timeRange, roiType],
    queryFn: async (): Promise<ContentROI[]> => {
      const fetchDreams = roiType !== 'blog';
      const fetchBlogs = roiType !== 'dream';

      const results: ContentROI[] = [];

      if (fetchDreams) {
        const { data: dreams } = await supabase
          .from('dreams')
          .select('id, title, slug, view_count, like_count, created_at')
          .eq('is_published', true)
          .order('view_count', { ascending: false })
          .limit(100);

        if (dreams) {
          const ids = dreams.map(d => d.id);
          const [{ data: comments }, { data: favs }, { data: views }] = await Promise.all([
            supabase.from('comments').select('dream_id').in('dream_id', ids),
            supabase.from('favorites').select('dream_id').in('dream_id', ids),
            supabase.from('view_history').select('dream_id').in('dream_id', ids).gte('viewed_at', startDate),
          ]);

          const commentMap = new Map<string, number>();
          const favMap = new Map<string, number>();
          const viewMap = new Map<string, number>();

          comments?.forEach(c => commentMap.set(c.dream_id, (commentMap.get(c.dream_id) || 0) + 1));
          favs?.forEach(f => favMap.set(f.dream_id, (favMap.get(f.dream_id) || 0) + 1));
          views?.forEach(v => viewMap.set(v.dream_id, (viewMap.get(v.dream_id) || 0) + 1));

          dreams.forEach(d => {
            const c = commentMap.get(d.id) || 0;
            const f = favMap.get(d.id) || 0;
            const periodViews = viewMap.get(d.id) || 0;
            const totalViews = d.view_count || 0;
            const estRevenue = (totalViews / 1000) * CPM_RATE;
            const estCost = AI_COST_PER_INTERPRETATION * periodViews;
            const profit = estRevenue - estCost;
            const roi = estCost > 0 ? (profit / estCost) * 100 : estRevenue > 0 ? 100 : 0;
            const ctr = totalViews > 0 ? ((c + f) / totalViews) * 100 : 0;
            const shareRate = c > 0 ? Math.min(c / Math.max(totalViews, 1) * 100, 5) : 0;

            results.push({
              id: d.id,
              title: d.title,
              slug: d.slug,
              type: 'dream',
              views: totalViews,
              likes: d.like_count || 0,
              comments: c,
              favorites: f,
              estRevenue,
              estCost,
              profit,
              roi,
              ctr,
              readingTime: AVG_READING_TIME_SECONDS,
              shareRate,
            });
          });
        }
      }

      if (fetchBlogs) {
        const { data: posts } = await supabase
          .from('blog_posts')
          .select('id, title, slug, view_count, like_count, created_at')
          .eq('is_published', true)
          .order('view_count', { ascending: false })
          .limit(50);

        if (posts) {
          for (const p of posts) {
            const estRevenue = ((p.view_count || 0) / 1000) * CPM_RATE;
            const estCost = AI_COST_PER_INTERPRETATION * (p.view_count || 0);
            const profit = estRevenue - estCost;
            const roi = estCost > 0 ? (profit / estCost) * 100 : estRevenue > 0 ? 100 : 0;
            const ctr = (p.view_count || 0) > 0 ? ((p.like_count || 0) / (p.view_count || 1)) * 100 : 0;

            results.push({
              id: p.id,
              title: p.title,
              slug: p.slug,
              type: 'blog',
              views: p.view_count || 0,
              likes: p.like_count || 0,
              comments: 0,
              favorites: 0,
              estRevenue,
              estCost,
              profit,
              roi,
              ctr,
              readingTime: AVG_READING_TIME_SECONDS,
              shareRate: 0,
            });
          }
        }
      }

      return results.sort((a, b) => b.profit - a.profit);
    },
  });

  // --- Search Intent / Zero Result Gaps ---
  const { data: searchGaps, isLoading: gapsLoading } = useQuery({
    queryKey: ['admin-analytics-search-gaps', timeRange],
    queryFn: async (): Promise<SearchGap[]> => {
      const { data, error } = await supabase
        .from('search_logs')
        .select('query, results_count, created_at')
        .gte('created_at', startDate)
        .order('created_at', { ascending: false })
        .limit(2000);

      if (error) throw error;

      const map = new Map<string, { count: number; results: number; last: string }>();
      data?.forEach(log => {
        const q = log.query.toLowerCase().trim();
        const existing = map.get(q);
        if (existing) {
          existing.count += 1;
          if (new Date(log.created_at) > new Date(existing.last)) {
            existing.last = log.created_at;
            existing.results = log.results_count || 0;
          }
        } else {
          map.set(q, { count: 1, results: log.results_count || 0, last: log.created_at });
        }
      });

      return Array.from(map.entries())
        .map(([query, stats]) => ({
          query,
          count: stats.count,
          results: stats.results,
          lastSearched: stats.last,
          intent: classifyIntent(query),
        }))
        .sort((a, b) => b.count - a.count);
    },
  });

  // --- User Segmentation (RFM) ---
  const { data: userSegments, isLoading: segmentsLoading } = useQuery({
    queryKey: ['admin-analytics-segments', timeRange],
    queryFn: async (): Promise<UserSegment[]> => {
      const cutoff = subDays(new Date(), parseInt(timeRange)).toISOString();
      const nowIso = new Date().toISOString();

      const [{ data: profiles }, { data: comments }, { data: views }, { data: favorites }, { data: subs }] =
        await Promise.all([
          supabase.from('profiles').select('user_id, created_at'),
          supabase.from('comments').select('user_id, created_at').gte('created_at', cutoff),
          supabase.from('view_history').select('user_id, viewed_at').gte('viewed_at', cutoff),
          supabase.from('favorites').select('user_id, created_at').gte('created_at', cutoff),
          supabase.from('blog_subscribers').select('id, is_verified, created_at'),
        ]);

      const userMap = new Map<string, {
        recency: number;
        frequency: number;
        lastView: string | null;
        lastComment: string | null;
        favorites: number;
        isActive: boolean;
        signupAt: string;
      }>();

      profiles?.forEach(p => {
        userMap.set(p.user_id, {
          recency: 999,
          frequency: 0,
          lastView: null,
          lastComment: null,
          favorites: 0,
          isActive: false,
          signupAt: p.created_at,
        });
      });

      views?.forEach(v => {
        const u = userMap.get(v.user_id);
        if (!u) return;
        u.frequency += 1;
        if (!u.lastView || new Date(v.viewed_at) > new Date(u.lastView)) {
          u.lastView = v.viewed_at;
        }
      });

      comments?.forEach(c => {
        const u = userMap.get(c.user_id);
        if (!u) return;
        u.frequency += 2;
        if (!u.lastComment || new Date(c.created_at) > new Date(u.lastComment)) {
          u.lastComment = c.created_at;
        }
      });

      favorites?.forEach(f => {
        const u = userMap.get(f.user_id);
        if (u) u.favorites += 1;
      });

      subs?.forEach(s => {
        const u = userMap.get(s.id);
        if (u) u.isActive = !!s.is_verified;
      });

      const segments: Record<string, { count: number; recencies: number[]; freqs: number[] }> = {
        'Yeni': { count: 0, recencies: [], freqs: [] },
        'Aktif': { count: 0, recencies: [], freqs: [] },
        'Riskli': { count: 0, recencies: [], freqs: [] },
        'Churned': { count: 0, recencies: [], freqs: [] },
        'VIP': { count: 0, recencies: [], freqs: [] },
      };

      userMap.forEach((u) => {
        const lastActivity = u.lastView || u.lastComment;
        const yeniSeg = segments['Yeni'];
        if (!lastActivity && new Date(u.signupAt) > subDays(new Date(), 7)) {
          if (yeniSeg) yeniSeg.count += 1;
          return;
        }
        const daysSince = lastActivity
          ? (Date.now() - new Date(lastActivity).getTime()) / 86400000
          : 999;

        if (u.frequency >= 20 && u.favorites >= 3) {
          const vip = segments['VIP'];
          if (vip) vip.count += 1;
        } else if (daysSince <= 7 && u.frequency >= 3) {
          const aktif = segments['Aktif'];
          if (aktif) aktif.count += 1;
        } else if (daysSince > 7 && daysSince <= 30) {
          const riskli = segments['Riskli'];
          if (riskli) riskli.count += 1;
        } else if (daysSince > 30) {
          const churned = segments['Churned'];
          if (churned) churned.count += 1;
        } else {
          if (yeniSeg) yeniSeg.count += 1;
        }
      });

      const totalUsers = userMap.size || 1;

      const recommendationMap: Record<string, string[]> = {
        'Yeni': ['Hoş geldin e-posta serisi', 'İlk 3 popüler rüyayı göster', 'Onboarding turu'],
        'Aktif': ['Kişiselleştirilmiş içerik önerileri', 'Yeni rüya tabirleri bildirimi', 'Haftalık bülten'],
        'Riskli': ['"Seni özledik" e-postası', 'Özel indirim teklifi', 'Push bildirim gönder'],
        'Churned': ['Re-engagement kampanyası', 'Anket gönder', 'Geri dönüş indirimi'],
        'VIP': ['Özel içerik erken erişim', 'Premium özellik tanıtımı', 'Sadakat programı'],
      };

      return Object.entries(segments).map(([segment, data]) => ({
        segment: segment as UserSegment['segment'],
        count: data.count,
        percentage: (data.count / totalUsers) * 100,
        avgRevenue: 0,
        color: SEGMENT_COLORS[segment] ?? 'bg-gray-500',
        recommendations: recommendationMap[segment] || [],
      }));
    },
  });

  // --- Real-time metrics ---
  const { data: realtimeData } = useQuery({
    queryKey: ['admin-analytics-realtime'],
    queryFn: async () => {
      const now = new Date();
      const fiveMinAgo = subDays(now, 0).toISOString();
      const fiveMinBack = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
      const oneHourBack = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

      const [
        { count: last5min },
        { count: lastHour },
        { data: recentSearches },
        { data: recentErrors },
      ] = await Promise.all([
        supabase.from('search_logs').select('*', { count: 'exact', head: true }).gte('created_at', fiveMinBack),
        supabase.from('search_logs').select('*', { count: 'exact', head: true }).gte('created_at', oneHourBack),
        supabase.from('search_logs').select('query, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('audit_logs').select('id, action, created_at').order('created_at', { ascending: false }).limit(20),
      ]);

      const errorCount = recentErrors?.filter(e => e.action?.toLowerCase().includes('error')).length || 0;
      const errorRate = recentErrors?.length ? (errorCount / recentErrors.length) * 100 : 0;

      return {
        liveSearches5m: last5min || 0,
        searchesLastHour: lastHour || 0,
        recentSearches: recentSearches || [],
        errorRate,
        errorCount,
      };
    },
    refetchInterval: 30_000,
  });

  // Top 10 ROI
  const top10ROI = useMemo(() => (roiData || []).slice(0, 10), [roiData]);

  const zeroResultQueries = useMemo(
    () => (searchGaps || []).filter(g => g.results === 0).slice(0, 30),
    [searchGaps]
  );

  const intentBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    (searchGaps || []).forEach(s => {
      map.set(s.intent, (map.get(s.intent) || 0) + s.count);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [searchGaps]);

  const intentHeatmap = useMemo(() => {
    const intent = ['informational', 'transactional', 'navigational'];
    const top = (searchGaps || []).slice(0, 30);
    return intent.map(i => ({
      intent: i,
      data: top.map((q, idx) => ({
        x: idx,
        y: q.intent === i ? q.count : 0,
        query: q.query,
        z: q.count,
      })).filter(d => d.y > 0),
    }));
  }, [searchGaps]);

  const realtimeMetrics: RealtimeMetric[] = [
    {
      label: 'Canlı Arama (5dk)',
      value: realtimeData?.liveSearches5m ?? 0,
      icon: Search,
      color: 'text-blue-500',
    },
    {
      label: 'Saatlik Aramalar',
      value: realtimeData?.searchesLastHour ?? 0,
      icon: Activity,
      color: 'text-emerald-500',
    },
    {
      label: 'Hata Oranı',
      value: `${realtimeData?.errorRate.toFixed(1) ?? 0}%`,
      icon: AlertTriangle,
      color: 'text-rose-500',
    },
    {
      label: 'Sıfır Sonuç',
      value: zeroResultQueries.length,
      icon: Target,
      color: 'text-amber-500',
    },
  ];

  const handleExportROI = (format: 'csv' | 'pdf') => {
    const rows = (roiData || []).map(r => ({
      Başlık: r.title,
      Tür: r.type === 'dream' ? 'Rüya' : 'Blog',
      Görüntülenme: r.views,
      Beğeni: r.likes,
      Yorum: r.comments,
      Favori: r.favorites,
      'Tahmini Gelir ($)': r.estRevenue.toFixed(2),
      'Tahmini Maliyet ($)': r.estCost.toFixed(2),
      'Kâr ($)': r.profit.toFixed(2),
      'ROI (%)': r.roi.toFixed(1),
      'CTR (%)': r.ctr.toFixed(2),
    }));
    if (format === 'csv') exportToCSV(rows, `icerik-roi-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`);
    else exportToPDF(rows, 'İçerik ROI Raporu', `icerik-roi-${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handleExportGaps = (format: 'csv' | 'pdf') => {
    const rows = zeroResultQueries.map(g => ({
      Sorgu: g.query,
      Aranma: g.count,
      Sonuç: g.results,
      Niyet: g.intent,
      'Son Aranma': formatDistanceToNow(new Date(g.lastSearched), { addSuffix: true, locale: tr }),
    }));
    if (format === 'csv') exportToCSV(rows, `icerik-bosluklari-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`);
    else exportToPDF(rows, 'İçerik Boşlukları', `icerik-bosluklari-${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const handleExportSegments = (format: 'csv' | 'pdf') => {
    const rows = (userSegments || []).map(s => ({
      Segment: s.segment,
      Kullanıcı: s.count,
      Yüzde: s.percentage.toFixed(1) + '%',
      Öneriler: s.recommendations.join('; '),
    }));
    if (format === 'csv') exportToCSV(rows, `kullanici-segmentleri-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`);
    else exportToPDF(rows, 'Kullanıcı Segmentasyonu', `kullanici-segmentleri-${formatDate(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium mb-2">
            <Sparkles className="w-3 h-3" />
            Gelişmiş Analitik
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            İçerik ROI, Arama Niyeti ve Segmentasyon
          </h2>
          <p className="text-muted-foreground">
            Detaylı performans, kullanıcı davranışı ve gerçek zamanlı metrikler
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Son 24 saat</SelectItem>
              <SelectItem value="7">Son 7 gün</SelectItem>
              <SelectItem value="30">Son 30 gün</SelectItem>
              <SelectItem value="90">Son 90 gün</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Real-time Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {realtimeMetrics.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <m.icon className={`w-5 h-5 ${m.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-2xl font-bold">{m.value}</p>
                </div>
                <div className="ml-auto">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="roi">
            <DollarSign className="w-4 h-4 mr-2" />
            İçerik ROI
          </TabsTrigger>
          <TabsTrigger value="intent">
            <Search className="w-4 h-4 mr-2" />
            Arama Niyeti
          </TabsTrigger>
          <TabsTrigger value="segments">
            <Users className="w-4 h-4 mr-2" />
            Segmentasyon
          </TabsTrigger>
        </TabsList>

        {/* === ROI === */}
        <TabsContent value="roi" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">İçerik ROI Hesaplayıcı</h3>
              <p className="text-sm text-muted-foreground">
                Her içerik için maliyet vs gelir (CPM ${CPM_RATE} / 1K görüntülenme)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={roiType} onValueChange={(v) => setRoiType(v as typeof roiType)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="dream">Rüyalar</SelectItem>
                  <SelectItem value="blog">Blog</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => handleExportROI('csv')}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportROI('pdf')}>
                <FileDown className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          {roiLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : top10ROI.length === 0 ? (
            <Card className="p-12 text-center">
              <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold">Henüz ROI verisi yok</p>
            </Card>
          ) : (
            <>
              <Card className="p-6">
                <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  En Karlı 10 İçerik
                </h4>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={top10ROI.map(r => ({
                    name: r.title.length > 22 ? r.title.slice(0, 22) + '…' : r.title,
                    Kâr: Number(r.profit.toFixed(2)),
                    Gelir: Number(r.estRevenue.toFixed(2)),
                    Maliyet: Number(r.estCost.toFixed(2)),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" angle={-30} textAnchor="end" height={70} fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Gelir" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Maliyet" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Kâr" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h4 className="text-sm font-bold mb-4">Tüm İçerikler (İlk 50)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted-foreground border-b">
                        <th className="pb-2 pr-3">Başlık</th>
                        <th className="pb-2 pr-3">Tür</th>
                        <th className="pb-2 pr-3 text-right">Görüntülenme</th>
                        <th className="pb-2 pr-3 text-right">CTR</th>
                        <th className="pb-2 pr-3 text-right">Gelir</th>
                        <th className="pb-2 pr-3 text-right">Kâr</th>
                        <th className="pb-2 text-right">ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(roiData || []).slice(0, 50).map(r => (
                        <tr key={`${r.type}-${r.id}`} className="border-b hover:bg-muted/50">
                          <td className="py-2 pr-3 max-w-[260px] truncate font-medium">{r.title}</td>
                          <td className="py-2 pr-3">
                            <Badge variant="outline" className="text-[10px]">
                              {r.type === 'dream' ? 'Rüya' : 'Blog'}
                            </Badge>
                          </td>
                          <td className="py-2 pr-3 text-right">{r.views.toLocaleString('tr-TR')}</td>
                          <td className="py-2 pr-3 text-right">{r.ctr.toFixed(1)}%</td>
                          <td className="py-2 pr-3 text-right text-emerald-600 dark:text-emerald-400">
                            ${r.estRevenue.toFixed(2)}
                          </td>
                          <td className={`py-2 pr-3 text-right font-bold ${r.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ${r.profit.toFixed(2)}
                          </td>
                          <td className="py-2 text-right">
                            <Badge variant={r.roi >= 100 ? 'default' : r.roi > 0 ? 'secondary' : 'destructive'}>
                              {r.roi.toFixed(0)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </TabsContent>

        {/* === Search Intent === */}
        <TabsContent value="intent" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Arama Niyeti Analizi</h3>
              <p className="text-sm text-muted-foreground">
                Sıfır sonuç aramaları → içerik boşlukları ve kullanıcı niyeti
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExportGaps('csv')}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportGaps('pdf')}>
                <FileDown className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          {gapsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="p-6 lg:col-span-1">
                <h4 className="text-sm font-bold mb-3">Niyet Dağılımı</h4>
                {intentBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Veri yok</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={intentBreakdown}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={50}
                        outerRadius={80}
                        label={(e) => `${e.name}: ${e.value}`}
                      >
                        {intentBreakdown.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card className="p-6 lg:col-span-2">
                <h4 className="text-sm font-bold mb-3">Sorgu Yoğunluk Haritası</h4>
                <ResponsiveContainer width="100%" height={240}>
                  <ScatterChart>
                    <CartesianGrid />
                    <XAxis dataKey="x" name="Sıra" fontSize={11} />
                    <YAxis dataKey="y" name="Aranma" fontSize={11} />
                    <ZAxis dataKey="z" range={[40, 400]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    {intentHeatmap.map((ih, i) => (
                      <Scatter
                        key={ih.intent}
                        name={ih.intent}
                        data={ih.data}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                    <Legend />
                  </ScatterChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          <Card className="p-6">
            <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Sıfır Sonuçlu Aramalar (İçerik Boşlukları)
            </h4>
            {gapsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : zeroResultQueries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Sıfır sonuç arama bulunamadı 🎉
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {zeroResultQueries.map((g, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-amber-50/30 dark:bg-amber-950/10">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{g.query}</p>
                      <p className="text-xs text-muted-foreground">
                        Son: {formatDistanceToNow(new Date(g.lastSearched), { addSuffix: true, locale: tr })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {g.intent}
                      </Badge>
                      <Badge variant="destructive">{g.count}x</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* === Segments === */}
        <TabsContent value="segments" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Kullanıcı Segmentasyonu (RFM)</h3>
              <p className="text-sm text-muted-foreground">
                Recency, Frequency, Monetary analizine dayalı segmentler
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExportSegments('csv')}>
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExportSegments('pdf')}>
                <FileDown className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          {segmentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {userSegments?.map(seg => {
                  const iconMap = {
                    'Yeni': Sparkles,
                    'Aktif': CheckCircle2,
                    'Riskli': AlertTriangle,
                    'Churned': Clock,
                    'VIP': Crown,
                  };
                  const Icon = iconMap[seg.segment];
                  return (
                    <Card key={seg.segment} className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${seg.color}20`, color: seg.color }}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm">{seg.segment}</span>
                      </div>
                      <p className="text-2xl font-bold">{seg.count.toLocaleString('tr-TR')}</p>
                      <p className="text-xs text-muted-foreground">
                        {seg.percentage.toFixed(1)}% kullanıcı
                      </p>
                    </Card>
                  );
                })}
              </div>

              <Card className="p-6">
                <h4 className="text-sm font-bold mb-3">Segment Dağılımı</h4>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={userSegments || []}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="segment" fontSize={12} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="count" name="Kullanıcı" radius={[6, 6, 0, 0]}>
                      {(userSegments || []).map((s, i) => (
                        <Cell key={i} fill={s.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h4 className="text-sm font-bold mb-3">Segment Bazlı İçerik Önerileri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {userSegments?.map(seg => (
                    <div key={seg.segment} className="p-4 rounded-lg border" style={{ borderColor: `${seg.color}40` }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                        <span className="font-bold text-sm">{seg.segment}</span>
                        <Badge variant="outline" className="ml-auto text-[10px]">
                          {seg.count} kullanıcı
                        </Badge>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {seg.recommendations.map((r, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-primary">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default AnalyticsDashboard;
