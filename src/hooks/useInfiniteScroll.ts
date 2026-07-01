import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchFn: (page: number, pageSize: number) => Promise<T[]>;
  pageSize?: number;
  threshold?: number;
}

interface UseInfiniteScrollResult<T> {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => void;
  refresh: () => void;
  sentinelRef: (node: HTMLElement | null) => void;
}

export function useInfiniteScroll<T>({
  fetchFn,
  pageSize = 12,
  threshold = 200,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const observer = useRef<IntersectionObserver | null>(null);
  const isFetching = useRef(false);

  const fetchItems = useCallback(async (pageNum: number, isInitial: boolean = false) => {
    if (isFetching.current) return;
    
    try {
      isFetching.current = true;
      
      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      const newItems = await fetchFn(pageNum, pageSize);
      
      if (newItems.length < pageSize) {
        setHasMore(false);
      }
      
      setItems(prev => isInitial ? newItems : [...prev, ...newItems]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch'));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isFetching.current = false;
    }
  }, [fetchFn, pageSize]);

  // Initial load
  useEffect(() => {
    fetchItems(1, true);
  }, [fetchItems]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isFetching.current) return;
    
    const nextPage = page + 1;
    setPage(nextPage);
    fetchItems(nextPage, false);
  }, [page, hasMore, isLoadingMore, fetchItems]);

  const refresh = useCallback(() => {
    setPage(1);
    setHasMore(true);
    setItems([]);
    fetchItems(1, true);
  }, [fetchItems]);

  // Intersection Observer for auto-loading
  const sentinelRef = useCallback((node: HTMLElement | null) => {
    if (isLoading || isLoadingMore) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0]?.isIntersecting && hasMore && !isFetching.current) {
        loadMore();
      }
    }, {
      rootMargin: `${threshold}px`,
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, isLoadingMore, hasMore, loadMore, threshold]);

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    sentinelRef,
  };
}
