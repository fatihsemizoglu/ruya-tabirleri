import { Router, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorMiddleware';

const router = Router();

router.get('/favorites', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const [{ count }, { data: favorites }] = await Promise.all([
      supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('favorites').select('*, dreams(*, categories(name))').eq('user_id', userId)
        .order('created_at', { ascending: false }).range(offset, offset + limit - 1),
    ]);

    const total = count || 0;
    const result = (favorites || []).map((f: any) => ({
      ...f, ...(f.dreams || {}), category_name: f.dreams?.categories?.name,
    }));

    res.json({ success: true, data: result, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.get('/history', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const [{ count }, { data: history }] = await Promise.all([
      supabase.from('view_history').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('view_history').select('*, dreams(*, categories(name))').eq('user_id', userId)
        .order('viewed_at', { ascending: false }).range(offset, offset + limit - 1),
    ]);

    const total = count || 0;
    const result = (history || []).map((h: any) => ({
      ...h, ...(h.dreams || {}), category_name: h.dreams?.categories?.name,
    }));

    res.json({ success: true, data: result, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.get('/journal', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const [{ count }, { data: entries }] = await Promise.all([
      supabase.from('dream_journal').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('dream_journal').select('*').eq('user_id', userId)
        .order('dream_date', { ascending: false }).order('created_at', { ascending: false }).range(offset, offset + limit - 1),
    ]);

    const total = count || 0;
    res.json({ success: true, data: entries || [], pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.post('/journal', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { title, content, dream_date, mood, tags, is_private } = req.body;
    if (!title || !content) throw new AppError('Title and content are required', 400);

    const id = uuidv4();
    const { data: newEntry, error } = await supabase
      .from('dream_journal')
      .insert({
        id, user_id: userId, title, content,
        dream_date: dream_date || new Date().toISOString(),
        mood: mood || null,
        tags: JSON.stringify(tags || []),
        is_private: is_private !== undefined ? is_private : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to create journal entry', 500);
    res.status(201).json({ success: true, data: newEntry });
  } catch (error) { next(error); }
});

router.put('/journal/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, content, dream_date, mood, tags, is_private } = req.body;

    const { data: existing } = await supabase.from('dream_journal').select('*').eq('id', id).eq('user_id', userId).single();
    if (!existing) throw new AppError('Journal entry not found', 404);

    const { data: updated, error } = await supabase
      .from('dream_journal')
      .update({
        title: title ?? existing.title, content: content ?? existing.content,
        dream_date: dream_date ?? existing.dream_date,
        mood: mood !== undefined ? mood : existing.mood,
        tags: tags ? JSON.stringify(tags) : existing.tags,
        is_private: is_private !== undefined ? is_private : existing.is_private,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id).eq('user_id', userId).select().single();

    if (error) throw new AppError('Failed to update journal entry', 500);
    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
});

router.delete('/journal/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const { data: existing } = await supabase.from('dream_journal').select('*').eq('id', id).eq('user_id', userId).single();
    if (!existing) throw new AppError('Journal entry not found', 404);

    await supabase.from('dream_journal').delete().eq('id', id).eq('user_id', userId);
    res.json({ success: true, message: 'Journal entry deleted successfully' });
  } catch (error) { next(error); }
});

router.get('/likes', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { data: likes, error } = await supabase
      .from('dream_likes').select('*, dreams(title, slug)').eq('user_id', userId).order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch likes', 500);
    const result = (likes || []).map((l: any) => ({ ...l, title: l.dreams?.title, slug: l.dreams?.slug }));
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.post('/favorites', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { dream_id } = req.body;
    if (!dream_id) throw new AppError('dream_id is required', 400);

    const { data: existing } = await supabase.from('favorites').select('id').eq('user_id', userId).eq('dream_id', dream_id).single();
    if (existing) {
      res.json({ success: true, message: 'Already in favorites' });
      return;
    }

    const id = uuidv4();
    const { data: favorite, error } = await supabase
      .from('favorites')
      .insert({ id, user_id: userId, dream_id })
      .select()
      .single();

    if (error) throw new AppError('Failed to add favorite', 500);
    res.status(201).json({ success: true, data: favorite });
  } catch (error) { next(error); }
});

router.delete('/favorites/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { error } = await supabase.from('favorites').delete().eq('id', req.params.id).eq('user_id', userId);
    if (error) throw new AppError('Failed to remove favorite', 500);
    res.json({ success: true, message: 'Favorite removed successfully' });
  } catch (error) { next(error); }
});

router.delete('/history', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error } = await supabase.from('view_history').delete().eq('user_id', req.user!.id);
    if (error) throw new AppError('Failed to clear history', 500);
    res.json({ success: true, message: 'History cleared successfully' });
  } catch (error) { next(error); }
});

router.delete('/history/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error } = await supabase.from('view_history').delete().eq('id', req.params.id).eq('user_id', req.user!.id);
    if (error) throw new AppError('Failed to remove history item', 500);
    res.json({ success: true, message: 'History item removed successfully' });
  } catch (error) { next(error); }
});

router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [
      { count: favCount }, { count: viewCount }, { count: commentCount }, { count: journalCount },
      { data: userComments }, { data: journalEntries },
    ] = await Promise.all([
      supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('view_history').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('comments').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('dream_journal').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('comments').select('like_count').eq('user_id', userId),
      supabase.from('dream_journal').select('mood').eq('user_id', userId).not('mood', 'is', null),
    ]);

    const totalLikes = (userComments || []).reduce((sum: number, c: any) => sum + (c.like_count || 0), 0);

    const moodDistribution: Record<string, number> = {};
    (journalEntries || []).forEach((item: any) => {
      if (item.mood) moodDistribution[item.mood] = (moodDistribution[item.mood] || 0) + 1;
    });

    const [{ data: recentComments }, { data: recentJournal }] = await Promise.all([
      supabase.from('comments').select('created_at, dreams(title, slug)').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
      supabase.from('dream_journal').select('title, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
    ]);

    const recentActivity: { type: string; title: string; date: string; link?: string }[] = [];
    (recentComments || []).forEach((comment: any) => {
      recentActivity.push({ type: 'comment', title: `"${comment.dreams?.title || 'Rüya'}" için yorum yaptiniz`, date: comment.created_at, link: comment.dreams?.slug ? `/ruya/${comment.dreams.slug}` : undefined });
    });
    (recentJournal || []).forEach((entry: any) => {
      recentActivity.push({ type: 'journal', title: `"${entry.title}" rüyasini kaydettiniz`, date: entry.created_at });
    });
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({
      success: true,
      data: { totalFavorites: favCount || 0, totalViews: viewCount || 0, totalComments: commentCount || 0, totalLikes, journalEntries: journalCount || 0, moodDistribution, recentActivity: recentActivity.slice(0, 5) },
    });
  } catch (error) { next(error); }
});

router.get('/comments', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const { data: comments, error } = await supabase
      .from('comments').select('*, dreams(title, slug)').eq('user_id', userId).order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    if (error) throw new AppError('Failed to fetch comments', 500);
    const result = (comments || []).map((c: any) => ({ ...c, title: c.dreams?.title, slug: c.dreams?.slug }));
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.get('/all', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const [{ count }, { data: users }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*, user_roles(role)').order('created_at', { ascending: false }).range(offset, offset + limit - 1),
    ]);

    const total = count || 0;
    const result = (users || []).map((u: any) => ({ ...u, role: u.user_roles?.[0]?.role }));
    res.json({ success: true, data: result, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.put('/:id/role', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['admin', 'moderator', 'user'].includes(role)) throw new AppError('Invalid role', 400);

    const { data: existing } = await supabase.from('user_roles').select('*').eq('user_id', id).single();

    if (existing) {
      await supabase.from('user_roles').update({ role }).eq('user_id', id);
    } else {
      await supabase.from('user_roles').insert({ id: uuidv4(), user_id: id, role, created_at: new Date().toISOString() });
    }

    res.json({ success: true, message: 'User role updated successfully' });
  } catch (error) { next(error); }
});

export default router;

