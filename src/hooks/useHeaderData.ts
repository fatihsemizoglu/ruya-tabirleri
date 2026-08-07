import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BlogCategory } from '@/types/blog';
import type { HeaderCategory, HeaderBlogPostPreview } from '@/lib/header-types';

const PUBLIC_MENU_STALE_TIME = 30 * 60 * 1000;
const PUBLIC_MENU_GC_TIME = 2 * 60 * 60 * 1000;

/**
 * Header menüleri için gerekli verileri tembelce yükler: menüler kapalıyken
 * `enabled` bayrakları false olduğu için sorgu çalışmaz.
 */
export function useHeaderData(shouldLoadCategories: boolean, shouldLoadBlogMenu: boolean) {
  const { data: categories = [] } = useQuery({
    queryKey: ['header-dream-categories'],
    queryFn: async (): Promise<HeaderCategory[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, icon')
        .limit(50);
      if (error) throw error;
      return [...(data || [])].sort((a, b) =>
        a.name.localeCompare(b.name, 'tr', { sensitivity: 'base' })
      );
    },
    staleTime: PUBLIC_MENU_STALE_TIME,
    gcTime: PUBLIC_MENU_GC_TIME,
    enabled: shouldLoadCategories,
  });

  const { data: blogCategories = [] } = useQuery({
    queryKey: ['header-blog-categories'],
    queryFn: async (): Promise<BlogCategory[]> => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('id, name, slug, description, icon, order_index, created_at, updated_at')
        .order('order_index', { ascending: true })
        .order('name', { ascending: true })
        .limit(20);
      if (error) throw error;
      return (data || []) as BlogCategory[];
    },
    staleTime: PUBLIC_MENU_STALE_TIME,
    gcTime: PUBLIC_MENU_GC_TIME,
    enabled: shouldLoadBlogMenu,
  });

  const { data: recentPosts = [] } = useQuery({
    queryKey: ['header-recent-posts'],
    queryFn: async (): Promise<HeaderBlogPostPreview[]> => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, featured_image, category:blog_categories(id, name, slug, description, icon, order_index, created_at, updated_at)')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(4);
      if (error) throw error;
      return (data || []) as HeaderBlogPostPreview[];
    },
    staleTime: PUBLIC_MENU_STALE_TIME,
    gcTime: PUBLIC_MENU_GC_TIME,
    enabled: shouldLoadBlogMenu,
  });

  return { categories, blogCategories, recentPosts };
}
