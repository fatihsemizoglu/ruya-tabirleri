import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AutocompleteSuggestion {
  id: string;
  title: string;
  slug: string;
  category_name?: string | undefined;
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
      const { data } = await supabase
        .from('dreams')
        .select(`
          id,
          title,
          slug,
          categories:category_id (name)
        `)
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(6);

      if (data) {
        setTrendingSearches(data.map(d => ({
          id: d.id,
          title: d.title,
          slug: d.slug,
          category_name: (d.categories as { name?: string })?.name || undefined
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
      const { data } = await supabase
        .from('dreams')
        .select(`
          id,
          title,
          slug,
          categories:category_id (name)
        `)
        .eq('is_published', true)
        .or(`title.ilike.%${searchQuery}%,keywords.cs.{${searchQuery}}`)
        .order('view_count', { ascending: false })
        .limit(maxSuggestions);

      if (data) {
        setSuggestions(data.map(d => ({
          id: d.id,
          title: d.title,
          slug: d.slug,
          category_name: (d.categories as { name?: string })?.name || undefined
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
