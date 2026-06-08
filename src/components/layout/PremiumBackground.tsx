import { ReactNode } from 'react';

interface PremiumBackgroundProps {
  variant?: 'default' | 'soft' | 'strong';
  className?: string;
  children?: ReactNode;
}

const variants = {
  soft: {
    blobs: 'opacity-50',
    grid: 'opacity-[0.03] dark:opacity-[0.04]',
  },
  default: {
    blobs: 'opacity-70',
    grid: 'opacity-[0.04] dark:opacity-[0.06]',
  },
  strong: {
    blobs: 'opacity-90',
    grid: 'opacity-[0.05] dark:opacity-[0.08]',
  },
};

export function PremiumBackground({
  variant = 'default',
  className = '',
  children,
}: PremiumBackgroundProps) {
  const v = variants[variant];

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* Gradient mesh blobs */}
      <div className={`absolute inset-0 ${v.blobs}`}>
        <div className="absolute top-1/4 -left-32 w-[480px] h-[480px] bg-violet-500/15 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-20 w-[520px] h-[520px] bg-fuchsia-500/12 rounded-full blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-[420px] h-[420px] bg-pink-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[360px] h-[360px] bg-blue-500/8 rounded-full blur-[110px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className={`absolute inset-0 ${v.grid}`}
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.6) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Mask fade at top so blobs don't crash the header */}
      <div
        className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent"
        aria-hidden
      />

      {children}
    </div>
  );
}

export function PremiumBadge({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-pink-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 text-xs sm:text-sm font-semibold ${className}`}
    >
      {children}
    </div>
  );
}

export function GradientText({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent ${className}`}
    >
      {children}
    </span>
  );
}
