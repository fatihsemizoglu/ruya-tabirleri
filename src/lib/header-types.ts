import type { BlogCategory } from '@/types/blog';

export interface HeaderCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

export interface HeaderBlogPostPreview {
  id: string;
  title: string;
  slug: string;
  featured_image: string | null;
  category: BlogCategory | null;
}
