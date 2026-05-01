import { useQuery } from '@tanstack/react-query';
import { symbolsApi } from '@/lib/api/features';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Moon, BookOpen } from 'lucide-react';

export function CulturalComparison({ symbol }: { symbol: string }) {
  const { data: response, isLoading } = useQuery({
    queryKey: ['cultural-comparison', symbol],
    queryFn: () => symbolsApi.compareSymbol(symbol),
    enabled: !!symbol,
  });

  if (isLoading) return <div className="animate-pulse h-48 bg-muted rounded-xl" />;
  if (!response?.data) return null;

  const { cultural, ottoman } = response.data;

  if (cultural.length === 0 && ottoman.length === 0) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-serif font-semibold flex items-center gap-2">
        <Globe className="h-5 w-5" />
        "{symbol}" Sembolünün Farklı Kültürlerdeki Anlamı
      </h3>

      {/* Osmanlı yorumları */}
      {ottoman.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Moon className="h-4 w-4 text-amber-600" />
            Osmanlı Rüya Tabirleri
          </h4>
          <div className="grid gap-3">
            {ottoman.map((item: any) => (
              <Card key={item.id} className="border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/10">
                <CardContent className="p-4">
                  <p className="text-sm leading-relaxed">{item.interpretation}</p>
                  {item.source_book && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Kaynak: {item.source_book} {item.source_author ? `- ${item.source_author}` : ''}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Kültürel yorumlar */}
      {cultural.length > 0 && (
        <div>
          <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            Dünya Kültürleri
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cultural.map((item: any) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{item.culture_name}</Badge>
                    {item.region && (
                      <span className="text-xs text-muted-foreground">{item.region}</span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed">{item.interpretation}</p>
                  {item.source && (
                    <p className="text-xs text-muted-foreground mt-2">Kaynak: {item.source}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
