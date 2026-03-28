import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth';
import type { Dream, SearchLog } from '../types/index';

const router = Router();

// Search dreams
router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
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

    // Get total count
    const { count } = await supabase
      .from('dreams')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,keywords.ilike.%${searchTerm}%`);

    const total = count || 0;

    // Get results
    const { data: dreams, error } = await supabase
      .from('dreams')
      .select('*, categories(name)')
      .eq('is_published', true)
      .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,keywords.ilike.%${searchTerm}%`)
      .order('view_count', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const result = (dreams || []).map((d: any) => ({
      ...d,
      category_name: d.categories?.name,
    }));

    // Log search
    const userId = req.user?.id || null;
    await supabase
      .from('search_logs')
      .insert({
        id: uuidv4(),
        query: searchTerm,
        results_count: total,
        user_id: userId,
        created_at: new Date().toISOString(),
      });

    res.json({
      success: true,
      data: result,
      query: q,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

// Get search suggestions (autocomplete)
router.get('/suggestions', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const q = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!q || q.trim().length < 2) {
      res.json({ success: true, data: [] });
      return;
    }

    const searchTerm = q.trim();

    // Get title suggestions
    const { data: dreams, error } = await supabase
      .from('dreams')
      .select('title, slug')
      .eq('is_published', true)
      .ilike('title', `${searchTerm}%`)
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ success: true, data: dreams || [] });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ success: false, error: 'Failed to get suggestions' });
  }
});

// Get popular searches
router.get('/popular', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    // Get search logs from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: logs, error } = await supabase
      .from('search_logs')
      .select('query')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) throw error;

    // Count queries in application logic
    const queryCount: Record<string, number> = {};
    (logs || []).forEach((log: any) => {
      queryCount[log.query] = (queryCount[log.query] || 0) + 1;
    });

    const searches = Object.entries(queryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }));

    res.json({ success: true, data: searches });
  } catch (error) {
    console.error('Get popular searches error:', error);
    res.status(500).json({ success: false, error: 'Failed to get popular searches' });
  }
});

// Get search by letter (alphabetical)
router.get('/alphabet/:letter', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { letter } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    if (!letter || letter.length !== 1) {
      res.status(400).json({ success: false, error: 'Invalid letter parameter' });
      return;
    }

    const letterPattern = `${letter.toUpperCase()}%`;

    // Get total count
    const { count } = await supabase
      .from('dreams')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true)
      .ilike('title', letterPattern);

    const total = count || 0;

    // Get dreams
    const { data: dreams, error } = await supabase
      .from('dreams')
      .select('*, categories(name)')
      .eq('is_published', true)
      .ilike('title', letterPattern)
      .order('title', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const result = (dreams || []).map((d: any) => ({
      ...d,
      category_name: d.categories?.name,
    }));

    res.json({
      success: true,
      data: result,
      letter,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Alphabet search error:', error);
    res.status(500).json({ success: false, error: 'Alphabet search failed' });
  }
});

export default router;
