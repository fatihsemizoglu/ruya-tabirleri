import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Seo } from '@/components/Seo';
import { supabase } from '@/integrations/supabase/client';
import { buildSymbolGlossary } from '@/lib/symbols';
import { absoluteUrl } from '@/lib/site';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { queryKeys } from '@/lib/query/client';
import type { Dream } from '@/types/database';

export default function SymbolDetail() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { data: dreams = [], isLoading } = useQuery({
    queryKey: queryKeys.symbols.detail(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dreams')
        .select('id,title,keywords,slug,content,islamic_interpretation')
        .eq('is_published', true)
        .contains('keywords', [slug.replace(/-/g, ' ')]);
      if (error) throw error;
      return (data ?? []) as Pick<Dream, 'id' | 'title' | 'keywords' | 'slug' | 'content' | 'islamic_interpretation'>[];
    },
    staleTime: 60_000,
  });

  const glossary = useMemo(() => buildSymbolGlossary(dreams as Dream[]), [dreams]);
  const entry = glossary.find((s) => s.slug === slug) ?? null;

  const term = entry?.term ?? slug.replace(/-/g, ' ');
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: term,
    url: absoluteUrl(`/sembol/${slug}`),
    inDefinedTermSet: absoluteUrl('/semboller'),
    inLanguage: 'tr-TR',
    description: `Rüyada "${term}" görmek ne anlama gelir? İslami ve psikolojik yorumlarla "${term}" sembolünün tabiri.`,
  };

  return (
    <Layout>
      <Seo
        title={`Rüyada ${term} Görmek Ne Anlama Gelir?`}
        description={`Rüyada ${term} görmek: İslami ve psikolojik tabirlerle ${term} rüyasının anlamı ve yorumu.`}
        path={`/sembol/${slug}`}
        jsonLd={jsonLd}
      />
      <div className="min-h-screen container py-10 max-w-3xl mx-auto">
        <Link to="/semboller" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Tüm Semboller
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-serif-dream font-bold">{term}</h1>
            <p className="text-sm text-muted-foreground">{entry ? `${entry.count} rüyada geçiyor` : isLoading ? 'Yükleniyor…' : 'Sembol sözlüğü'}</p>
          </div>
        </div>

        {!entry && !isLoading && (
          <p className="text-muted-foreground">Bu sembol için henüz kayıtlı rüya tabiri bulunamadı.</p>
        )}

        {dreams.length > 0 && (
          <ul className="space-y-4">
            {dreams.map((d) => (
              <li key={d.id}>
                <Link
                  to={`/ruya/${d.slug}`}
                  className="block rounded-xl border border-border/60 bg-surface p-4 hover:bg-gradient-to-r hover:from-violet-500/10 hover:to-fuchsia-500/10 transition"
                >
                  <h2 className="font-medium mb-1">{d.title}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {(d.islamic_interpretation ?? d.content).replace(/<[^>]*>/g, ' ').slice(0, 160)}…
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Layout>
  );
}
