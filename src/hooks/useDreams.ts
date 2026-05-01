import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dreamsApi } from '@/lib/api';
import { queryKeys } from '@/lib/query/client';

export function useDreams(params?: {
  page?: number;
  limit?: number;
  category_id?: string;
  search?: string;
  is_published?: string;
  is_featured?: boolean;
  sort_by?: string;
  sort_order?: string;
}) {
  return useQuery({
    queryKey: queryKeys.dreams.list(params || {}),
    queryFn: () => dreamsApi.getAll(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useDream(slug: string) {
  return useQuery({
    queryKey: queryKeys.dreams.bySlug(slug),
    queryFn: () => dreamsApi.getBySlug(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 10,
  });
}

export function useFeaturedDreams(limit = 5) {
  return useQuery({
    queryKey: [...queryKeys.dreams.all, 'featured', limit],
    queryFn: () => dreamsApi.getFeatured(limit),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSimilarDreams(dreamId: string, limit = 5) {
  return useQuery({
    queryKey: [...queryKeys.dreams.all, 'similar', dreamId],
    queryFn: () => dreamsApi.getSimilar(dreamId),
    enabled: !!dreamId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateDream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof dreamsApi.create>[0]) => dreamsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dreams.all });
    },
  });
}

export function useUpdateDream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof dreamsApi.update>[1] }) =>
      dreamsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dreams.all });
    },
  });
}

export function useDeleteDream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dreamsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dreams.all });
    },
  });
}

export function useLikeDream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dreamsApi.like(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dreams.all });
    },
  });
}

export function useFavoriteDream() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dreamsApi.favorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dreams.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.user.favorites });
    },
  });
}