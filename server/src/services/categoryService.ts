import { supabase } from '../config/database';
import { AppError } from '../middleware/errorMiddleware';
import { v4 as uuidv4 } from 'uuid';
import type { Category } from '../types/index';

export class CategoryService {
  async getCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) throw new AppError('Failed to fetch categories', 500);
    return data || [];
  }

  async getCategoryBySlug(slug: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*, parent:categories!parent_id(name, slug)')
      .eq('slug', slug)
      .single();

    if (error || !data) throw new AppError('Category not found', 404);
    return data;
  }

  async getCategoryById(id: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*, parent:categories!parent_id(name, slug)')
      .eq('id', id)
      .single();

    if (error || !data) throw new AppError('Category not found', 404);
    return data;
  }

  async createCategory(data: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    parent_id?: string;
    order_index?: number;
  }) {
    const { name, slug } = data;
    if (!name || !slug) throw new AppError('Name and slug are required', 400);

    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', slug)
      .single();
    if (existing) throw new AppError('A category with this slug already exists', 400);

    const id = uuidv4();
    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert({
        id,
        name,
        slug,
        description: data.description || null,
        icon: data.icon || null,
        parent_id: data.parent_id || null,
        order_index: data.order_index || null,
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to create category', 500);
    return newCategory;
  }

  async updateCategory(
    id: string,
    data: {
      name?: string;
      slug?: string;
      description?: string;
      icon?: string;
      parent_id?: string;
      order_index?: number;
    }
  ) {
    const { data: existing } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();
    if (!existing) throw new AppError('Category not found', 404);

    if (data.slug && data.slug !== existing.slug) {
      const { data: slugCheck } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', data.slug)
        .neq('id', id)
        .single();
      if (slugCheck) throw new AppError('A category with this slug already exists', 400);
    }

    const allowedKeys = ['name', 'slug', 'description', 'icon', 'parent_id', 'order_index'];
    const updateData = {
      updated_at: new Date().toISOString(),
      ...Object.fromEntries(
        allowedKeys.map(key => [key, data[key as keyof typeof data]]).filter(([, v]) => v !== undefined)
      ),
    };

    const { data: updated, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new AppError('Failed to update category', 500);
    return updated;
  }

  async deleteCategory(id: string) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('id', id)
      .single();
    if (!existing) throw new AppError('Category not found', 404);

    await supabase.from('categories').delete().eq('id', id);
    return { success: true, message: 'Category deleted successfully' };
  }

  async getSubcategories(parentId: string) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentId)
      .order('order_index', { ascending: true });

    if (error) throw new AppError('Failed to fetch subcategories', 500);
    return data || [];
  }

  async getCategoryTree() {
    const { data, error } = await supabase
      .from('categories')
      .select('*, parent:categories!parent_id(name, slug)')
      .order('order_index', { ascending: true });

    if (error) throw new AppError('Failed to fetch category tree', 500);

    const categories = (data || []) as any[];
    const rootCategories = categories.filter((c) => !c.parent_id);
    const buildTree = (parent: any): any => ({
      ...parent,
      children: categories
        .filter((c) => c.parent_id === parent.id)
        .map(buildTree),
    });

    return rootCategories.map(buildTree);
  }
}

export const categoryService = new CategoryService();