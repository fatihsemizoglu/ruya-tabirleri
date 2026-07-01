import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface AdminStatItem {
  label: string;
  value: number;
  subtext: string;
  icon: LucideIcon;
}

interface AdminStatsCardsProps {
  stats: AdminStatItem[];
  className?: string;
}

const iconColorMap: Record<string, string> = {
  violet: 'from-violet-500/15 to-fuchsia-500/15 text-violet-600 dark:text-violet-400 ring-violet-500/20',
  blue: 'from-blue-500/15 to-cyan-500/15 text-blue-600 dark:text-blue-400 ring-blue-500/20',
  emerald: 'from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
  amber: 'from-amber-500/15 to-orange-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/20',
  rose: 'from-rose-500/15 to-pink-500/15 text-rose-600 dark:text-rose-400 ring-rose-500/20',
  indigo: 'from-indigo-500/15 to-violet-500/15 text-indigo-600 dark:text-indigo-400 ring-indigo-500/20',
  slate: 'from-slate-500/15 to-slate-500/10 text-slate-600 dark:text-slate-400 ring-slate-500/20',
};

function pickColor(key: string): string {
  const colors = Object.keys(iconColorMap);
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return colors[hash % colors.length] ?? 'text-primary';
}

export function AdminStatsCards({ stats, className }: AdminStatsCardsProps) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4', className)}>
      {stats.map((stat) => {
        const colorKey = pickColor(stat.label);
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className="relative overflow-hidden p-5 bg-card/80 backdrop-blur-md border border-border/70 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-violet-500/5 to-fuchsia-500/5 blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between gap-3 relative">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2 tabular-nums">
                  {stat.value.toLocaleString('tr-TR')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {stat.subtext}
                </p>
              </div>
              <div
                className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 bg-gradient-to-br shadow-sm',
                  iconColorMap[colorKey]
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={2} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
