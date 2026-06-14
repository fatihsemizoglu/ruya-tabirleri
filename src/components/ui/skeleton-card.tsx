import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
  showAccentBar?: boolean;
}

export function SkeletonCard({ className, showAccentBar = true }: SkeletonCardProps) {
  return (
    <div className={cn('rounded-2xl border border-border/60 bg-card p-6 shadow-sm relative overflow-hidden', className)}>
      {showAccentBar && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-pink-500/20" />
      )}
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-6 w-3/4 mb-3" />
      <div className="space-y-2 mb-5">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4, className, columns = 4 }: { count?: number; className?: string; columns?: 1 | 2 | 3 | 4 }) {
  const cols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className={cn('grid gap-6', cols, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} showAccentBar={false} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-violet-500/5 via-fuchsia-500/5 to-pink-500/5 p-4 border-b border-border/60">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-4 rounded" />
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className={cn('h-4', i === columns - 1 ? 'w-12 ml-auto' : i === 0 ? 'w-32' : 'w-24')} />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border/40">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-24 ml-auto" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="py-20 md:py-28">
      <div className="max-w-4xl mx-auto text-center">
        <Skeleton className="h-8 w-64 mx-auto mb-8 rounded-full" />
        <Skeleton className="h-16 w-3/4 mx-auto mb-4" />
        <Skeleton className="h-16 w-2/3 mx-auto mb-8" />
        <Skeleton className="h-6 w-2/3 mx-auto mb-10" />
        <Skeleton className="h-14 w-full max-w-2xl mx-auto rounded-xl mb-10" />
        <div className="flex flex-wrap justify-center gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonDreamDetail() {
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        <Skeleton className="h-8 w-48 mb-6 rounded-full" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <div className="flex gap-3 mb-8">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonDreamCard({ className }: { className?: string }) {
  return (
    <div className={cn('group rounded-2xl border border-border/60 bg-card p-5 shadow-sm relative overflow-hidden', className)}>
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500/30 via-fuchsia-500/30 to-pink-500/30" />
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-6 w-4/5 mb-3" />
      <div className="space-y-2 mb-5">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-11/12" />
        <Skeleton className="h-3.5 w-3/4" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border/40">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
      </div>
    </div>
  );
}

export function SkeletonBlogCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm', className)}>
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-6 w-4/5 mb-3" />
        <div className="space-y-2 mb-4">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-3.5 w-20" />
          </div>
          <Skeleton className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonAdminRow({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="admin-list-surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 flex-1">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
