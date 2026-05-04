import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { queryKeys } from '@/lib/query/client';

export function useFavorites() {
  return useQuery({
    queryKey: queryKeys.user.favorites,
    queryFn: () => usersApi.getFavorites(),
  });
}

export function useAddFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dreamId: string) => usersApi.addFavorite(dreamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.favorites });
    },
  });
}

export function useRemoveFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dreamId: string) => usersApi.removeFavorite(dreamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.favorites });
    },
  });
}

export function useHistory() {
  return useQuery({
    queryKey: queryKeys.user.history,
    queryFn: () => usersApi.getHistory(),
  });
}

export function useClearHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => usersApi.clearHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.history });
    },
  });
}

export function useRemoveFromHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dreamId: string) => usersApi.removeFromHistory(dreamId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.history });
    },
  });
}

export function useJournal() {
  return useQuery({
    queryKey: queryKeys.user.journal,
    queryFn: () => usersApi.getJournal(),
  });
}

export function useCreateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; content: string; mood?: string }) => 
      usersApi.createJournalEntry({ ...data, mood: data.mood as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.journal });
    },
  });
}

export function useUpdateJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ title: string; content: string; mood: string }> }) => 
      usersApi.updateJournalEntry(id, { ...data, mood: data.mood as any }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.journal });
    },
  });
}

export function useDeleteJournalEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.deleteJournalEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.journal });
    },
  });
}

export function useLikes() {
  return useQuery({
    queryKey: queryKeys.user.likes,
    queryFn: () => usersApi.getLikes(),
  });
}