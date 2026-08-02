import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Seo } from '@/components/Seo';
import { supabase } from '@/integrations/supabase/client';
import { buildSymbolGlossary, groupSymbolsByLetter } from '@/lib/symbols';
import { absoluteUrl } from '@/lib/site';
import { BookOpen, ChevronRight } from 'lucide-react';
import type { Dream } from '@/types/database';
import { queryKeys } from '@/lib/query/client';

export default function Symbols() {
  const { data: dreams = [], isLoading } = useQuery({
    queryKey: queryKeys.symbols.index,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dreams')
        .select('id,title,keywords')
        .eq('is_published', true)
        .order('view_count', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Pick<Dream, 'id' | 'title' | 'keywords'>[];
    },
    staleTime: 60_000,
  });

  const glossary = useMemo(() => buildSymbolGlossary(dreams as Dream[]), [dreams]);
  const groups = useMemo(() => groupSymbolsByLetter(glossary), [glossary]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    name: 'Rüya Sembolleri Sözlüğü',
    url: absoluteUrl('/semboller'),
    inLanguage: 'tr-TR',
    description: 'Rüya tabirlerinde geçen sembollerin tematik sözlüğü.',
    terms: glossary.slice(0, 200).map(({ term, slug, count }) => ({
      '@type': 'DefinedTerm',
      name: term,
      url: absoluteUrl(`/sembol/${slug}`),
      inDefinedTermSet: absoluteUrl('/semboller'),
      joinAdoptionNumber: count,
    })),
  };

  return (
    <Layout>
      <Seo
        title="Rüya Sembolleri Sözlüğü"
        description="Rüyalardaki sembollerin tabirlerine alfabetik sözlükten ulaşın. İslami ve psikolojik yorumlarla sembol anlamlarını keşfedin."
        path="/semboller"
        jsonLd={jsonLd}
      />
      <div className="min-h-screen container py-10 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-serif-dream font-bold">Rüya Sembolleri Sözlüğü</h1>
            <p className="text-sm text-muted-foreground">{glossary.length.toLocaleString('tr-TR')} sembol alfabetik sıralı</p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Sözlük yükleniyor...</p>
        ) : (
          <div className="space-y-8">
            {[...groups.entries()].map(([letter, items]) => (
              <section key={letter} aria-label={`${letter} harfi semboller`}>
                <h2 className="text-xl font-semibold mb-3 sticky top-16 bg-background py-1">
                  {letter}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {items.map(({ term, slug, count }) => (
                    <Link
                      key={slug}
                      to={`/sembol/${slug}`}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-surface px-3 py-2 text-sm hover:bg-gradient-to-r hover:from-violet-500/10 hover:to-fuchsia-500/10 hover:border-primary/40 transition"
                    >
                      <span className="truncate font-medium">{term}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        {count}
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
