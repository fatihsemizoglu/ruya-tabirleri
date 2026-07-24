import { Link } from 'react-router-dom';
import { ArrowLeftRight, Eye, Heart, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useDreamCompare } from '@/hooks/useDreamCompare';
import { Seo } from '@/components/Seo';

type CompareDream = {
  id: string;
  title: string;
  slug: string;
  content: string;
  view_count: number | null;
  like_count: number | null;
  keywords: string[] | null;
  categories?: { name: string; slug: string } | null;
};

function excerpt(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 360);
}

export default function DreamCompare() {
  const { ids, remove, clear } = useDreamCompare();
  const { data: dreams = [], isLoading } = useQuery({
    queryKey: ['dream-compare', ids],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const { data, error } = await supabase
        .from('dreams')
        .select('id, title, slug, content, view_count, like_count, keywords, categories(name, slug)')
        .in('id', ids)
        .eq('is_published', true);
      if (error) throw error;
      return (data || []) as CompareDream[];
    },
    enabled: ids.length > 0,
  });

  const orderedDreams = ids.map((id) => dreams.find((dream) => dream.id === id)).filter(Boolean) as CompareDream[];

  return (
    <Layout>
      <Seo title="Rüya Karşılaştırma" description="Seçtiğiniz rüya tabirlerini yan yana karşılaştırın." path="/karsilastir" />
      <div className="container py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant="outline" className="mb-3 gap-1.5"><ArrowLeftRight className="h-3.5 w-3.5" /> Karşılaştırma</Badge>
            <h1 className="font-serif-dream text-3xl font-bold md:text-4xl">Rüya Karşılaştırma</h1>
            <p className="mt-2 text-muted-foreground">En fazla 3 rüya tabirini anlam, kategori ve popülerlik açısından karşılaştırın.</p>
          </div>
          {ids.length > 0 && <Button variant="outline" onClick={clear}>Listeyi Temizle</Button>}
        </div>

        {ids.length === 0 ? (
          <Card className="p-10 text-center">
            <ArrowLeftRight className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="text-xl font-bold">Karşılaştırma listeniz boş</h2>
            <p className="mt-2 text-muted-foreground">Rüya detay sayfalarından “Karşılaştır” butonuyla listeye ekleyebilirsiniz.</p>
            <Button asChild className="mt-6"><Link to="/populer">Popüler Rüyalara Git</Link></Button>
          </Card>
        ) : isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ids.map((id) => <div key={id} className="h-80 animate-pulse rounded-3xl bg-muted" />)}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {orderedDreams.map((dream) => (
              <Card key={dream.id} className="flex flex-col p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <Link to={`/ruya/${dream.slug}`} className="font-serif-dream text-xl font-bold hover:text-primary">{dream.title}</Link>
                    {dream.categories && <p className="mt-1 text-sm text-muted-foreground">{dream.categories.name}</p>}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(dream.id)} aria-label="Karşılaştırmadan çıkar">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mb-4 flex gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-4 w-4" />{dream.view_count || 0}</span>
                  <span className="flex items-center gap-1"><Heart className="h-4 w-4" />{dream.like_count || 0}</span>
                </div>
                <p className="mb-4 flex-1 text-sm leading-7 text-muted-foreground">{excerpt(dream.content)}...</p>
                {dream.keywords && dream.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {dream.keywords.slice(0, 8).map((keyword) => <Badge key={keyword} variant="secondary">{keyword}</Badge>)}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
