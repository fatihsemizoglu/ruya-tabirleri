import { supabase } from "@/integrations/supabase/client";
import type { Dream, DreamSearchResult, Category } from "@/types/database";

export async function fetchDreamBySlug(slug: string): Promise<Dream | null> {
  const { data, error } = await supabase
    .from("dreams")
    .select("*, category:category_id(*)")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !data) return null;
  return data as Dream;
}

export async function fetchDreamsByCategory(categoryId: string, limit = 50): Promise<Dream[]> {
  const { data } = await supabase
    .from("dreams")
    .select("*")
    .eq("is_published", true)
    .eq("category_id", categoryId)
    .order("view_count", { ascending: false })
    .limit(limit);

  return (data || []) as Dream[];
}

export async function fetchPopularDreams(limit = 20, timeFilter?: string): Promise<Dream[]> {
  let query = supabase
    .from("dreams")
    .select("*")
    .eq("is_published", true)
    .order("view_count", { ascending: false })
    .limit(limit);

  if (timeFilter) {
    query = query.gte("created_at", timeFilter);
  }

  const { data } = await query;
  return (data || []) as Dream[];
}

export async function fetchFeaturedDreams(limit = 10): Promise<Dream[]> {
  const { data } = await supabase
    .from("dreams")
    .select("*")
    .eq("is_published", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []) as Dream[];
}

export async function fetchDreamsByAlphabet(letter: string, page = 1, perPage = 50): Promise<{ dreams: Dream[]; total: number }> {
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, error, count } = await supabase
    .from("dreams")
    .select("*", { count: "exact" })
    .eq("is_published", true)
    .ilike("slug", `${letter.toLowerCase()}%`)
    .order("title", { ascending: true })
    .range(from, to);

  if (error) return { dreams: [], total: 0 };
  return { dreams: (data || []) as Dream[], total: count || 0 };
}

export type DreamStats = {
  totalDreams: number;
  totalViews: number;
  totalLikes: number;
};

export async function fetchDreamStats(): Promise<DreamStats | null> {
  const { data, error } = await (supabase.rpc as unknown as (name: string, args?: Record<string, unknown>) => Promise<{ data: DreamStats | null; error: unknown }>)("get_dream_stats");
  if (error) return null;
  return data;
}

export async function incrementDreamView(dreamId: string): Promise<void> {
  await (supabase.rpc as unknown as (name: string, args?: Record<string, unknown>) => Promise<unknown>)("increment_view_count", { dream_id: dreamId });
}

export async function toggleDreamLike(dreamId: string, userId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from("dream_likes")
    .select("id")
    .eq("user_id", userId)
    .eq("dream_id", dreamId)
    .maybeSingle();

  if (existing) {
    const { error: delErr } = await supabase
      .from("dream_likes")
      .delete()
      .eq("id", existing.id);

    if (!delErr) {
      await (supabase.rpc as unknown as (name: string, args?: Record<string, unknown>) => Promise<unknown>)("decrement_like_count", { dream_id: dreamId });
    }
    return false;
  }

  const { error: insErr } = await supabase
    .from("dream_likes")
    .insert({ user_id: userId, dream_id: dreamId });

  if (!insErr) {
    await (supabase.rpc as unknown as (name: string, args?: Record<string, unknown>) => Promise<unknown>)("increment_like_count", { dream_id: dreamId });
  }
  return true;
}

export async function fetchSimilarDreams(dreamId: string, limit = 5): Promise<Dream[]> {
  const { data: dream } = await supabase
    .from("dreams")
    .select("keywords, category_id")
    .eq("id", dreamId)
    .single();

  if (!dream) return [];

  const keywords = (dream as { keywords?: string[] }).keywords || [];

  if (keywords.length > 0) {
    const { data } = await supabase
      .from("dreams")
      .select("*")
      .eq("is_published", true)
      .neq("id", dreamId)
      .contains("keywords", [keywords[0]])
      .limit(limit);

    if (data && data.length > 0) return data as Dream[];
  }

  if (dream.category_id) {
    return fetchDreamsByCategory(dream.category_id, limit);
  }

  return [];
}

export async function fetchDreamFeed(limit = 30): Promise<(Dream & { category?: Category })[]> {
  const { data } = await supabase
    .from("dreams")
    .select("*, category:category_id(*)")
    .eq("is_published", true)
    .order("view_count", { ascending: false })
    .limit(limit);

  return (data || []) as (Dream & { category?: Category })[];
}

export const dreamQueryKeys = {
  all: ["dreams"],
  bySlug: (slug: string) => ["dreams", "slug", slug],
  popular: (timeFilter?: string) => ["dreams", "popular", timeFilter],
  featured: ["dreams", "featured"],
  byAlphabet: (letter: string, page: number) => ["dreams", "alphabet", letter, page],
  stats: ["dreams", "stats"],
  similar: (id: string) => ["dreams", "similar", id],
  feed: (limit?: number) => ["dreams", "feed", limit],
};
