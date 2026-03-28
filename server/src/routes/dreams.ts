import { Router, Response, NextFunction } from 'express';
import { authMiddleware, optionalAuthMiddleware, requireAdmin, requireModerator, AuthRequest } from '../middleware/auth';
import { supabase } from '../config/database';
import { AppError } from '../middleware/errorMiddleware';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const category_id = req.query.category_id as string;
    const search = req.query.search as string;
    const is_featured = req.query.is_featured === 'true';

    let query = supabase.from('dreams').select('*, categories(name, slug)', { count: 'exact' }).eq('is_published', true);
    if (category_id) query = query.eq('category_id', category_id);
    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
    if (req.query.is_featured !== undefined) query = query.eq('is_featured', is_featured);

    const validSortColumns = ['created_at', 'view_count', 'like_count', 'title'];
    const sortBy = validSortColumns.includes(req.query.sort_by as string) ? req.query.sort_by as string : 'created_at';
    const sortOrder = (req.query.sort_order as string)?.toUpperCase() === 'ASC';
    query = query.order(sortBy, { ascending: sortOrder }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw new AppError('Failed to fetch dreams', 500);

    const dreams = (data || []).map((d: any) => ({ ...d, category_name: d.categories?.name, category_slug: d.categories?.slug }));
    res.json({ success: true, data: dreams, pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) } });
  } catch (error) { next(error); }
});

router.get('/featured', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const { data, error } = await supabase.from('dreams').select('*, categories(name, slug)').eq('is_published', true).eq('is_featured', true).order('view_count', { ascending: false }).limit(limit);
    if (error) throw new AppError('Failed to fetch featured dreams', 500);
    const dreams = (data || []).map((d: any) => ({ ...d, category_name: d.categories?.name, category_slug: d.categories?.slug }));
    res.json({ success: true, data: dreams });
  } catch (error) { next(error); }
});

router.get('/:slug', optionalAuthMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const { data: dream, error } = await supabase.from('dreams').select('*, categories(name, slug)').eq('slug', slug).single();
    if (!dream || error) throw new AppError('Dream not found', 404);

    await supabase.from('dreams').update({ view_count: ((dream as any).view_count || 0) + 1 }).eq('id', dream.id);

    if (req.user) {
      const { data: existing } = await supabase.from('view_history').select('*').eq('user_id', req.user.id).eq('dream_id', dream.id).single();
      if (!existing) {
        await supabase.from('view_history').insert({ id: uuidv4(), user_id: req.user.id, dream_id: dream.id });
      } else {
        await supabase.from('view_history').update({ viewed_at: new Date().toISOString() }).eq('user_id', req.user.id).eq('dream_id', dream.id);
      }
    }

    let isLiked = false, isFavorited = false;
    if (req.user) {
      const { data: like } = await supabase.from('dream_likes').select('*').eq('dream_id', dream.id).eq('user_id', req.user.id).single();
      isLiked = !!like;
      const { data: fav } = await supabase.from('favorites').select('*').eq('dream_id', dream.id).eq('user_id', req.user.id).single();
      isFavorited = !!fav;
    }

    const result: any = { ...dream, category_name: (dream as any).categories?.name, category_slug: (dream as any).categories?.slug, isLiked, isFavorited };
    delete result.categories;
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.post('/', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { title, slug, content, category_id, islamic_interpretation, psychological_interpretation, keywords, is_featured, is_published, meta_title, meta_description } = req.body;
    if (!title || !slug || !content) throw new AppError('Title, slug, and content are required', 400);

    const { data: existingSlug } = await supabase.from('dreams').select('id').eq('slug', slug).single();
    if (existingSlug) throw new AppError('A dream with this slug already exists', 400);

    const id = uuidv4();
    const { data: newDream, error } = await supabase.from('dreams').insert({
      id, title, slug, content, category_id: category_id || null, islamic_interpretation: islamic_interpretation || null,
      psychological_interpretation: psychological_interpretation || null, keywords: keywords || [], is_featured: is_featured || false,
      is_published: is_published !== undefined ? is_published : true, meta_title: meta_title || null, meta_description: meta_description || null
    }).select().single();

    if (error) throw new AppError('Failed to create dream', 500);
    res.status(201).json({ success: true, data: newDream });
  } catch (error) { next(error); }
});

router.put('/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { data: existing } = await supabase.from('dreams').select('*').eq('id', id).single();
    if (!existing) throw new AppError('Dream not found', 404);

    if (req.body.slug && req.body.slug !== existing.slug) {
      const { data: slugCheck } = await supabase.from('dreams').select('id').eq('slug', req.body.slug).neq('id', id).single();
      if (slugCheck) throw new AppError('A dream with this slug already exists', 400);
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    for (const key of ['title', 'slug', 'content', 'category_id', 'islamic_interpretation', 'psychological_interpretation', 'keywords', 'is_featured', 'is_published', 'meta_title', 'meta_description']) {
      if (req.body[key] !== undefined) updateData[key] = req.body[key];
    }

    const { data: updated, error } = await supabase.from('dreams').update(updateData).eq('id', id).select().single();
    if (error) throw new AppError('Failed to update dream', 500);
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { data: existing } = await supabase.from('dreams').select('id').eq('id', id).single();
    if (!existing) throw new AppError('Dream not found', 404);
    await supabase.from('dreams').delete().eq('id', id);
    res.json({ success: true, message: 'Dream deleted successfully' });
  } catch (error) { next(error); }
});

router.post('/:id/like', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { data: existing } = await supabase.from('dream_likes').select('*').eq('dream_id', id).eq('user_id', userId).single();

    if (existing) {
      await supabase.from('dream_likes').delete().eq('dream_id', id).eq('user_id', userId);
      const { data: dream } = await supabase.from('dreams').select('like_count').eq('id', id).single();
      await supabase.from('dreams').update({ like_count: Math.max(0, (dream?.like_count || 1) - 1) }).eq('id', id);
      res.json({ success: true, liked: false, message: 'Dream unliked' });
    } else {
      await supabase.from('dream_likes').insert({ id: uuidv4(), dream_id: id, user_id: userId });
      const { data: dream } = await supabase.from('dreams').select('like_count').eq('id', id).single();
      await supabase.from('dreams').update({ like_count: (dream?.like_count || 0) + 1 }).eq('id', id);
      res.json({ success: true, liked: true, message: 'Dream liked' });
    }
  } catch (error) { next(error); }
});

router.post('/:id/favorite', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { data: existing } = await supabase.from('favorites').select('*').eq('dream_id', id).eq('user_id', userId).single();

    if (existing) {
      await supabase.from('favorites').delete().eq('dream_id', id).eq('user_id', userId);
      res.json({ success: true, favorited: false, message: 'Removed from favorites' });
    } else {
      await supabase.from('favorites').insert({ id: uuidv4(), dream_id: id, user_id: userId });
      res.json({ success: true, favorited: true, message: 'Added to favorites' });
    }
  } catch (error) { next(error); }
});

router.get('/:id/comments', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('comments').select('*, profiles(full_name, avatar_url)').eq('dream_id', id).eq('is_approved', true).order('created_at', { ascending: false });
    if (error) throw new AppError('Failed to fetch comments', 500);
    const comments = (data || []).map((c: any) => ({ ...c, author_name: c.profiles?.full_name, author_avatar: c.profiles?.avatar_url }));
    res.json({ success: true, data: comments });
  } catch (error) { next(error); }
});

router.post('/:id/comments', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;
    if (!content || content.trim().length === 0) throw new AppError('Comment content is required', 400);

    const commentId = uuidv4();
    const { data: newComment, error } = await supabase.from('comments').insert({ id: commentId, content, dream_id: id, user_id: userId, is_approved: true, like_count: 0 }).select('*, profiles(full_name, avatar_url)').single();
    if (error) throw new AppError('Failed to add comment', 500);

    const result: any = { ...newComment, author_name: (newComment as any).profiles?.full_name, author_avatar: (newComment as any).profiles?.avatar_url };
    delete result.profiles;
    res.status(201).json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.get('/:id/similar', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;
    const { data: currentDream } = await supabase.from('dreams').select('category_id').eq('id', id).single();
    if (!currentDream) throw new AppError('Dream not found', 404);

    const { data, error } = await supabase.from('dreams').select('*, categories(name)').eq('category_id', currentDream.category_id).neq('id', id).eq('is_published', true).order('view_count', { ascending: false }).limit(limit);
    if (error) throw new AppError('Failed to fetch similar dreams', 500);
    const similar = (data || []).map((d: any) => ({ ...d, category_name: d.categories?.name }));
    res.json({ success: true, data: similar });
  } catch (error) { next(error); }
});

export default router;
