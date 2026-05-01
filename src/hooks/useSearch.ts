import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/lib/api';
import { queryKeys } from '@/lib/query/client';

export function useSearch(query: string, options?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.search.results(query),
    queryFn: () => searchApi.search(query, options?.page || 1, options?.limit || 20),
    enabled: query.length >= 2,
    staleTime: 1000 * 60,
  });
}

export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: queryKeys.search.suggestions(query),
    queryFn: () => searchApi.getSuggestions(query),
    enabled: query.length >= 1,
    staleTime: 1000 * 30,
  });
}

export function usePopularSearches(limit = 10) {
  return useQuery({
    queryKey: queryKeys.search.popular(limit),
    queryFn: () => searchApi.getPopular(limit),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAlphabetSearch(letter: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: queryKeys.search.alphabet(letter, page),
    queryFn: () => searchApi.search(letter, page, limit),
    enabled: !!letter && letter.length === 1,
    staleTime: 1000 * 60,
  });
}