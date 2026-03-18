import { cn } from '@/lib/utils';

interface TailAdminCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function TailAdminCard({ children, className, padding = 'md' }: TailAdminCardProps) {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-5 md:p-6',
    lg: 'p-6 md:p-8',
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-gray-200 bg-white',
        'transition-all duration-300',
        'dark:border-gray-800 dark:bg-slate-900/50',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

// Metric Card (Statistics)
interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: 'blue' | 'violet' | 'emerald' | 'orange' | 'amber' | 'cyan' | 'rose';
}

export function MetricCard({ label, value, icon, trend, trendUp, color = 'blue' }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    violet: 'bg-violet-500',
    emerald: 'bg-emerald-500',
    orange: 'bg-orange-500',
    amber: 'bg-amber-500',
    cyan: 'bg-cyan-500',
    rose: 'bg-rose-500',
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 dark:border-gray-800 dark:bg-slate-900/50">
      {/* Icon Container */}
      <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl text-white', colorClasses[color])}>
        {icon}
      </div>

      {/* Content */}
      <div className="mt-5 flex items-end justify-between">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
          <h4 className="mt-2 text-2xl font-bold text-gray-800 dark:text-white">{value}</h4>
        </div>

        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
              trendUp
                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400'
            )}
          >
            {trendUp ? '↑' : '↓'} {trend}
          </span>
        )}
      </div>
    </div>
  );
}

// Page Header
interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
