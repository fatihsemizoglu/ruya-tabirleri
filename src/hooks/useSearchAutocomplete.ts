import { useState, useEffect, useCallback, useRef } from 'react';
import { dreamsApi, searchApi } from '@/lib/api';

interface AutocompleteSuggestion {
  id: string;
  title: string;
  slug: string;
  category_name?: string;
}

interface UseSearchAutocompleteOptions {
  debounceMs?: number;
  minChars?: number;
  maxSuggestions?: number;
}

export function useSearchAutocomplete(options: UseSearchAutocompleteOptions = {}) {
  const {
    debounceMs = 300,
    minChars = 2,
    maxSuggestions = 8
  } = options;

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [trendingSearches, setTrendingSearches] = useState<AutocompleteSuggestion[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Fetch trending/popular dreams for suggestions when no query
  useEffect(() => {
    const fetchTrending = async () => {
      const response = await dreamsApi.getFeatured(6);

      if (response.success && response.data) {
        setTrendingSearches(response.data.map(d => ({
          id: d.id,
          title: d.title,
          slug: d.slug,
          category_name: d.category_name || undefined
        })));
      }
    };
    fetchTrending();
  }, []);

  const searchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < minChars) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Search for matching dream titles
      const response = await dreamsApi.getAll({
        search: searchQuery,
        limit: maxSuggestions,
        sort_by: 'view_count',
        sort_order: 'desc'
      });

      if (response.success && response.data) {
        setSuggestions(response.data.map(d => ({
          id: d.id,
          title: d.title,
          slug: d.slug,
          category_name: d.category_name || undefined
        })));
      }
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [minChars, maxSuggestions]);

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchSuggestions(newQuery);
    }, debounceMs);
  }, [searchSuggestions, debounceMs]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    query,
    setQuery: handleQueryChange,
    suggestions,
    isLoading,
    trendingSearches,
    clearSuggestions
  };
}
