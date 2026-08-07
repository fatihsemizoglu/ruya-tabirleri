import { Link } from 'react-router-dom';
import { RotateCw, Star, Eye, Heart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SearchResultCard } from '@/components/search/SearchResultCard';
import { popularSearches } from '@/lib/search-data';
import type { DreamSearchResult, Category } from '@/types/database';
import type { ViewMode } from '@/lib/search-data';
import type { RefObject } from 'react';

interface SearchResultsProps {
  results: DreamSearchResult[];
  viewMode: ViewMode;
  isLoading: boolean;
  query: string;
  currentPage: number;
  totalPages: number;
  infiniteScroll: boolean;
  loadMoreLoading: boolean;
  loadMoreRef: RefObject<HTMLDivElement>;
  relatedDreams: DreamSearchResult[];
  categories: Category[];
  activeFilterCount: number;
  onPageChange: (page: number) => void;
  onClearFilters: () => void;
  onPopularSearch: (term: string) => void;
}

function ResultSkeleton({ viewMode }: { viewMode: ViewMode }) {
  return (
    <div className={viewMode === 'grid'
      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4"
      : "space-y-2.5"
    }>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-2xl border bg-card/80 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <Skeleton className="h-5 w-24 rounded-full" />
            <Skeleton className="h-5 w-12 rounded-full" />
          </div>
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-5 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function SearchResults({
  results,
  viewMode,
  isLoading,
  query,
  currentPage,
  totalPages,
  infiniteScroll,
  loadMoreLoading,
  loadMoreRef,
  relatedDreams,
  categories,
  activeFilterCount,
  onPageChange,
  onClearFilters,
  onPopularSearch,
}: SearchResultsProps) {
  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || '';
  };

  const getCategoryIconValue = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.icon || '📖';
  };

  const goToPage = (page: number) => {
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex-1 min-w-0">
      {/* Results */}
      {isLoading ? (
        <ResultSkeleton viewMode={viewMode} />
      ) : results.length > 0 ? (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 md:gap-3 xl:grid-cols-3">
              {results.map((dream, index) => (
                <SearchResultCard
                  key={dream.id}
                  dream={dream}
                  index={index}
                  viewMode={viewMode}
                  categoryName={getCategoryName(dream.category_id || '')}
                  categoryIconValue={getCategoryIconValue(dream.category_id || '')}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {results.map((dream, index) => (
                <SearchResultCard
                  key={dream.id}
                  dream={dream}
                  index={index}
                  viewMode={viewMode}
                  categoryName={getCategoryName(dream.category_id || '')}
                  categoryIconValue={getCategoryIconValue(dream.category_id || '')}
                />
              ))}
            </div>
          )}

          {/* Infinite Scroll Load More Trigger */}
          {infiniteScroll && totalPages > 1 && currentPage < totalPages && (
            <div
              ref={loadMoreRef}
              className="mt-10 flex items-center justify-center gap-3"
            >
              {loadMoreLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RotateCw className="h-5 w-5 animate-spin" />
                  <span>Daha fazla yükleniyor...</span>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                className="rounded-lg"
              >
                Önceki
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let page = i + 1;
                  if (totalPages > 7) {
                    if (currentPage > 4) page = currentPage - 3 + i;
                    if (currentPage > totalPages - 4) page = totalPages - 6 + i;
                  }
                  if (page < 1 || page > totalPages) return null;
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => goToPage(page)}
                      className="rounded-lg min-w-9"
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                className="rounded-lg"
              >
                Sonraki
              </Button>
              <span className="text-xs text-muted-foreground ml-2 hidden sm:inline">
                Sayfa {currentPage} / {totalPages}
              </span>
            </div>
          )}

          {/* Related Dreams Section */}
          {relatedDreams.length > 0 && results.length < 6 && currentPage === 1 && (
            <div className="mt-12 pt-8 border-t">
              <div className="flex items-center gap-2 mb-6">
                <Star className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-serif font-semibold">Popüler Rüyalar</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedDreams.filter(d => !results.some(r => r.id === d.id)).slice(0, 3).map((dream) => (
                  <Link
                    key={dream.id}
                    to={`/ruya/${dream.slug}`}
                    className="group p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <h4 className="font-medium mb-2 group-hover:text-primary transition-colors line-clamp-1">
                      {dream.title}
                    </h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {(dream.view_count || 0).toLocaleString('tr-TR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {(dream.like_count || 0).toLocaleString('tr-TR')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          icon="search"
          title="Sonuç bulunamadı"
          description={`"${query}" için eşleşen rüya tabiri bulunamadı.${activeFilterCount > 0 ? ' Filtreleri temizlemeyi deneyin.' : ''}`}
          action={activeFilterCount > 0 ? {
            label: 'Filtreleri Temizle',
            onClick: onClearFilters
          } : undefined}
        >
          <div className="max-w-md mx-auto">
            <p className="text-sm text-muted-foreground mb-3">Bunları da deneyebilirsiniz:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {popularSearches.slice(0, 6).map((term) => (
                <button
                  key={term}
                  onClick={() => onPopularSearch(term)}
                  className="inline-flex items-center min-h-11 px-3 py-1.5 text-sm rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </EmptyState>
      )}
    </div>
  );
}
