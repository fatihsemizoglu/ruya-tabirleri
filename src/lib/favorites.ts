import type { Favorite, Dream, Category } from '@/types/database';

export type SortOption = 'newest' | 'oldest' | 'views' | 'likes' | 'title';
export type ViewMode = 'grid' | 'list';

export type FavoriteDream = Favorite & { dreams: Dream & { categories?: Category } };
