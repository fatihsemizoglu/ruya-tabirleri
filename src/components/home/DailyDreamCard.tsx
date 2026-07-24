import { Link } from 'react-router-dom';
import { CalendarDays, Sparkles } from 'lucide-react';
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
          <div className="h-32 animate-pulse rounded-2xl bg-gray-800" />
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
          className="group relative block overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-600/20 via-fuchsia-600/10 to-background p-6 transition-all duration-300 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/10"
        >
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-violet-500/20 blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-violet-400">
                <CalendarDays className="h-3 w-3" />
                Günün Rüyası
              </p>
              <h3 className="text-base font-semibold text-gray-100 transition-colors group-hover:text-white line-clamp-2">
                {dream.title}
              </h3>
              <p className="mt-1.5 text-xs text-gray-500">{dream.view_count.toLocaleString('tr-TR')} görüntülenme</p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
