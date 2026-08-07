import { useMemo } from 'react';
import { TrendingUp, BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExportButtons } from './ExportButtons';
import { CPM_RATE } from '@/lib/admin-analytics';
import type { ContentROI } from '@/lib/admin-analytics';

type RoiType = 'all' | 'dream' | 'blog';

interface RoiTabProps {
  roiData: ContentROI[] | undefined;
  roiLoading: boolean;
  roiType: RoiType;
  onRoiTypeChange: (value: RoiType) => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
}

export function RoiTab({
  roiData,
  roiLoading,
  roiType,
  onRoiTypeChange,
  onExportCsv,
  onExportPdf,
}: RoiTabProps) {
  const top10ROI = useMemo(() => (roiData || []).slice(0, 10), [roiData]);

  return (
    <TabsContent value="roi" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">İçerik ROI Hesaplayıcı</h3>
          <p className="text-sm text-muted-foreground">
            Her içerik için maliyet vs gelir (CPM ${CPM_RATE} / 1K görüntülenme)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={roiType} onValueChange={(v) => onRoiTypeChange(v as RoiType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="dream">Rüyalar</SelectItem>
              <SelectItem value="blog">Blog</SelectItem>
            </SelectContent>
          </Select>
          <ExportButtons onCsv={onExportCsv} onPdf={onExportPdf} />
        </div>
      </div>

      {roiLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : top10ROI.length === 0 ? (
        <Card className="p-12 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold">Henüz ROI verisi yok</p>
        </Card>
      ) : (
        <>
          <Card className="p-6">
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              En Karlı 10 İçerik
            </h4>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={top10ROI.map(r => ({
                name: r.title.length > 22 ? r.title.slice(0, 22) + '…' : r.title,
                Kâr: Number(r.profit.toFixed(2)),
                Gelir: Number(r.estRevenue.toFixed(2)),
                Maliyet: Number(r.estCost.toFixed(2)),
              }))}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" angle={-30} textAnchor="end" height={70} fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Gelir" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Maliyet" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Kâr" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h4 className="text-sm font-bold mb-4">Tüm İçerikler (İlk 50)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="pb-2 pr-3">Başlık</th>
                    <th className="pb-2 pr-3">Tür</th>
                    <th className="pb-2 pr-3 text-right">Görüntülenme</th>
                    <th className="pb-2 pr-3 text-right">CTR</th>
                    <th className="pb-2 pr-3 text-right">Gelir</th>
                    <th className="pb-2 text-right">Kâr</th>
                    <th className="pb-2 text-right">ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {(roiData || []).slice(0, 50).map(r => (
                    <tr key={`${r.type}-${r.id}`} className="border-b hover:bg-muted/50">
                      <td className="py-2 pr-3 max-w-[260px] truncate font-medium">{r.title}</td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline" className="text-[10px]">
                          {r.type === 'dream' ? 'Rüya' : 'Blog'}
                        </Badge>
                      </td>
                      <td className="py-2 pr-3 text-right">{r.views.toLocaleString('tr-TR')}</td>
                      <td className="py-2 pr-3 text-right">{r.ctr.toFixed(1)}%</td>
                      <td className="py-2 pr-3 text-right text-emerald-600 dark:text-emerald-400">
                        ${r.estRevenue.toFixed(2)}
                      </td>
                      <td className={`py-2 pr-3 text-right font-bold ${r.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ${r.profit.toFixed(2)}
                      </td>
                      <td className="py-2 text-right">
                        <Badge variant={r.roi >= 100 ? 'default' : r.roi > 0 ? 'secondary' : 'destructive'}>
                          {r.roi.toFixed(0)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </TabsContent>
  );
}
