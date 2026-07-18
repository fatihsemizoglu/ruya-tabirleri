import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserXp, UserBadge, Badge } from "@/types/database";

export function xpForLevel(level: number): number {
  return 50 * (level - 1) * (level - 1);
}

export function levelProgress(xp: number, level: number): number {
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  if (next === current) return 100;
  return ((xp - current) / (next - current)) * 100;
}

export function useUserXp(userId: string | undefined) {
  return useQuery({
    queryKey: ["gamification", "xp", userId],
    queryFn: async (): Promise<UserXp | null> => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_xp")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as UserXp | null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60,
  });
}

export function useUserBadges(userId: string | undefined) {
  return useQuery({
    queryKey: ["gamification", "badges", userId],
    queryFn: async (): Promise<(UserBadge & { badge: Badge })[]> => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("user_badges")
        .select("*, badge:badge_id(*)")
        .eq("user_id", userId);

      if (error) throw error;
      return (data || []) as (UserBadge & { badge: Badge })[];
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAvailableBadges() {
  return useQuery({
    queryKey: ["gamification", "available-badges"],
    queryFn: async (): Promise<Badge[]> => {
      const { data, error } = await supabase
        .from("badges")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true })
        .order("rarity", { ascending: true });

      if (error) throw error;
      return (data || []) as Badge[];
    },
    staleTime: 1000 * 60 * 30,
  });
}
