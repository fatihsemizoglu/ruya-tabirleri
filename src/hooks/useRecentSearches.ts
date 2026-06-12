import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'dream_recent_searches';
const MAX_ITEMS = 8;

function readStored(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

function writeStored(items: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    /* noop */
  }
}

interface UseRecentSearchesResult {
  recent: string[];
  addSearch: (query: string) => void;
  removeSearch: (query: string) => void;
  clear: () => void;
}

/**
 * Tracks recent search queries in localStorage. Keeps at most MAX_ITEMS,
 * dedupes (case-insensitive), and most-recent-first.
 */
export function useRecentSearches(): UseRecentSearchesResult {
  const [recent, setRecent] = useState<string[]>(readStored);

  useEffect(() => {
    writeStored(recent);
  }, [recent]);

  const addSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecent((prev) => {
      const filtered = prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
      return [trimmed, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  const removeSearch = useCallback((query: string) => {
    setRecent((prev) => prev.filter((q) => q !== query));
  }, []);

  const clear = useCallback(() => setRecent([]), []);

  return { recent, addSearch, removeSearch, clear };
}
