import { supabase } from "@/integrations/supabase/client";
import type { DreamJournalEntry, Favorite, ViewHistory } from "@/types/database";

export async function fetchUserFavorites(userId: string): Promise<(Favorite & { dreams: Record<string, unknown> })[]> {
  const { data } = await supabase
    .from("favorites")
    .select("*, dreams(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data || []) as (Favorite & { dreams: Record<string, unknown> })[];
}

export async function fetchUserHistory(userId: string, limit = 50): Promise<(ViewHistory & { dreams: Record<string, unknown> })[]> {
  const { data } = await supabase
    .from("view_history")
    .select("*, dreams(*)")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(limit);

  return (data || []) as (ViewHistory & { dreams: Record<string, unknown> })[];
}

export async function fetchUserJournal(userId: string): Promise<DreamJournalEntry[]> {
  const { data } = await supabase
    .from("dream_journal")
    .select("*")
    .eq("user_id", userId)
    .order("dream_date", { ascending: false });

  return (data || []) as DreamJournalEntry[];
}

export async function addJournalEntry(entry: Omit<DreamJournalEntry, "id" | "created_at" | "updated_at">): Promise<DreamJournalEntry | null> {
  const { data } = await supabase
    .from("dream_journal")
    .insert(entry)
    .select()
    .single();

  return data as DreamJournalEntry | null;
}

export async function checkUserFavorite(dreamId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("dream_id", dreamId)
    .maybeSingle();

  return !!data;
}

export async function checkUserLike(dreamId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("dream_likes")
    .select("id")
    .eq("user_id", userId)
    .eq("dream_id", dreamId)
    .maybeSingle();

  return !!data;
}

export const userQueryKeys = {
  favorites: (userId: string) => ["user", "favorites", userId],
  history: (userId: string) => ["user", "history", userId],
  journal: (userId: string) => ["user", "journal", userId],
  favoriteState: (dreamId: string, userId: string) => ["user", "favorite-state", dreamId, userId],
  likeState: (dreamId: string, userId: string) => ["user", "like-state", dreamId, userId],
};
