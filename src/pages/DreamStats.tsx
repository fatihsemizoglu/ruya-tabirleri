import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, BookOpen, Eye, MoonStar, Sparkles, TrendingUp, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Layout } from '@/components/layout/Layout';
import { Seo } from '@/components/Seo';
import { supabase } from '@/integrations/supabase/client';
import { queryKeys } from '@/lib/query/client';

const PIE_COLORS = ['#8b5cf6', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

interface TopDream {
  id: string;
  title: string;
  slug: string;
  view_count: number | null;
}

interface CategoryCount {
  category_id: string;
  dream_count: number;
}

interface LetterCount {
  letter: string;
  dream_count: number;
}

async function fetchStats() {
  const [topDreamsRes, categoryCountsRes, letterCountsRes, globalStatsRes] = await Promise.all([
    supabase
      .from('dreams')
      .select('id, title, slug, view_count')
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .limit(10),
    supabase.rpc('get_dream_category_counts'),
    supabase.rpc('get_letter_counts'),
    supabase.from('global_dream_stats').select('*').limit(1).maybeSingle(),
  ]);

  return {
    topDreams: ((topDreamsRes.data || []) as TopDream[]).filter((d) => d.slug),
    categoryCounts: (categoryCountsRes.data || []) as CategoryCount[],
    letterCounts: (letterCountsRes.data || []) as LetterCount[],
    globalStats: (globalStatsRes.data || null) as {
      total_dreams: number | null;
      active_users: number | null;
      unique_symbols: number | null;
      top_symbols: string[] | null;
      emotion_distribution: Record<string, number> | null;
    } | null,
  };
}

function formatNumber(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString('tr-TR');
}

export default function DreamStatsPage() {
  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.dreams.stats(), 'public'],
    queryFn: fetchStats,
    staleTime: 1000 * 60 * 30,
  });

  const totalPublished = data?.letterCounts?.reduce((acc, l) => acc + l.dream_count, 0) ?? 0;

  const emotionData = Object.entries(data?.globalStats?.emotion_distribution ?? {})
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <Layout>
      <Seo
        title="Rüya İstatistikleri — En Çok Görülen Rüyalar"
        description="Sitemizdeki 8.900'den fazla rüya tabirinin kategori, harf ve görüntülenme istatistikleri. En çok okunan rüyalar, sembol dağılımı ve güncel trendler."
        path="/istatistikler"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Dataset',
          name: 'Rüya Tabirleri İstatistikleri',
          description:
            'Türkçe rüya tabiri arşivinin görüntülenme, kategori ve alfabetik dağılım istatistikleri.',
          url: `${import.meta.env.VITE_SITE_URL || 'https://ruya-tabirleri.vercel.app'}/istatistikler`,
          creator: { '@type': 'Organization', name: 'Rüya Tabirleri' },
        }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh" />
        <div className="container relative pt-12 pb-8 md:pt-16 md:pb-10">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary text-sm font-semibold mb-4">
              <BarChart3 className="h-3.5 w-3.5" />
              Canlı Veriler
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif-dream font-bold tracking-tight mb-4">
              Rüya{' '}
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 bg-clip-text text-transparent">
                İstatistikleri
              </span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Arşivimizdeki binlerce rüya tabirinin gerçek kullanım verileri: en çok okunanlar,
              kategori dağılımı ve topluluk eğilimleri.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="container pb-16">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <MoonStar className="h-10 w-10 animate-pulse text-primary" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Sayaç kartları */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: BookOpen, label: 'Yayında Tabir', value: formatNumber(totalPublished), color: 'text-violet-500' },
                { icon: Eye, label: 'Toplam Okuma', value: formatNumber(data?.topDreams?.reduce((a, d) => a + (d.view_count ?? 0), 0)), color: 'text-fuchsia-500' },
                { icon: Sparkles, label: 'Benzersiz Sembol', value: formatNumber(data?.globalStats?.unique_symbols), color: 'text-pink-500' },
                { icon: Users, label: 'Rüya Kaydeden Kullanıcı', value: formatNumber(data?.globalStats?.active_users), color: 'text-sky-500' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="rounded-2xl border border-border/50 bg-card/70 p-5">
                  <Icon className={`h-5 w-5 mb-2 ${color}`} />
                  <div className="text-2xl font-bold text-foreground">{value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* En çok okunan rüyalar */}
            <div className="rounded-3xl border border-border/50 bg-card/60 p-6">
              <h2 className="flex items-center gap-2 text-lg font-bold text-foreground mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                En Çok Okunan Rüyalar
              </h2>
              <ol className="space-y-2.5">
                {(data?.topDreams ?? []).map((dream, i) => (
                  <li key={dream.id} className="flex items-center gap-3">
                    <span className="w-7 h-7 shrink-0 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <Link
                      to={`/ruya/${dream.slug}`}
                      className="flex-1 min-w-0 truncate text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {dream.title}
                    </Link>
                    <span className="shrink-0 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      {formatNumber(dream.view_count)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Kategori dağılımı */}
            {(data?.categoryCounts?.length ?? 0) > 0 && (
              <div className="rounded-3xl border border-border/50 bg-card/60 p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Kategori Dağılımı</h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.categoryCounts ?? []} margin={{ top: 4, right: 8, left: -18, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.08} />
                      <XAxis
                        dataKey="_cat"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(_, i) => String(i + 1)}
                        stroke="currentColor"
                        opacity={0.5}
                      />
                      <YAxis tick={{ fontSize: 11 }} stroke="currentColor" opacity={0.5} />
                      <Tooltip
                        formatter={(v) => [formatNumber(Number(v)), 'Tabir sayısı']}
                        contentStyle={{ borderRadius: 12, fontSize: 12 }}
                      />
                      <Bar dataKey="dream_count" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Duygu dağılımı */}
            {emotionData.length > 0 && (
              <div className="rounded-3xl border border-border/50 bg-card/60 p-6">
                <h2 className="text-lg font-bold text-foreground mb-1">Topluluk Duygu Dağılımı</h2>
                <p className="text-xs text-muted-foreground mb-4">
                  Rüya günlüğüne kaydedilen rüyaların anonim duygu etiketleri.
                </p>
                <div className="grid sm:grid-cols-[240px_1fr] gap-6 items-center">
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={emotionData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                          {emotionData.map((entry, i) => (
                            <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [formatNumber(Number(v)), 'Rüya']} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="space-y-2">
                    {emotionData.map((e, i) => (
                      <li key={e.name} className="flex items-center gap-2 text-sm">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="capitalize text-foreground">{e.name}</span>
                        <span className="ml-auto text-muted-foreground">{formatNumber(e.value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="rounded-3xl border border-violet-500/25 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-transparent p-6 text-center">
              <p className="text-foreground font-semibold">Senin rüyaların bu tabloyu zenginleştiriyor</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Rüyanızı yorumlatın veya günlüğünüze kaydedin; anonim istatistiklere katkıda bulunun.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Link
                  to="/ruyami-yorumlat"
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl dream-gradient text-white font-semibold text-sm"
                >
                  <Sparkles className="h-4 w-4" />
                  Rüyamı Yorumlat
                </Link>
                <Link
                  to="/ruya-gunlugum"
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-colors"
                >
                  Günlüğüme Git
                </Link>
              </div>
            </div>
          </div>
        )}
      </section>
    </Layout>
  );
}
