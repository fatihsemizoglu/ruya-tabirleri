import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TabsContent } from '@/components/ui/tabs';
import { ExportButtons } from './ExportButtons';
import { CHART_COLORS } from '@/lib/admin-analytics';
import type { SearchGap } from '@/lib/admin-analytics';

interface IntentTabProps {
  searchGaps: SearchGap[] | undefined;
  gapsLoading: boolean;
  onExportCsv: () => void;
  onExportPdf: () => void;
}

export function IntentTab({ searchGaps, gapsLoading, onExportCsv, onExportPdf }: IntentTabProps) {
  const zeroResultQueries = useMemo(
    () => (searchGaps || []).filter(g => g.results === 0).slice(0, 30),
    [searchGaps]
  );

  const intentBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    (searchGaps || []).forEach(s => {
      map.set(s.intent, (map.get(s.intent) || 0) + s.count);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [searchGaps]);

  const intentHeatmap = useMemo(() => {
    const intent = ['informational', 'transactional', 'navigational'];
    const top = (searchGaps || []).slice(0, 30);
    return intent.map(i => ({
      intent: i,
      data: top.map((q, idx) => ({
        x: idx,
        y: q.intent === i ? q.count : 0,
        query: q.query,
        z: q.count,
      })).filter(d => d.y > 0),
    }));
  }, [searchGaps]);

  return (
    <TabsContent value="intent" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">Arama Niyeti Analizi</h3>
          <p className="text-sm text-muted-foreground">
            Sıfır sonuç aramaları → içerik boşlukları ve kullanıcı niyeti
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons onCsv={onExportCsv} onPdf={onExportPdf} />
        </div>
      </div>

      {gapsLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-6 lg:col-span-1">
            <h4 className="text-sm font-bold mb-3">Niyet Dağılımı</h4>
            {intentBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">Veri yok</p>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={intentBreakdown}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    label={(e) => `${e.name}: ${e.value}`}
                  >
                    {intentBreakdown.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="p-6 lg:col-span-2">
            <h4 className="text-sm font-bold mb-3">Sorgu Yoğunluk Haritası</h4>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart>
                <CartesianGrid />
                <XAxis dataKey="x" name="Sıra" fontSize={11} />
                <YAxis dataKey="y" name="Aranma" fontSize={11} />
                <ZAxis dataKey="z" range={[40, 400]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                {intentHeatmap.map((ih, i) => (
                  <Scatter
                    key={ih.intent}
                    name={ih.intent}
                    data={ih.data}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
                <Legend />
              </ScatterChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      <Card className="p-6">
        <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Sıfır Sonuçlu Aramalar (İçerik Boşlukları)
        </h4>
        {gapsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
          </div>
        ) : zeroResultQueries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Sıfır sonuç arama bulunamadı 🎉
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {zeroResultQueries.map((g, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-amber-50/30 dark:bg-amber-950/10">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{g.query}</p>
                  <p className="text-xs text-muted-foreground">
                    Son: {formatDistanceToNow(new Date(g.lastSearched), { addSuffix: true, locale: tr })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {g.intent}
                  </Badge>
                  <Badge variant="destructive">{g.count}x</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </TabsContent>
  );
}
