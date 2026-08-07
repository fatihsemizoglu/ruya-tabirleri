import { Sparkles, CheckCircle2, AlertTriangle, Clock, Crown } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TabsContent } from '@/components/ui/tabs';
import { ExportButtons } from './ExportButtons';
import type { UserSegment } from '@/lib/admin-analytics';

interface SegmentsTabProps {
  userSegments: UserSegment[] | undefined;
  segmentsLoading: boolean;
  onExportCsv: () => void;
  onExportPdf: () => void;
}

const SEGMENT_ICONS: Record<UserSegment['segment'], typeof Sparkles> = {
  'Yeni': Sparkles,
  'Aktif': CheckCircle2,
  'Riskli': AlertTriangle,
  'Churned': Clock,
  'VIP': Crown,
};

export function SegmentsTab({ userSegments, segmentsLoading, onExportCsv, onExportPdf }: SegmentsTabProps) {
  return (
    <TabsContent value="segments" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">Kullanıcı Segmentasyonu (RFM)</h3>
          <p className="text-sm text-muted-foreground">
            Recency, Frequency, Monetary analizine dayalı segmentler
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButtons onCsv={onExportCsv} onPdf={onExportPdf} />
        </div>
      </div>

      {segmentsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {userSegments?.map(seg => {
              const Icon = SEGMENT_ICONS[seg.segment];
              return (
                <Card key={seg.segment} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${seg.color}20`, color: seg.color }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm">{seg.segment}</span>
                  </div>
                  <p className="text-2xl font-bold">{seg.count.toLocaleString('tr-TR')}</p>
                  <p className="text-xs text-muted-foreground">
                    {seg.percentage.toFixed(1)}% kullanıcı
                  </p>
                </Card>
              );
            })}
          </div>

          <Card className="p-6">
            <h4 className="text-sm font-bold mb-3">Segment Dağılımı</h4>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={userSegments || []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="segment" fontSize={12} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" name="Kullanıcı" radius={[6, 6, 0, 0]}>
                  {(userSegments || []).map((s, i) => (
                    <Cell key={i} fill={s.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h4 className="text-sm font-bold mb-3">Segment Bazlı İçerik Önerileri</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {userSegments?.map(seg => (
                <div key={seg.segment} className="p-4 rounded-lg border" style={{ borderColor: `${seg.color}40` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: seg.color }} />
                    <span className="font-bold text-sm">{seg.segment}</span>
                    <Badge variant="outline" className="ml-auto text-[10px]">
                      {seg.count} kullanıcı
                    </Badge>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {seg.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-primary">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </TabsContent>
  );
}
