import { Router, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, optionalAuthMiddleware, requireAdmin, requireModerator, AuthRequest } from '../middleware/auth';
import { dreamService } from '../services/dreamService';
import { cacheMiddleware } from '../middleware/cache';
import { supabase } from '../config/database';

const router = Router();

// Apply caching to public routes
router.get('/', cacheMiddleware({ ttl: 300 }), optionalAuthMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isAdmin = req.user && ['admin', 'moderator'].includes(req.user.role);
    const result = await dreamService.getDreams({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      category_id: req.query.category_id as string,
      search: req.query.search as string,
      is_featured: req.query.is_featured === 'true',
      is_published: req.query.is_published as string,
      sort_by: req.query.sort_by as string,
      sort_order: req.query.sort_order as string,
      isAdmin,
    });
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

router.get('/featured', cacheMiddleware({ ttl: 600 }), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const data = await dreamService.getFeaturedDreams(limit);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/:slug', optionalAuthMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const userId = req.user?.id;
    const data = await dreamService.getDreamBySlug(slug, userId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await dreamService.createDream(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = await dreamService.updateDream(id, req.body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await dreamService.deleteDream(id);
    res.json(result);
  } catch (error) { next(error); }
});

router.post('/:id/like', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const result = await dreamService.toggleLike(id, userId);
    res.json(result);
  } catch (error) { next(error); }
});

router.post('/:id/favorite', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const result = await dreamService.toggleFavorite(id, userId);
    res.json(result);
  } catch (error) { next(error); }
});

router.get('/:id/comments', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles(full_name, avatar_url)')
      .eq('dream_id', id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false });
    if (error) throw new Error('Failed to fetch comments');
    const comments = (data || []).map((c: any) => ({ ...c, author_name: c.profiles?.full_name, author_avatar: c.profiles?.avatar_url }));
    res.json({ success: true, data: comments });
  } catch (error) { next(error); }
});

router.post('/:id/comments', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;
    if (!content || content.trim().length === 0) throw new Error('Comment content is required');

    const { data: newComment, error } = await supabase
      .from('comments')
      .insert({ id: uuidv4(), content, dream_id: id, user_id: userId, is_approved: true, like_count: 0 })
      .select('*, profiles(full_name, avatar_url)')
      .single();
    if (error) throw new Error('Failed to add comment');

    const result: any = { ...newComment, author_name: (newComment as any).profiles?.full_name, author_avatar: (newComment as any).profiles?.avatar_url };
    delete result.profiles;
    res.status(201).json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.get('/:id/similar', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;
    const data = await dreamService.getSimilarDreams(id, limit);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

export default router;
