import { Skeleton } from '@/components/ui/skeleton';
import { Layout } from '@/components/layout/Layout';

export function CategoryLoading() {
  return (
    <Layout>
      <div className="min-h-screen">
        <div className="container py-12">
          <div className="space-y-8">
            <Skeleton className="h-4 w-32 rounded-full" />
            <div className="flex items-center gap-4">
              <Skeleton className="w-20 h-20 rounded-2xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-10 w-1/2 rounded-xl" />
                <Skeleton className="h-4 w-1/3 rounded-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-5">
                  <Skeleton className="h-10 w-10 rounded-xl mb-3" />
                  <Skeleton className="h-3 w-20 mb-2 rounded-full" />
                  <Skeleton className="h-7 w-16 rounded-lg" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-card/60 backdrop-blur-sm border border-border/40 rounded-2xl p-5">
                  <Skeleton className="h-1 w-full rounded-full mb-4" />
                  <div className="flex items-start justify-between mb-4">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-4/5 mb-3" />
                  <div className="space-y-2 mb-4">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-11/12" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                  <div className="flex gap-1.5 mb-4">
                    <Skeleton className="h-5 w-14 rounded-full" />
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border/40">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
