import { useState, useMemo } from 'react';
import { 
  SlidersHorizontal, Star, TrendingUp, Eye, Heart, X, Check, 
  ChevronDown, Filter, Tag, Sparkles 
} from 'lucide-react';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { Category } from '@/types/database';

export interface AdvancedFilterState {
  showFeaturedOnly: boolean;
  selectedCategories: string[];
  minViews: number;
  minLikes: number;
  sortBy: 'relevance' | 'views' | 'likes' | 'newest';
}

interface AdvancedFiltersProps {
  filters: AdvancedFilterState;
  onChange: (filters: AdvancedFilterState) => void;
  categories: Category[];
  maxViews?: number;
  maxLikes?: number;
}

export function AdvancedFilters({ 
  filters, 
  onChange, 
  categories, 
  maxViews = 1000, 
  maxLikes = 500 
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['categories']);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.showFeaturedOnly) count++;
    if (filters.selectedCategories.length > 0) count += filters.selectedCategories.length;
    if (filters.minViews > 0) count++;
    if (filters.minLikes > 0) count++;
    if (filters.sortBy !== 'relevance') count++;
    return count;
  }, [filters]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };

  const toggleCategory = (categoryId: string) => {
    onChange({
      ...filters,
      selectedCategories: filters.selectedCategories.includes(categoryId)
        ? filters.selectedCategories.filter(id => id !== categoryId)
        : [...filters.selectedCategories, categoryId]
    });
  };

  const clearAllFilters = () => {
    onChange({
      showFeaturedOnly: false,
      selectedCategories: [],
      minViews: 0,
      minLikes: 0,
      sortBy: 'relevance'
    });
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || '';
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Featured Dreams Toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-medium">Öne Çıkan Rüyalar</div>
            <div className="text-xs text-muted-foreground">Sadece editör seçimi rüyaları göster</div>
          </div>
        </div>
        <Checkbox
          checked={filters.showFeaturedOnly}
          onCheckedChange={(checked) => 
            onChange({ ...filters, showFeaturedOnly: checked as boolean })
          }
        />
      </div>

      {/* Category Filter */}
      <Collapsible 
        open={expandedSections.includes('categories')}
        onOpenChange={() => toggleSection('categories')}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-muted transition-colors">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <span className="font-medium">Kategoriler</span>
            {filters.selectedCategories.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filters.selectedCategories.length}
              </Badge>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.includes('categories') ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="grid grid-cols-2 gap-2 max-h-[200px] overflow-y-auto p-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={`flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${
                  filters.selectedCategories.includes(category.id)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                <CategoryIcon icon={category.icon} className="h-4 w-4" />
                <span className="truncate">{category.name}</span>
                {filters.selectedCategories.includes(category.id) && (
                  <Check className="h-4 w-4 ml-auto shrink-0" />
                )}
              </button>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Popularity Range */}
      <Collapsible 
        open={expandedSections.includes('popularity')}
        onOpenChange={() => toggleSection('popularity')}
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-muted transition-colors">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">Popülerlik</span>
            {(filters.minViews > 0 || filters.minLikes > 0) && (
              <Badge variant="secondary" className="ml-2">Aktif</Badge>
            )}
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${expandedSections.includes('popularity') ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-6 px-1">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Minimum Görüntüleme
              </Label>
              <span className="text-sm font-medium text-primary">
                {filters.minViews > 0 ? `${filters.minViews}+` : 'Tümü'}
              </span>
            </div>
            <Slider
              value={[filters.minViews]}
              onValueChange={([value]) => onChange({ ...filters, minViews: value })}
              max={maxViews}
              step={50}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>{maxViews}+</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                Minimum Beğeni
              </Label>
              <span className="text-sm font-medium text-primary">
                {filters.minLikes > 0 ? `${filters.minLikes}+` : 'Tümü'}
              </span>
            </div>
            <Slider
              value={[filters.minLikes]}
              onValueChange={([value]) => onChange({ ...filters, minLikes: value })}
              max={maxLikes}
              step={10}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>{maxLikes}+</span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Sort Options */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Sıralama
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'relevance', label: 'İlgililik', icon: Star },
            { value: 'views', label: 'Görüntüleme', icon: Eye },
            { value: 'likes', label: 'Beğeni', icon: Heart },
            { value: 'newest', label: 'En Yeni', icon: TrendingUp },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onChange({ ...filters, sortBy: value as AdvancedFilterState['sortBy'] })}
              className={`flex items-center gap-2 p-3 rounded-lg text-sm transition-colors ${
                filters.sortBy === value
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted border'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Clear All */}
      {activeFilterCount > 0 && (
        <Button 
          variant="outline" 
          className="w-full" 
          onClick={clearAllFilters}
        >
          <X className="h-4 w-4 mr-2" />
          Tüm Filtreleri Temizle ({activeFilterCount})
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <div className="sticky top-24 p-4 rounded-xl border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              Filtreler
            </h3>
            {activeFilterCount > 0 && (
              <Badge>{activeFilterCount} aktif</Badge>
            )}
          </div>
          <FilterContent />
        </div>
      </div>

      {/* Mobile Filters Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="lg:hidden relative">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filtreler
            {activeFilterCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[85vh]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5" />
              Gelişmiş Filtreler
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 overflow-y-auto max-h-[calc(85vh-100px)]">
            <FilterContent />
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="flex-1" onClick={clearAllFilters}>
              Temizle
            </Button>
            <Button className="flex-1" onClick={() => setIsOpen(false)}>
              Sonuçları Gör
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 lg:hidden mt-4">
          {filters.showFeaturedOnly && (
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="h-3 w-3" />
              Öne Çıkan
              <button onClick={() => onChange({ ...filters, showFeaturedOnly: false })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.selectedCategories.map(categoryId => (
            <Badge key={categoryId} variant="secondary" className="gap-1">
              <Tag className="h-3 w-3" />
              {getCategoryName(categoryId)}
              <button onClick={() => toggleCategory(categoryId)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.minViews > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Eye className="h-3 w-3" />
              {filters.minViews}+ görüntüleme
              <button onClick={() => onChange({ ...filters, minViews: 0 })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.minLikes > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Heart className="h-3 w-3" />
              {filters.minLikes}+ beğeni
              <button onClick={() => onChange({ ...filters, minLikes: 0 })}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </>
  );
}
