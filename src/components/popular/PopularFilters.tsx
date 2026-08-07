import { motion } from 'framer-motion';
import { Search, Clock, Filter, Grid3X3, List, BarChart3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Category } from '@/types/database';
import type { TimeFilter, ViewMode } from '@/lib/popular';

const timeFilterLabels: Record<TimeFilter, string> = {
  all: 'Tüm Zamanlar',
  today: 'Bugün',
  week: 'Bu Hafta',
  month: 'Bu Ay',
  year: 'Bu Yıl',
};

interface PopularFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  timeFilter: TimeFilter;
  onTimeFilterChange: (value: TimeFilter) => void;
  selectedCategory: string;
  onSelectedCategoryChange: (value: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
  categories: Record<string, Category>;
}

export function PopularFilters({
  searchQuery,
  onSearchChange,
  timeFilter,
  onTimeFilterChange,
  selectedCategory,
  onSelectedCategoryChange,
  viewMode,
  onViewModeChange,
  categories,
}: PopularFiltersProps) {
  const selectedCategoryData = selectedCategory !== 'all' ? categories[selectedCategory] : null;
  const hasActiveFilters = searchQuery || timeFilter !== 'all' || selectedCategory !== 'all';

  const clearFilters = () => {
    onSearchChange('');
    onTimeFilterChange('all');
    onSelectedCategoryChange('all');
  };

  return (
    <>
      {/* Sticky Filters Bar */}
      <div className="sticky top-16 z-30 bg-background/70 backdrop-blur-xl border border-border/40 rounded-2xl p-3 mb-6 shadow-lg shadow-black/5">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Popüler rüyalarda ara..."
              aria-label="Popüler rüyalarda ara"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:bg-background focus-visible:border-primary/30 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={timeFilter} onValueChange={(v) => onTimeFilterChange(v as TimeFilter)}>
              <SelectTrigger className="w-[150px] h-11 rounded-xl bg-muted/30 border-border/50">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {Object.entries(timeFilterLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={onSelectedCategoryChange}>
              <SelectTrigger className="w-[240px] h-11 rounded-xl bg-muted/30 border-border/50">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
                {selectedCategoryData ? (
                  <>
                    <CategoryIcon icon={selectedCategoryData.icon} className="h-4 w-4 text-foreground mr-1.5 shrink-0" />
                    <span className="truncate">{selectedCategoryData.name}</span>
                  </>
                ) : (
                  <>
                    <span className="text-base leading-none mr-1.5">🌙</span>
                    <SelectValue placeholder="Tüm Kategoriler" />
                  </>
                )}
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">
                  <span className="text-base leading-none mr-2">🌙</span>
                  <span>Tüm Kategoriler</span>
                </SelectItem>
                {Object.values(categories).map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <CategoryIcon icon={category.icon} className="h-4 w-4 text-foreground" />
                    <span>{category.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center border border-border/50 rounded-xl overflow-hidden bg-muted/30">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                aria-label="Izgara görünümü"
                onClick={() => onViewModeChange('grid')}
                className={`h-11 w-11 rounded-none ${
                  viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                aria-label="Liste görünümü"
                onClick={() => onViewModeChange('list')}
                className={`h-11 w-11 rounded-none ${
                  viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Active filters */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 mb-6 text-sm text-muted-foreground flex-wrap"
        >
          <BarChart3 className="h-4 w-4" />
          <span className="text-xs font-medium">Filtreler:</span>
          {timeFilter !== 'all' && (
            <Badge variant="secondary" className="rounded-full text-xs">
              {timeFilterLabels[timeFilter]}
            </Badge>
          )}
          {selectedCategory !== 'all' && (
            <Badge variant="secondary" className="rounded-full text-xs gap-1">
              <CategoryIcon icon={categories[selectedCategory]?.icon} className="h-3 w-3" />
              {categories[selectedCategory]?.name}
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="secondary" className="rounded-full text-xs">
              "{searchQuery}"
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs rounded-full text-muted-foreground hover:text-foreground"
          >
            Temizle
          </Button>
        </motion.div>
      )}
    </>
  );
}
