import { Link } from 'react-router-dom';
import { CalendarDays, Eye, Heart, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type DailyDream = {
  id: string;
  title: string;
  slug: string;
  content: string;
  view_count: number | null;
  like_count: number | null;
};

function dayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

function plainExcerpt(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
}

export function DailyDreamCard() {
  const { data: dream, isLoading } = useQuery({
    queryKey: ['daily-dream-card', new Date().toISOString().slice(0, 10)],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dreams')
        .select('id, title, slug, content, view_count, like_count')
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
    return <section className="container py-8"><div className="h-64 animate-pulse rounded-3xl bg-muted" /></section>;
  }

  if (!dream) return null;

  return (
    <section className="container py-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-violet-500/20 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-rose-500 p-6 text-white shadow-2xl shadow-violet-500/20 md:p-8">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <Badge className="mb-4 border-white/30 bg-white/15 text-white hover:bg-white/20">
              <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
              Günün Rüya Kartı
            </Badge>
            <h2 className="font-serif-dream text-3xl font-bold md:text-4xl">{dream.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/85 md:text-base">{plainExcerpt(dream.content)}...</p>
            <div className="mt-5 flex flex-wrap gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" />{dream.view_count || 0} görüntülenme</span>
              <span className="flex items-center gap-1.5"><Heart className="h-4 w-4" />{dream.like_count || 0} beğeni</span>
            </div>
          </div>
          <Button asChild size="lg" className="rounded-2xl bg-white text-violet-700 hover:bg-white/90">
            <Link to={`/ruya/${dream.slug}`}>
              <Sparkles className="mr-2 h-4 w-4" />
              Kartı Aç
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
