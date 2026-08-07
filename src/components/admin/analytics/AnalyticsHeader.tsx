import { Sparkles, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AnalyticsHeaderProps {
  timeRange: string;
  onTimeRangeChange: (value: string) => void;
}

export function AnalyticsHeader({ timeRange, onTimeRangeChange }: AnalyticsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium mb-2">
          <Sparkles className="w-3 h-3" />
          Gelişmiş Analitik
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          İçerik ROI, Arama Niyeti ve Segmentasyon
        </h2>
        <p className="text-muted-foreground">
          Detaylı performans, kullanıcı davranışı ve gerçek zamanlı metrikler
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Select value={timeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger className="w-[160px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Son 24 saat</SelectItem>
            <SelectItem value="7">Son 7 gün</SelectItem>
            <SelectItem value="30">Son 30 gün</SelectItem>
            <SelectItem value="90">Son 90 gün</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
