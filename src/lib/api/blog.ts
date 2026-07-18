import { supabase } from "@/integrations/supabase/client";
import type { BlogPost } from "@/types/blog";

export async function fetchBlogPosts(limit = 10): Promise<BlogPost[]> {
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []) as BlogPost[];
}

export async function fetchBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  return data as BlogPost | null;
}

export async function fetchBlogPostsByTag(tag: string, limit = 20): Promise<BlogPost[]> {
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("is_published", true)
    .contains("tags", [tag])
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []) as BlogPost[];
}

export async function incrementBlogView(postId: string): Promise<void> {
  await (supabase.rpc as unknown as (name: string, args?: Record<string, unknown>) => Promise<unknown>)("increment_blog_view_count", { post_id: postId });
}

export const blogQueryKeys = {
  all: ["blog"],
  list: (limit?: number) => ["blog", "list", limit],
  bySlug: (slug: string) => ["blog", "slug", slug],
  byTag: (tag: string) => ["blog", "tag", tag],
};
