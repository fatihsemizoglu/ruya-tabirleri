import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DollarSign, Search, Users, Activity, AlertTriangle, Target } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { subDays, format as formatDate, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

import { supabase } from '@/integrations/supabase/client';
import { AnalyticsHeader } from './analytics/AnalyticsHeader';
import { RealtimeMetricsStrip } from './analytics/RealtimeMetricsStrip';
import { RoiTab } from './analytics/RoiTab';
import { IntentTab } from './analytics/IntentTab';
import { SegmentsTab } from './analytics/SegmentsTab';
import { exportToCSV, exportToPDF, CPM_RATE, AI_COST_PER_INTERPRETATION, AVG_READING_TIME_SECONDS, SEGMENT_COLORS, classifyIntent } from '@/lib/admin-analytics';
import type { ContentROI, SearchGap, UserSegment, RealtimeMetric } from '@/lib/admin-analytics';

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

  const zeroResultQueries = useMemo(
    () => (searchGaps || []).filter(g => g.results === 0).slice(0, 30),
    [searchGaps]
  );

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
      <AnalyticsHeader timeRange={timeRange} onTimeRangeChange={setTimeRange} />

      {/* Real-time Metrics Strip */}
      <RealtimeMetricsStrip metrics={realtimeMetrics} />

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
        <RoiTab
          roiData={roiData}
          roiLoading={roiLoading}
          roiType={roiType}
          onRoiTypeChange={setRoiType}
          onExportCsv={() => handleExportROI('csv')}
          onExportPdf={() => handleExportROI('pdf')}
        />

        {/* === Search Intent === */}
        <IntentTab
          searchGaps={searchGaps}
          gapsLoading={gapsLoading}
          onExportCsv={() => handleExportGaps('csv')}
          onExportPdf={() => handleExportGaps('pdf')}
        />

        {/* === Segments === */}
        <SegmentsTab
          userSegments={userSegments}
          segmentsLoading={segmentsLoading}
          onExportCsv={() => handleExportSegments('csv')}
          onExportPdf={() => handleExportSegments('pdf')}
        />
      </Tabs>
    </div>
  );
}

export default AnalyticsDashboard;
