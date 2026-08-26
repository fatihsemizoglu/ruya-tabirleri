import { Skeleton } from '@/components/ui/skeleton';

/** Ana sayfa lazy bölümleri için yer tutucu. */
export function SectionSkeleton() {
  return (
    <section className="container py-20" aria-hidden>
      <div className="mx-auto mb-10 flex flex-col items-center gap-3">
        <Skeleton className="h-6 w-40 rounded-full" />
        <Skeleton className="h-10 w-72" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    </section>
  );
}
