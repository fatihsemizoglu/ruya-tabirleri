import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { symbolsApi } from '@/lib/api/features';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Moon, MapPin, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CulturalMapPage() {
  const { data: culturesResponse } = useQuery({
    queryKey: ['cultures'],
    queryFn: () => symbolsApi.getCultures(),
  });

  const { data: ottomanResponse } = useQuery({
    queryKey: ['ottoman-interpretations'],
    queryFn: () => symbolsApi.getOttomanInterpretations(1),
  });

  const cultures = culturesResponse?.data || [];
  const ottoman = ottomanResponse?.data || [];

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif font-bold flex items-center gap-3">
            <Globe className="h-8 w-8 text-primary" />
            Dünya Rüya Haritası
          </h1>
          <p className="text-muted-foreground mt-2">
            Farklı kültürlerin ve medeniyetlerin rüya yorumlarını keşfedin.
          </p>
        </div>

        <Tabs defaultValue="cultures">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="cultures">Kültürler</TabsTrigger>
            <TabsTrigger value="ottoman">Osmanlı</TabsTrigger>
            <TabsTrigger value="compare">Karşılaştır</TabsTrigger>
          </TabsList>

          <TabsContent value="cultures" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cultures.map((culture: any) => (
                <Link key={culture.culture_code} to={`/harita/${culture.culture_code}`}>
                  <Card className="hover:shadow-md transition-all cursor-pointer group h-full">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {culture.culture_name}
                          </h3>
                          {culture.region && (
                            <p className="text-xs text-muted-foreground">{culture.region}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="ottoman" className="mt-6">
            <div className="mb-6">
              <h3 className="text-xl font-serif font-semibold flex items-center gap-2 mb-2">
                <Moon className="h-5 w-5 text-amber-600" />
                Osmanlı Rüya Tabirleri
              </h3>
              <p className="text-muted-foreground">
                Tarihi Osmanlı kaynaklarından derlenen rüya yorumları.
              </p>
            </div>
            <div className="grid gap-4">
              {ottoman.map((item: any) => (
                <Card key={item.id} className="border-amber-200/50">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-lg">{item.symbol_name}</h4>
                      {item.era && <Badge variant="outline">{item.era}</Badge>}
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{item.interpretation}</p>
                    {item.source_book && (
                      <p className="text-xs text-muted-foreground mt-3">
                        <BookOpen className="inline h-3 w-3 mr-1" />
                        {item.source_book} {item.source_author ? `- ${item.source_author}` : ''}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="compare" className="mt-6">
            <CompareView />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

function CompareView() {
  const [symbol, setSymbol] = useState('');

  const { data: response, refetch, isFetching } = useQuery({
    queryKey: ['compare-symbol', symbol],
    queryFn: () => symbolsApi.compareSymbol(symbol),
    enabled: false,
  });

  const handleSearch = () => {
    if (symbol.trim()) refetch();
  };

  const results = response?.data;

  return (
    <div className="space-y-6">
      <div className="flex gap-2 max-w-md">
        <input
          type="text"
          placeholder="Sembol adı girin (örn: su, yangın, yılan)"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-4 py-2 rounded-lg border bg-background"
        />
        <Button onClick={handleSearch} disabled={isFetching || !symbol.trim()}>
          Karşılaştır
        </Button>
      </div>

      {results && (
        <div className="space-y-6">
          {results.ottoman?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Moon className="h-4 w-4 text-amber-600" /> Osmanlı
              </h4>
              {results.ottoman.map((item: any) => (
                <Card key={item.id} className="mb-2 border-amber-200/50">
                  <CardContent className="p-4">
                    <p className="text-sm">{item.interpretation}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {results.cultural?.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-600" /> Dünya Kültürleri
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {results.cultural.map((item: any) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <Badge variant="secondary" className="mb-2">{item.culture_name}</Badge>
                      <p className="text-sm">{item.interpretation}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {results.ottoman?.length === 0 && results.cultural?.length === 0 && (
            <p className="text-muted-foreground text-center py-8">
              Bu sembol için henüz karşılaştırmalı yorum bulunmuyor.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
