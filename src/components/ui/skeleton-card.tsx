import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-6", className)}>
      <div className="h-1.5 w-full bg-muted rounded-t-2xl -mx-6 -mt-6 mb-6" />
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

export function SkeletonList({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="bg-muted/30 p-4 border-b">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24 ml-auto" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <Skeleton className="h-4 w-4" />
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
        <Skeleton className="h-8 w-48 mb-6" />
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
