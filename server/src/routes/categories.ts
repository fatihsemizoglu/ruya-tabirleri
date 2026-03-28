import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database';
import { authMiddleware, optionalAuthMiddleware, requireModerator, AuthRequest } from '../middleware/auth';
import type { Category, Dream } from '../types/index';

const router = Router();

// Get all categories
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('order_index', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;

    // Get dream counts for published dreams
    const { data: dreams } = await supabase
      .from('dreams')
      .select('category_id')
      .eq('is_published', true);

    const dreamCountMap: Record<string, number> = {};
    (dreams || []).forEach((d: any) => {
      if (d.category_id) {
        dreamCountMap[d.category_id] = (dreamCountMap[d.category_id] || 0) + 1;
      }
    });

    const result = (categories || []).map((c: any) => ({
      ...c,
      dream_count: dreamCountMap[c.id] || 0,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to get categories' });
  }
});

// Get category by slug
router.get('/:slug', optionalAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    // Get dream count for this category
    const { count } = await supabase
      .from('dreams')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', category.id)
      .eq('is_published', true);

    res.json({ success: true, data: { ...category, dream_count: count || 0 } });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ success: false, error: 'Failed to get category' });
  }
});

// Get dreams by category
router.get('/:slug/dreams', optionalAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get category
    const { data: category, error: catError } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (catError || !category) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    // Get total count
    const { count } = await supabase
      .from('dreams')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', category.id)
      .eq('is_published', true);

    const total = count || 0;

    // Get dreams
    const { data: dreams, error } = await supabase
      .from('dreams')
      .select('*')
      .eq('category_id', category.id)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: dreams || [],
      category,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get category dreams error:', error);
    res.status(500).json({ success: false, error: 'Failed to get category dreams' });
  }
});

// Create category (admin/moderator only)
router.post('/', authMiddleware, requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, slug, description, icon, parent_id, order_index } = req.body;

    if (!name || !slug) {
      res.status(400).json({ success: false, error: 'Name and slug are required' });
      return;
    }

    const id = uuidv4();

    const { data: newCategory, error } = await supabase
      .from('categories')
      .insert({
        id,
        name,
        slug,
        description: description || null,
        icon: icon || null,
        parent_id: parent_id || null,
        order_index: order_index || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
});

// Update category (admin/moderator only)
router.put('/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, parent_id, order_index } = req.body;

    const { data: existing, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    const { data: updated, error } = await supabase
      .from('categories')
      .update({
        name: name !== undefined ? name : existing.name,
        slug: slug !== undefined ? slug : existing.slug,
        description: description !== undefined ? description : existing.description,
        icon: icon !== undefined ? icon : existing.icon,
        parent_id: parent_id !== undefined ? parent_id : existing.parent_id,
        order_index: order_index !== undefined ? order_index : existing.order_index,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
});

// Delete category (admin only)
router.delete('/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    // Set category_id to NULL for dreams in this category
    await supabase
      .from('dreams')
      .update({ category_id: null })
      .eq('category_id', id);

    await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
});

export default router;
