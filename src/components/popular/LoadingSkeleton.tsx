import { Skeleton } from '@/components/ui/skeleton';
import type { ViewMode } from '@/lib/popular';

export function LoadingSkeleton({ viewMode }: { viewMode: ViewMode }) {
  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2' : 'space-y-1'}>
      {Array.from({ length: 14 }).map((_, i) =>
        viewMode === 'grid' ? (
          <div key={i} className="bg-card border border-border/30 rounded-lg p-2.5">
            <div className="flex items-start gap-2">
              <Skeleton className="h-5 w-5 rounded shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2 w-2/3" />
              </div>
            </div>
          </div>
        ) : (
          <div key={i} className="flex items-center gap-2.5 px-1 py-2 border-b border-border/10">
            <Skeleton className="h-5 w-5 rounded shrink-0" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-2 w-16 hidden sm:block" />
          </div>
        )
      )}
    </div>
  );
}
