import { RotateCw, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ViewMode } from '@/lib/search-data';

interface SearchResultsHeaderProps {
  isLoading: boolean;
  query: string;
  totalCount: number;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  infiniteScroll: boolean;
  onToggleInfiniteScroll: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function SearchResultsHeader({
  isLoading,
  query,
  totalCount,
  hasActiveFilters,
  activeFilterCount,
  infiniteScroll,
  onToggleInfiniteScroll,
  viewMode,
  onViewModeChange,
}: SearchResultsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <p className="text-muted-foreground">
          {isLoading ? (
            'Aranıyor...'
          ) : (
            <>
              <span className="font-medium text-foreground">"{query}"</span> için{' '}
              <span className="font-medium text-foreground">{totalCount}</span> sonuç
              {hasActiveFilters && (
                <span className="text-primary">
                  {' '}({activeFilterCount} filtre aktif)
                </span>
              )}
            </>
          )}
        </p>
      </div>

      <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
        {/* Infinite Scroll Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={infiniteScroll ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-lg"
                onClick={onToggleInfiniteScroll}
                aria-label={infiniteScroll ? 'Sayfalama moduna geç' : 'Sonsuz kaydırmayı etkinleştir'}
              >
                <RotateCw className={`h-4 w-4 ${infiniteScroll ? 'text-primary' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="center">
              {infiniteScroll ? 'Sayfalama modu' : 'Sonsuz kaydırma'}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* View Mode Toggle */}
        <div className="hidden sm:flex border rounded-lg overflow-hidden">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-none"
            onClick={() => onViewModeChange('grid')}
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="rounded-none"
            onClick={() => onViewModeChange('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
