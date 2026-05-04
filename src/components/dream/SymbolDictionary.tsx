import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { symbolsApi } from '@/lib/api/features';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, BookOpen, Globe, Moon, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SymbolDictionary() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: response, isLoading } = useQuery({
    queryKey: ['symbols', search, page],
    queryFn: () => symbolsApi.getAll(page, 30, search || undefined),
  });

  const symbols = response?.data || [];
  const pagination = response?.pagination;

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Sembol ara... (örn: su, yangın, kuş)"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {symbols.map((symbol: any) => (
            <Link key={symbol.id} to={`/sembol/${symbol.slug}`}>
              <Card className="h-full hover:shadow-md transition-all hover:border-primary/30 cursor-pointer group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-serif font-semibold group-hover:text-primary transition-colors">
                      {symbol.name}
                    </h3>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {symbol.description}
                  </p>
                  <div className="flex gap-2">
                    {symbol.islamic_meaning && (
                      <Badge variant="secondary" className="text-xs">
                        <Moon className="h-3 w-3 mr-1" /> İslami
                      </Badge>
                    )}
                    {symbol.psychological_meaning && (
                      <Badge variant="secondary" className="text-xs">
                        <BookOpen className="h-3 w-3 mr-1" /> Psikolojik
                      </Badge>
                    )}
                    {symbol.cultural_meanings && Object.keys(symbol.cultural_meanings).length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" /> Kültürel
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            Önceki
          </Button>
          <span className="flex items-center px-3 text-sm text-muted-foreground">
            {page} / {pagination.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
            Sonraki
          </Button>
        </div>
      )}
    </div>
  );
}

export function SymbolDetail({ slug }: { slug: string }) {
  const { data: response } = useQuery({
    queryKey: ['symbol', slug],
    queryFn: () => symbolsApi.getBySlug(slug),
  });

  const { data: related } = useQuery({
    queryKey: ['symbol-related', slug],
    queryFn: () => symbolsApi.getRelated(slug),
  });

  const symbol = response?.data;
  if (!symbol) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold mb-4">{symbol.name}</h1>
        <p className="text-lg text-muted-foreground">{symbol.description}</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">Genel</TabsTrigger>
          <TabsTrigger value="islamic">İslami</TabsTrigger>
          <TabsTrigger value="psychological">Psikolojik</TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="mt-4">
          <p className="text-lg leading-relaxed whitespace-pre-wrap">{symbol.description}</p>
        </TabsContent>
        <TabsContent value="islamic" className="mt-4">
          <p className="text-lg leading-relaxed whitespace-pre-wrap">
            {symbol.islamic_meaning || 'Bu sembol için İslami yorum henüz eklenmemiştir.'}
          </p>
        </TabsContent>
        <TabsContent value="psychological" className="mt-4">
          <p className="text-lg leading-relaxed whitespace-pre-wrap">
            {symbol.psychological_meaning || 'Bu sembol için psikolojik yorum henüz eklenmemiştir.'}
          </p>
        </TabsContent>
      </Tabs>

      {symbol.cultural_meanings && Object.keys(symbol.cultural_meanings).length > 0 && (
        <div>
          <h3 className="text-xl font-serif font-semibold mb-4">Kültürel Yorumlar</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(symbol.cultural_meanings).map(([culture, meaning]) => (
              <Card key={culture}>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4" /> {culture}
                  </h4>
                  <p className="text-sm text-muted-foreground">{String(meaning)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {related?.data && related.data.length > 0 && (
        <div>
          <h3 className="text-xl font-serif font-semibold mb-4">İlgili Semboller</h3>
          <div className="flex flex-wrap gap-2">
            {related.data.map((r: any) => (
              <Link key={r.slug} to={`/sembol/${r.slug}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                  {r.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
