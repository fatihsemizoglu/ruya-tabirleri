import { Router, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database';
import { authMiddleware, optionalAuthMiddleware, requireModerator, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorMiddleware';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

router.get('/', cacheMiddleware({ ttl: 600 }), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [{ data: categories }, { data: dreams }] = await Promise.all([
      supabase.from('categories').select('*').order('order_index', { ascending: true }).order('name', { ascending: true }),
      supabase.from('dreams').select('category_id').eq('is_published', true),
    ]);

    if (!categories) throw new AppError('Failed to fetch categories', 500);

    const dreamCountMap: Record<string, number> = {};
    (dreams || []).forEach((d: any) => {
      if (d.category_id) dreamCountMap[d.category_id] = (dreamCountMap[d.category_id] || 0) + 1;
    });

    const result = (categories || []).map((c: any) => ({ ...c, dream_count: dreamCountMap[c.id] || 0 }));
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.get('/:slug', optionalAuthMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: category } = await supabase.from('categories').select('*').eq('slug', req.params.slug).single();

    if (!category) throw new AppError('Category not found', 404);

    const { count } = await supabase.from('dreams').select('*', { count: 'exact', head: true }).eq('category_id', category.id).eq('is_published', true);

    res.json({ success: true, data: { ...category, dream_count: count || 0 } });
  } catch (error) { next(error); }
});

router.get('/:slug/dreams', optionalAuthMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const { data: category } = await supabase.from('categories').select('*').eq('slug', req.params.slug).single();

    if (!category) throw new AppError('Category not found', 404);

    const [{ count }, { data: dreams }] = await Promise.all([
      supabase.from('dreams').select('*', { count: 'exact', head: true }).eq('category_id', category.id).eq('is_published', true),
      supabase.from('dreams').select('*').eq('category_id', category.id).eq('is_published', true).order('created_at', { ascending: false }).range(offset, offset + limit - 1),
    ]);

    const total = count || 0;
    res.json({ success: true, data: dreams || [], category, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.post('/', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, slug, description, icon, parent_id, order_index } = req.body;
    if (!name || !slug) throw new AppError('Name and slug are required', 400);

    const { data: newCategory, error } = await supabase.from('categories').insert({
      id: uuidv4(), name, slug, description: description || null, icon: icon || null,
      parent_id: parent_id || null, order_index: order_index || 0,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }).select().single();

    if (error) throw new AppError('Failed to create category', 500);
    res.status(201).json({ success: true, data: newCategory });
  } catch (error) { next(error); }
});

router.put('/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, slug, description, icon, parent_id, order_index } = req.body;
    const { data: existing } = await supabase.from('categories').select('*').eq('id', req.params.id).single();
    if (!existing) throw new AppError('Category not found', 404);

    const { data: updated, error } = await supabase.from('categories').update({
      name: name !== undefined ? name : existing.name,
      slug: slug !== undefined ? slug : existing.slug,
      description: description !== undefined ? description : existing.description,
      icon: icon !== undefined ? icon : existing.icon,
      parent_id: parent_id !== undefined ? parent_id : existing.parent_id,
      order_index: order_index !== undefined ? order_index : existing.order_index,
      updated_at: new Date().toISOString(),
    }).eq('id', req.params.id).select().single();

    if (error) throw new AppError('Failed to update category', 500);
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data: existing } = await supabase.from('categories').select('*').eq('id', req.params.id).single();
    if (!existing) throw new AppError('Category not found', 404);

    await Promise.all([
      supabase.from('dreams').update({ category_id: null }).eq('category_id', req.params.id),
      supabase.from('categories').delete().eq('id', req.params.id),
    ]);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) { next(error); }
});

export default router;
