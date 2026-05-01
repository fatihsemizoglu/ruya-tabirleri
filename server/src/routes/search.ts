import { Router, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorMiddleware';

const router = Router();

router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const q = req.query.q as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    if (!q || q.trim().length === 0) {
      res.json({ success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } });
      return;
    }

    const searchTerm = q.trim();

    const [{ count }, { data: dreams }] = await Promise.all([
      supabase.from('dreams').select('*', { count: 'exact', head: true })
        .eq('is_published', true)
        .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,keywords.ilike.%${searchTerm}%`),
      supabase.from('dreams').select('*, categories(name)')
        .eq('is_published', true)
        .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,keywords.ilike.%${searchTerm}%`)
        .order('view_count', { ascending: false })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1),
    ]);

    const total = count || 0;
    const result = (dreams || []).map((d: any) => ({ ...d, category_name: d.categories?.name }));

    await supabase.from('search_logs').insert({
      id: uuidv4(), query: searchTerm, results_count: total,
      user_id: req.user?.id || null, created_at: new Date().toISOString(),
    });

    res.json({ success: true, data: result, query: q, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.get('/suggestions', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const q = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!q || q.trim().length < 2) {
      res.json({ success: true, data: [] });
      return;
    }

    const { data: dreams } = await supabase
      .from('dreams').select('title, slug')
      .eq('is_published', true)
      .ilike('title', `${q.trim()}%`)
      .order('view_count', { ascending: false })
      .limit(limit);

    res.json({ success: true, data: dreams || [] });
  } catch (error) { next(error); }
});

router.get('/popular', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: logs } = await supabase
      .from('search_logs').select('query')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const queryCount: Record<string, number> = {};
    (logs || []).forEach((log: any) => {
      queryCount[log.query] = (queryCount[log.query] || 0) + 1;
    });

    const searches = Object.entries(queryCount).sort((a, b) => b[1] - a[1]).slice(0, limit)
      .map(([query, count]) => ({ query, count }));

    res.json({ success: true, data: searches });
  } catch (error) { next(error); }
});

router.get('/alphabet/:letter', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { letter } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    if (!letter || letter.length !== 1) throw new AppError('Invalid letter parameter', 400);

    const [{ count }, { data: dreams }] = await Promise.all([
      supabase.from('dreams').select('*', { count: 'exact', head: true }).eq('is_published', true).ilike('title', `${letter.toUpperCase()}%`),
      supabase.from('dreams').select('*, categories(name)').eq('is_published', true).ilike('title', `${letter.toUpperCase()}%`)
        .order('title', { ascending: true }).range(offset, offset + limit - 1),
    ]);

    const total = count || 0;
    res.json({ success: true, data: (dreams || []).map((d: any) => ({ ...d, category_name: d.categories?.name })), letter, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

export default router;

