import {
  Search, Filter, ArrowUpDown, Calendar, Eye, Heart, SortAsc, Check, X, Grid3X3, List,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import type { Category } from '@/types/database';
import type { SortOption, ViewMode } from '@/lib/favorites';

interface FavoritesFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  favoriteCategories: Category[];
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  viewMode: ViewMode;
  onViewModeChange: (value: ViewMode) => void;
  isSelectionMode: boolean;
  onToggleSelectionMode: () => void;
}

export function FavoritesFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  favoriteCategories,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  isSelectionMode,
  onToggleSelectionMode,
}: FavoritesFilterBarProps) {
  return (
    <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl p-3 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Favorilerde ara..."
            aria-label="Favorilerde ara"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-muted/30 border-border/50 focus-visible:bg-background"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-[170px] h-11 rounded-xl bg-muted/30 border-border/50">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kategoriler</SelectItem>
              {favoriteCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <CategoryIcon icon={category.icon} className="h-4 w-4" /> {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-xl bg-muted/30 border-border/50">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                Sırala
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sıralama</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSortChange('newest')}>
                <Calendar className="h-4 w-4 mr-2" />
                En Yeni
                {sortBy === 'newest' && <Check className="h-4 w-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('oldest')}>
                <Calendar className="h-4 w-4 mr-2" />
                En Eski
                {sortBy === 'oldest' && <Check className="h-4 w-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('views')}>
                <Eye className="h-4 w-4 mr-2" />
                En Çok Görüntülenen
                {sortBy === 'views' && <Check className="h-4 w-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('likes')}>
                <Heart className="h-4 w-4 mr-2" />
                En Çok Beğenilen
                {sortBy === 'likes' && <Check className="h-4 w-4 ml-auto" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onSortChange('title')}>
                <SortAsc className="h-4 w-4 mr-2" />
                Alfabetik
                {sortBy === 'title' && <Check className="h-4 w-4 ml-auto" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode */}
          <div className="flex items-center border border-border/50 rounded-xl overflow-hidden bg-muted/30">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              aria-label="Izgara görünümü"
              onClick={() => onViewModeChange('grid')}
              className={`rounded-none ${
                viewMode === 'grid' ? 'bg-primary text-primary-foreground' : ''
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              aria-label="Liste görünümü"
              onClick={() => onViewModeChange('list')}
              className={`rounded-none ${
                viewMode === 'list' ? 'bg-primary text-primary-foreground' : ''
              }`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Selection Mode Toggle */}
          <Button
            variant={isSelectionMode ? 'default' : 'outline'}
            className="rounded-xl"
            onClick={onToggleSelectionMode}
          >
            {isSelectionMode ? (
              <>
                <X className="h-4 w-4 mr-2" />
                İptal
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Seç
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
