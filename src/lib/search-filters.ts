/**
 * Arama filtreleme ve normalizasyon yardımcıları (saf fonksiyonlar).
 * Search.tsx'ten ayrı modüle alındı — unit test edilebilirlik için.
 */
import type { DreamSearchResult } from '@/types/database';

/** Supabase ilike/contains parametrelerinde özel karakterleri temizler */
export const escapeSupabaseOrValue = (value: string) => value.replace(/[%,(){}]/g, '');

/** Türkçe karakterleri normalleştirir (ı→i, ş→s, ç→c, ...) + aksan temizliği */
export const normalizeSearchTerm = (value: string) => value
  .trim()
  .toLocaleLowerCase('tr-TR')
  .replace(/ı/g, 'i')
  .replace(/ğ/g, 'g')
  .replace(/ü/g, 'u')
  .replace(/ş/g, 's')
  .replace(/ö/g, 'o')
  .replace(/ç/g, 'c')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

/** Slug biçimine çevirir (arama terimi için) */
export const toSlugTerm = (value: string) => normalizeSearchTerm(value).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Aynı id'ye sahip rüyaları tekil hale getirir */
export const uniqueDreamResults = (items: DreamSearchResult[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

/** Gelişmiş filtre durumu (AdvancedFilters bileşeniyle paylaşılır) */
export interface AdvancedFilterState {
  showFeaturedOnly: boolean;
  selectedCategories: string[];
  minViews: number;
  minLikes: number;
  sortBy: 'relevance' | 'views' | 'likes' | 'newest';
}

/** Varsayılan gelişmiş filtre durumu (sıfırlama için) */
export const DEFAULT_FILTERS: AdvancedFilterState = {
  showFeaturedOnly: false,
  selectedCategories: [],
  minViews: 0,
  minLikes: 0,
  sortBy: 'relevance',
};

/** RPC çökmesi fallback yolunda filtreleri istemci tarafında uygular */
export const applyFiltersClientSide = (rows: DreamSearchResult[], filters: AdvancedFilterState): DreamSearchResult[] => {
  let filtered = [...rows];

  if (filters.showFeaturedOnly) {
    filtered = filtered.filter(dream => dream.is_featured === true);
  }

  if (filters.selectedCategories.length > 0) {
    filtered = filtered.filter(dream =>
      dream.category_id && filters.selectedCategories.includes(dream.category_id)
    );
  }

  if (filters.minViews > 0) {
    filtered = filtered.filter(dream => (dream.view_count || 0) >= filters.minViews);
  }
  if (filters.minLikes > 0) {
    filtered = filtered.filter(dream => (dream.like_count || 0) >= filters.minLikes);
  }

  switch (filters.sortBy) {
    case 'views':
      filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
      break;
    case 'likes':
      filtered.sort((a, b) => (b.like_count || 0) - (a.like_count || 0));
      break;
    case 'newest':
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      break;
    default:
      filtered.sort((a, b) => (b.rank || 0) - (a.rank || 0));
      break;
  }

  return filtered;
};
