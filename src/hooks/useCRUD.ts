import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import type { ApiResponse } from '@/lib/api';

interface UseCRUDOptions<T, TForm = T> {
  queryKey: string[];
  fetchFn: () => Promise<ApiResponse<T[]>>;
  createFn?: (data: TForm) => Promise<ApiResponse<T>>;
  updateFn?: (id: string, data: TForm) => Promise<ApiResponse<T>>;
  deleteFn?: (id: string) => Promise<ApiResponse<void>>;
  onSuccess?: (action: 'create' | 'update' | 'delete') => void;
}

export function useCRUD<T, TForm = T>({
  queryKey,
  fetchFn,
  createFn,
  updateFn,
  deleteFn,
  onSuccess,
}: UseCRUDOptions<T, TForm>) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey,
    queryFn: fetchFn,
  });

  const createMutation = useMutation({
    mutationFn: createFn || (() => Promise.reject(new Error('createFn not provided'))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      onSuccess?.('create');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; values: TForm }) =>
      updateFn ? updateFn(data.id, data.values) : Promise.reject(new Error('updateFn not provided')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      onSuccess?.('update');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFn || (() => Promise.reject(new Error('deleteFn not provided'))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      onSuccess?.('delete');
    },
  });

  return {
    items: query.data?.data || [],
    isLoading: query.isLoading,
    error: query.error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    remove: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

interface UseSelectionOptions<T> {
  items: T[];
  getId: (item: T) => string;
}

export function useSelection<T>({ items, getId }: UseSelectionOptions<T>) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(items.map(getId)));
  }, [items, getId]);

  const clear = useCallback(() => {
    setSelected(new Set());
  }, []);

  return {
    selected,
    toggle,
    selectAll,
    clear,
    isSelected: (id: string) => selected.has(id),
    isAllSelected: selected.size === items.length && items.length > 0,
    isSomeSelected: selected.size > 0 && selected.size < items.length,
  };
}

interface UsePaginationOptions {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function usePagination({ page, totalPages, onPageChange }: UsePaginationOptions) {
  return {
    page,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    setNext: () => onPageChange(page + 1),
    setPrev: () => onPageChange(page - 1),
    setPage: onPageChange,
  };
}