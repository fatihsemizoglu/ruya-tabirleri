export type SortOption = 'popular' | 'newest' | 'oldest' | 'most-liked' | 'alphabetical';
export type ViewMode = 'grid' | 'list';

export const gradientPalette = [
  'from-violet-500 to-fuchsia-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-rose-500',
  'from-pink-500 to-purple-500',
  'from-amber-500 to-orange-500',
  'from-indigo-500 to-violet-500',
  'from-rose-500 to-pink-500',
];

export const pickGradient = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return gradientPalette[Math.abs(hash) % gradientPalette.length] ?? 'from-violet-500 to-fuchsia-500';
};
