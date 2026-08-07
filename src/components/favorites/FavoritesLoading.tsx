import { Skeleton } from '@/components/ui/skeleton';
import { Layout } from '@/components/layout/Layout';
import { PremiumBackground } from '@/components/layout/PremiumBackground';
import type { ViewMode } from '@/lib/favorites';

export function FavoritesPageLoading() {
  return (
    <Layout>
      <PremiumBackground variant="soft" className="absolute -top-20" />
      <div className="container py-8 md:py-12 relative">
        <div className="text-center mb-10">
          <Skeleton className="h-8 w-48 mx-auto mb-3" />
          <Skeleton className="h-10 w-72 mx-auto mb-3" />
          <Skeleton className="h-5 w-56 mx-auto" />
        </div>
        <FavoritesGridSkeleton viewMode="grid" />
      </div>
    </Layout>
  );
}

export function FavoritesGridSkeleton({ viewMode }: { viewMode: ViewMode }) {
  return (
    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-3'}>
      {Array.from({ length: 6 }).map((_, i) =>
        viewMode === 'grid' ? (
          <div key={i} className="bg-card border border-border/40 rounded-2xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500/30 via-pink-500/30 to-violet-500/30" />
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
        ) : (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5 bg-card border border-border/40 rounded-xl">
            <Skeleton className="h-9 w-9 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-4/5" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        )
      )}
    </div>
  );
}
