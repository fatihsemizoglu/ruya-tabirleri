import { Link } from 'react-router-dom';
import { CalendarDays, Sparkles, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type DailyDream = {
  id: string;
  title: string;
  slug: string;
  view_count: number;
};

function dayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

export function DailyDreamCard() {
  const { data: dream, isLoading } = useQuery({
    queryKey: ['daily-dream-card', new Date().toISOString().slice(0, 10)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dreams')
        .select('id, title, slug, view_count')
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(60);
      if (error) throw error;
      const dreams = (data || []) as DailyDream[];
      if (dreams.length === 0) return null;
      return dreams[dayOfYear() % dreams.length];
    },
    staleTime: 12 * 60 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <section className="container py-8">
        <div className="mx-auto max-w-md">
          {/* Tema-uyumlu iskelet (eski sabit bg-gray-800 hem açık hem koyu modda yanlıştı) */}
          <div className="h-32 animate-pulse rounded-2xl border border-border/40 bg-muted" />
        </div>
      </section>
    );
  }

  if (!dream) return null;

  return (
    <section className="container py-8">
      <div className="mx-auto max-w-md">
        <Link
          to={`/ruya/${dream.slug}`}
          className="group relative block overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 p-4 transition-all duration-300 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/10 active:scale-[0.98] sm:p-5"
        >
          {/* Üstte ince gradyan çizgi — gece kartı hissi */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />
          {/* Dekoratif parıltı */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl transition-opacity duration-300 group-hover:opacity-80" />

          <div className="relative flex items-center gap-3.5 sm:gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20 sm:h-12 sm:w-12">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-violet-300 sm:text-xs">
                <CalendarDays className="h-3 w-3" />
                Günün Rüyası
              </p>
              <h3 className="line-clamp-2 text-[15px] font-semibold text-white transition-colors group-hover:text-violet-300 sm:text-base">
                {dream.title}
              </h3>
              <p className="mt-1 text-[11px] text-gray-400 sm:text-xs">
                {dream.view_count.toLocaleString('tr-TR')} görüntülenme
              </p>
            </div>
            {/* Mobilde tıklanabilirlik ipucu */}
            <ArrowRight className="h-4 w-4 shrink-0 text-gray-500 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-violet-300" />
          </div>
        </Link>
      </div>
    </section>
  );
}
