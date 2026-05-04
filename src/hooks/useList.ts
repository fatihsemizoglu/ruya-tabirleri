import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@/lib/api';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseListOptions<T> {
  queryKey: string[];
  fetchFn: (params: Record<string, any>) => Promise<ApiResponse<T[]>>;
  initialParams?: Record<string, any>;
}

export function useList<T extends { id: string }>({
  queryKey,
  fetchFn,
  initialParams = {},
}: UseListOptions<T>) {
  const [params, setParams] = useState(initialParams);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const query = useQuery({
    queryKey: [...queryKey, params],
    queryFn: () => fetchFn({ ...params, page: pagination.page, limit: pagination.limit }),
  });

  useEffect(() => {
    const pagination = query.data?.pagination;
    if (query.data && pagination) {
      setPagination(prev => ({
        ...prev,
        total: pagination.total,
        totalPages: pagination.totalPages,
      }));
    }
  }, [query.data?.pagination]);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  const setFilter = useCallback((key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const setSearch = useCallback((search: string) => {
    setParams(prev => ({ ...prev, search }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setParams({});
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  return {
    items: query.data?.data || [],
    isLoading: query.isLoading,
    error: query.error,
    params,
    pagination,
    setPage,
    setLimit,
    setFilter,
    setSearch,
    resetFilters,
    refetch: query.refetch,
  };
}

interface UseItemMutationsOptions<T> {
  queryKey: string[];
  createFn?: (data: any) => Promise<ApiResponse<T>>;
  updateFn?: (params: { id: string; data: any }) => Promise<ApiResponse<T>>;
  deleteFn?: (id: string) => Promise<any>;
  onSuccess?: (action: 'create' | 'update' | 'delete', data?: T) => void;
  onError?: (action: 'create' | 'update' | 'delete', error: Error) => void;
}

export function useItemMutations<T extends { id: string }>({
  queryKey,
  createFn,
  updateFn,
  deleteFn,
  onSuccess,
  onError,
}: UseItemMutationsOptions<T>) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: createFn || (() => Promise.reject(new Error('createFn not provided'))),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });
      onSuccess?.('create', data.data);
    },
    onError: (error) => {
      onError?.('create', error as Error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (params: { id: string; data: any }) =>
      updateFn ? updateFn(params) : Promise.reject(new Error('updateFn not provided')),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });
      onSuccess?.('update', data.data);
    },
    onError: (error) => {
      onError?.('update', error as Error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFn || (() => Promise.reject(new Error('deleteFn not provided'))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      onSuccess?.('delete');
    },
    onError: (error) => {
      onError?.('delete', error as Error);
    },
  });

  return {
    create: createMutation.mutate,
    update: updateMutation.mutate,
    remove: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useBulkActions<T extends { id: string }>({
  queryKey,
  deleteFn,
  updateFn,
  onSuccess,
}: {
  queryKey: string[];
  deleteFn?: (ids: string[]) => Promise<ApiResponse<void>>;
  updateFn?: (ids: string[], data: any) => Promise<ApiResponse<void>>;
  onSuccess?: (action: 'delete' | 'update', count: number) => void;
}) {
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((items: T[]) => {
    setSelectedIds(new Set(items.map(i => i.id)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const deleteSelected = useMutation({
    mutationFn: async () => {
      if (!deleteFn) throw new Error('Delete function not provided');
      const ids = Array.from(selectedIds);
      await deleteFn(ids);
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey });
      clearSelection();
      onSuccess?.('delete', count);
    },
  });

  const updateSelected = useMutation({
    mutationFn: async (data: any) => {
      if (!updateFn) throw new Error('Update function not provided');
      const ids = Array.from(selectedIds);
      await updateFn(ids, data);
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey });
      clearSelection();
      onSuccess?.('update', count);
    },
  });

  return {
    selectedIds,
    toggle,
    selectAll,
    clearSelection,
    deleteSelected: deleteSelected.mutate,
    updateSelected: updateSelected.mutate,
    isDeleting: deleteSelected.isPending,
    isUpdating: updateSelected.isPending,
    hasSelection: selectedIds.size > 0,
    selectedCount: selectedIds.size,
  };
}