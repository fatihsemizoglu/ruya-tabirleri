import { motion } from 'framer-motion';
import {
  Search, Filter, SlidersHorizontal, Grid3X3, List, Tag, Star,
  TrendingUp, Clock, Heart, X,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SortOption, ViewMode } from '@/lib/category';

interface CategoryFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
  showFeaturedOnly: boolean;
  onFeaturedChange: (checked: boolean) => void;
  selectedKeywords: string[];
  onToggleKeyword: (keyword: string) => void;
  onClearAll: () => void;
  allKeywords: string[];
  activeFilterCount: number;
}

export function CategoryFilters({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  showFeaturedOnly,
  onFeaturedChange,
  selectedKeywords,
  onToggleKeyword,
  onClearAll,
  allKeywords,
  activeFilterCount,
}: CategoryFiltersProps) {
  const hasActiveFilters = activeFilterCount > 0 || !!searchQuery;

  return (
    <section className="sticky top-16 z-40 bg-background/70 backdrop-blur-xl border-y border-border/40 -mx-4 px-4 mb-8 shadow-lg shadow-black/5">
      <div className="container py-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Bu kategoride ara..."
              aria-label="Bu kategoride ara"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-11 h-11 rounded-xl border-border/50 bg-muted/30 focus-visible:bg-background focus-visible:border-primary/30 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="h-11 rounded-xl relative border-border/50 bg-muted/30">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrele
                  {activeFilterCount > 0 && (
                    <Badge className="ml-2 h-5 min-w-5 px-1.5 flex items-center justify-center text-xs rounded-full">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-xl" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Filtreler</h4>
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={onClearAll} className="rounded-lg">
                        Temizle
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id="featured"
                      checked={showFeaturedOnly}
                      onCheckedChange={(checked) => onFeaturedChange(checked as boolean)}
                    />
                    <label htmlFor="featured" className="text-sm flex items-center gap-2 cursor-pointer flex-1">
                      <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                      Sadece Öne Çıkanlar
                    </label>
                  </div>

                  {allKeywords.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium px-2">
                        <Tag className="h-4 w-4" />
                        Anahtar Kelimeler
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                        {allKeywords.map(keyword => (
                          <div key={keyword} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <Checkbox
                              id={`keyword-${keyword}`}
                              checked={selectedKeywords.includes(keyword)}
                              onCheckedChange={() => onToggleKeyword(keyword)}
                            />
                            <label htmlFor={`keyword-${keyword}`} className="text-sm cursor-pointer flex-1">
                              {keyword}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
              <SelectTrigger className="h-11 rounded-xl w-[180px] border-border/50 bg-muted/30">
                <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="popular">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    En Popüler
                  </div>
                </SelectItem>
                <SelectItem value="newest">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    En Yeni
                  </div>
                </SelectItem>
                <SelectItem value="oldest">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    En Eski
                  </div>
                </SelectItem>
                <SelectItem value="most-liked">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    En Beğenilen
                  </div>
                </SelectItem>
                <SelectItem value="alphabetical">
                  <div className="flex items-center gap-2">
                    <List className="h-4 w-4" />
                    A-Z Sırala
                  </div>
                </SelectItem>
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

        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-border/40"
          >
            <span className="text-xs text-muted-foreground font-medium">Aktif:</span>
            {showFeaturedOnly && (
              <Badge variant="secondary" className="rounded-full gap-1 pr-1">
                <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                Öne Çıkanlar
                <button
                  onClick={() => onFeaturedChange(false)}
                  aria-label="Öne çıkanlar filtresini kaldır"
                  className="-m-1.5 ml-1 flex h-11 w-11 items-center justify-center rounded-full hover:bg-destructive/10 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedKeywords.map(keyword => (
              <Badge key={keyword} variant="secondary" className="rounded-full gap-1 pr-1">
                {keyword}
                <button onClick={() => onToggleKeyword(keyword)} aria-label={`${keyword} filtresini kaldır`} className="-m-1.5 ml-1 flex h-11 w-11 items-center justify-center rounded-full hover:bg-destructive/10 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {searchQuery && (
              <Badge variant="secondary" className="rounded-full gap-1 pr-1">
                "{searchQuery}"
                <button onClick={() => onSearchChange('')} aria-label="Arama filtresini kaldır" className="-m-1.5 ml-1 flex h-11 w-11 items-center justify-center rounded-full hover:bg-destructive/10 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={onClearAll} className="rounded-lg text-xs text-muted-foreground hover:text-foreground">
              Tümünü Temizle
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
