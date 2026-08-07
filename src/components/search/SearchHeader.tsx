import { Link } from 'react-router-dom';
import { Sparkles, Layers, TrendingUp } from 'lucide-react';
import { PremiumBadge, GradientText } from '@/components/layout/PremiumBackground';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { SearchAutocomplete } from '@/components/search/SearchAutocomplete';
import { popularSearches } from '@/lib/search-data';
import type { Category } from '@/types/database';
import type { RefObject } from 'react';

interface SearchHeaderProps {
  query: string;
  categories: Category[];
  searchInputRef: RefObject<HTMLInputElement>;
  onSearch: (query: string) => void;
  recentSearches: string[];
  onClearRecentSearches: () => void;
  onRemoveRecentSearch: (term: string) => void;
}

export function SearchHeader({
  query,
  categories,
  searchInputRef,
  onSearch,
  recentSearches,
  onClearRecentSearches,
  onRemoveRecentSearch,
}: SearchHeaderProps) {
  return (
    <div className="max-w-3xl mx-auto mb-8 sm:mb-10">
      <div className="text-center mb-6 sm:mb-8">
        <div className="mb-4">
          <PremiumBadge>
            <Sparkles className="h-3.5 w-3.5" />
            Gelişmiş Arama
          </PremiumBadge>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-[-0.025em] mb-3 text-foreground">
          Rüya <GradientText>Ara</GradientText>
        </h1>
        <p className="text-muted-foreground">
          Binlerce rüya tabiri arasında arayın
        </p>
      </div>

      {/* Search Form with Autocomplete */}
      <SearchAutocomplete
        ref={searchInputRef}
        initialQuery={query}
        onSearch={onSearch}
        recentSearches={recentSearches}
        onClearRecentSearches={onClearRecentSearches}
        onRemoveRecentSearch={onRemoveRecentSearch}
      />

      {/* Quick Category Filters */}
      {!query && categories.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span>Kategorilere Göre Ara</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.slice(0, 8).map((category) => (
              <Link
                key={category.id}
                to={`/kategori/${category.slug}`}
                className="min-h-11 rounded-xl bg-muted px-3 py-2 text-sm transition-colors hover:bg-primary hover:text-primary-foreground flex items-center gap-2 sm:px-4"
              >
                <CategoryIcon icon={category.icon} className="h-4 w-4" />
                <span>{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Popular Searches */}
      {!query && (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>Popüler Aramalar</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularSearches.map((term) => (
              <button
                key={term}
                onClick={() => onSearch(term)}
                className="min-h-11 rounded-full bg-muted px-3 py-1.5 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
