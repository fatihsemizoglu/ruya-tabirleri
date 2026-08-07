import { supabase } from '@/integrations/supabase/client';
import {
  escapeSupabaseOrValue,
  normalizeSearchTerm,
  toSlugTerm,
  uniqueDreamResults,
  applyFiltersClientSide,
} from '@/lib/search-filters';
import type { AdvancedFilterState } from '@/lib/search-filters';
import type { DreamSearchResult } from '@/types/database';

export const popularSearches = [
  'yılan', 'su', 'ölüm', 'uçmak', 'düşmek', 'altın', 'köpek', 'at',
  'bebek', 'ev', 'araba', 'para', 'diş', 'saç', 'kan'
];

export const RESULTS_PER_PAGE = 24;

export type ViewMode = 'grid' | 'list';

const fallbackSearchDreams = async (searchTerm: string, limit = RESULTS_PER_PAGE): Promise<DreamSearchResult[]> => {
  const trimmed = searchTerm.trim();
  const safeTerm = escapeSupabaseOrValue(trimmed);
  const normalizedTerm = escapeSupabaseOrValue(normalizeSearchTerm(trimmed));
  const slugTerm = toSlugTerm(trimmed);

  if (!safeTerm) return [];

  const selectFields = 'id, title, slug, content, category_id, keywords, view_count, like_count, is_featured, created_at';
  const titleQueries = [safeTerm, normalizedTerm]
    .filter(Boolean)
    .flatMap((term) => [term, `Rüyada ${term}`, `Ruyada ${term}`]);

  const queryPromises = [
    ...titleQueries.map((term) => supabase
      .from('dreams')
      .select(selectFields)
      .eq('is_published', true)
      .ilike('title', `%${term}%`)
      .order('view_count', { ascending: false })
      .limit(limit)),
    slugTerm ? supabase
      .from('dreams')
      .select(selectFields)
      .eq('is_published', true)
      .ilike('slug', `%${slugTerm}%`)
      .order('view_count', { ascending: false })
      .limit(limit) : null,
    safeTerm ? supabase
      .from('dreams')
      .select(selectFields)
      .eq('is_published', true)
      .contains('keywords', [safeTerm])
      .order('view_count', { ascending: false })
      .limit(limit) : null,
  ].filter(Boolean);

  const responses = await Promise.all(queryPromises);
  const rows = responses.flatMap((response) => (response && response.error ? [] : (response?.data || [])));
  const results = uniqueDreamResults(rows.map((dream) => ({ ...dream, rank: 1, total_count: rows.length })) as DreamSearchResult[])
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, limit);

  return results.map((dream) => ({ ...dream, total_count: results.length }));
};

// RPC başarısız olursa (ör. migration henüz uygulanmadıysa) fallback sonuçlara
// aynı filtreleri istemci tarafında uygular — tutarlılık bozulmasın diye.
// (Mantık src/lib/search-filters.ts'ten import edilir — unit test kapsamı için.)
// Filtreler ve sıralama server tarafında (search_dreams RPC) uygulanır;
// sayfalama ve total_count filtrelenmiş kümeye göre döner.
export const searchDreamsPage = async (
  searchTerm: string,
  page: number,
  filters: AdvancedFilterState
): Promise<{ rows: DreamSearchResult[]; total: number }> => {
  const offset = (page - 1) * RESULTS_PER_PAGE;
  // Kategori seçilmediyse category_ids parametresi hiç gönderilmez → RPC default'u (NULL) kullanılır
  const categoryIdsArg = filters.selectedCategories.length > 0
    ? { category_ids: filters.selectedCategories }
    : {};
  const filterArgs = {
    featured_only: filters.showFeaturedOnly,
    min_views: filters.minViews,
    min_likes: filters.minLikes,
  };
  const [{ data, error }, { data: countData, error: countError }] = await Promise.all([
    supabase.rpc('search_dreams', {
      search_query: searchTerm,
      limit_count: RESULTS_PER_PAGE,
      offset_count: offset,
      ...filterArgs,
      ...categoryIdsArg,
      sort_by: filters.sortBy,
    }),
    supabase.rpc('count_search_dreams', {
      search_query: searchTerm,
      ...filterArgs,
      ...categoryIdsArg,
    }),
  ]);

  if (error || countError) {
    // RPC çökmesi durumunda geçici degradasyon: fallback tek sayfa çeker,
    // filtreler yalnızca o sayfaya uygulanır (page 2+ toplamları tam değildir).
    const fallbackRows = await fallbackSearchDreams(searchTerm, RESULTS_PER_PAGE);
    const filteredFallback = applyFiltersClientSide(fallbackRows, filters);
    return { rows: filteredFallback, total: filteredFallback.length };
  }

  return {
    rows: (data || []) as DreamSearchResult[],
    total: typeof countData === 'number' ? countData : 0,
  };
};
