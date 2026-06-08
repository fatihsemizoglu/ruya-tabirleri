import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  badge?: ReactNode;
  action?: ReactNode;
}

export function AdminPageHeader({ title, description, icon: Icon, badge, action }: AdminPageHeaderProps) {
  return (
    <div className="relative overflow-hidden bg-card border border-border/50 rounded-2xl p-6 md:p-8 shadow-xl shadow-violet-950/5 mb-8">
      {/* Gradient accents */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.6) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Content Wrapper */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-start md:items-center gap-4">
          {/* Icon Box */}
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-fuchsia-500/25 flex-shrink-0">
            <Icon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              <span className="bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
                {title}
              </span>
            </h2>
            {description && (
              <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
          {badge && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 text-xs font-semibold backdrop-blur-sm shadow-sm select-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
              </span>
              {badge}
            </div>
          )}
          {action}
        </div>
      </div>
    </div>
  );
}
