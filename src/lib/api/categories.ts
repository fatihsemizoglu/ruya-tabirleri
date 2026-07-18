import { supabase } from "@/integrations/supabase/client";
import type { Category } from "@/types/database";

export async function fetchAllCategories(): Promise<Category[]> {
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (data || []) as Category[];
}

export async function fetchCategoryBySlug(slug: string): Promise<Category | null> {
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .single();

  return data as Category | null;
}

export async function fetchCategoryById(id: string): Promise<Category | null> {
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  return data as Category | null;
}

export const categoryQueryKeys = {
  all: ["categories"],
  bySlug: (slug: string) => ["categories", "slug", slug],
  byId: (id: string) => ["categories", "id", id],
};
