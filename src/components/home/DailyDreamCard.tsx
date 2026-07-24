import { Link } from 'react-router-dom';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type DailyDream = {
  id: string;
  title: string;
  slug: string;
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
        .select('id, title, slug')
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
      <section className="container py-6">
        <div className="h-20 animate-pulse rounded-xl bg-gray-800" />
      </section>
    );
  }

  if (!dream) return null;

  return (
    <section className="container py-6">
      <Link
        to={`/ruya/${dream.slug}`}
        className="group flex items-center gap-4 rounded-xl border border-gray-700/50 bg-gray-800/50 px-5 py-4 transition-colors hover:border-violet-500/30 hover:bg-gray-800"
      >
        <div className="flex items-center gap-2.5 whitespace-nowrap text-xs font-semibold uppercase tracking-widest text-violet-400">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Günün Rüyası</span>
        </div>
        <div className="h-5 w-px bg-gray-700" />
        <h3 className="min-w-0 flex-1 truncate text-sm font-medium text-gray-100 group-hover:text-white">
          {dream.title}
        </h3>
        <ArrowRight className="h-4 w-4 shrink-0 text-gray-500 transition-colors group-hover:text-violet-400" />
      </Link>
    </section>
  );
}
