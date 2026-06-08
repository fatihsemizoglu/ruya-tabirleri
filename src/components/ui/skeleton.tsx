import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'shimmer' | 'pulse';
}

function Skeleton({ className, variant = 'shimmer', ...props }: SkeletonProps) {
  if (variant === 'pulse') {
    return (
      <div
        className={cn('animate-pulse rounded-md bg-muted/70', className)}
        {...props}
      />
    );
  }

  if (variant === 'default') {
    return (
      <div
        className={cn('rounded-md bg-muted', className)}
        {...props}
      />
    );
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-md bg-muted/60',
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.6s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/40 after:to-transparent dark:after:via-white/[0.07]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
