import { supabase } from "@/integrations/supabase/client";
import type { DreamSearchResult, Category } from "@/types/database";

const RESULTS_PER_PAGE = 24;

const escapeSupabaseOrValue = (value: string) => value.replace(/[%,(){}]/g, "");

const normalizeSearchTerm = (value: string) => value
  .trim()
  .toLocaleLowerCase("tr-TR")
  .replace(/ı/g, "i")
  .replace(/ğ/g, "g")
  .replace(/ü/g, "u")
  .replace(/ş/g, "s")
  .replace(/ö/g, "o")
  .replace(/ç/g, "c")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "");

const toSlugTerm = (value: string) => normalizeSearchTerm(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const uniqueDreamResults = (items: DreamSearchResult[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

export async function searchDreamsRpc(
  searchTerm: string,
  page: number
): Promise<{ rows: DreamSearchResult[]; total: number }> {
  const offset = (page - 1) * RESULTS_PER_PAGE;
  const [{ data, error }, { data: countData, error: countError }] = await Promise.all([
    (supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: DreamSearchResult[] | null; error: unknown }>)("search_dreams", {
      search_query: searchTerm,
      limit_count: RESULTS_PER_PAGE,
      offset_count: offset,
    }),
    (supabase.rpc as unknown as (name: string, args: Record<string, unknown>) => Promise<{ data: number | null; error: unknown }>)("count_search_dreams", { search_query: searchTerm }),
  ]);

  if (error || countError) {
    return { rows: [], total: 0 };
  }

  return {
    rows: (data || []) as DreamSearchResult[],
    total: typeof countData === "number" ? countData : 0,
  };
}

export async function fallbackSearchDreams(
  searchTerm: string,
  limit = RESULTS_PER_PAGE
): Promise<DreamSearchResult[]> {
  const trimmed = searchTerm.trim();
  const safeTerm = escapeSupabaseOrValue(trimmed);
  const normalizedTerm = escapeSupabaseOrValue(normalizeSearchTerm(trimmed));
  const slugTerm = toSlugTerm(trimmed);

  if (!safeTerm) return [];

  const selectFields = "id, title, slug, content, category_id, keywords, view_count, like_count, is_featured, created_at";
  const titleQueries = [safeTerm, normalizedTerm]
    .filter(Boolean)
    .flatMap((term) => [term, `Rüyada ${term}`, `Ruyada ${term}`]);

  const queryPromises = [
    ...titleQueries.map((term) => supabase
      .from("dreams")
      .select(selectFields)
      .eq("is_published", true)
      .ilike("title", `%${term}%`)
      .order("view_count", { ascending: false })
      .limit(limit)),
    slugTerm ? supabase
      .from("dreams")
      .select(selectFields)
      .eq("is_published", true)
      .ilike("slug", `%${slugTerm}%`)
      .order("view_count", { ascending: false })
      .limit(limit) : null,
    safeTerm ? supabase
      .from("dreams")
      .select(selectFields)
      .eq("is_published", true)
      .contains("keywords", [safeTerm])
      .order("view_count", { ascending: false })
      .limit(limit) : null,
  ] as (Promise<{ data: DreamSearchResult[] | null; error: unknown }> | null)[];

  const responses = await Promise.all(queryPromises);
  const rows = responses.flatMap((response) => (response && response.error ? [] : ((response?.data || []) as DreamSearchResult[])));
  const results = uniqueDreamResults(rows.map((dream) => ({ ...dream, rank: 1, total_count: rows.length })) as DreamSearchResult[])
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, limit);

  return results.map((dream) => ({ ...dream, total_count: results.length }));
}

export async function fetchSearchCategories(): Promise<Category[]> {
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, description, icon, created_at")
    .order("name");

  return (data || []) as Category[];
}
