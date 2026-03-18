import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database.js';
import { optionalAuthMiddleware, AuthRequest } from '../middleware/auth.js';
import type { Dream, SearchLog } from '../types/index.js';

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

    const searchTerm = `%${q.trim()}%`;

    // Get total count
    const [countResult] = await pool.execute<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM dreams 
       WHERE is_published = TRUE 
       AND (title LIKE ? OR content LIKE ? OR keywords LIKE ?)`,
      [searchTerm, searchTerm, searchTerm]
    );
    const total = countResult[0].count;

    // Get results
    const [dreams] = await pool.execute<(Dream & { category_name: string })[]>(
      `SELECT d.*, c.name as category_name 
       FROM dreams d 
       LEFT JOIN categories c ON d.category_id = c.id 
       WHERE d.is_published = TRUE 
       AND (d.title LIKE ? OR d.content LIKE ? OR d.keywords LIKE ?) 
       ORDER BY d.view_count DESC, d.created_at DESC 
       LIMIT ? OFFSET ?`,
      [searchTerm, searchTerm, searchTerm, limit, offset]
    );

    // Log search
    const userId = req.user?.id || null;
    await pool.execute(
      'INSERT INTO search_logs (id, query, results_count, user_id, created_at) VALUES (?, ?, ?, ?, NOW())',
      [uuidv4(), q.trim(), total, userId]
    );

    res.json({
      success: true,
      data: dreams,
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

    const searchTerm = `${q.trim()}%`;

    // Get title suggestions
    const [dreams] = await pool.execute<{ title: string; slug: string }[]>(
      `SELECT DISTINCT title, slug FROM dreams 
       WHERE is_published = TRUE AND title LIKE ? 
       ORDER BY view_count DESC 
       LIMIT ?`,
      [searchTerm, limit]
    );

    res.json({ success: true, data: dreams });
  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ success: false, error: 'Failed to get suggestions' });
  }
});

// Get popular searches
router.get('/popular', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const [searches] = await pool.execute<{ query: string; count: number }[]>(
      `SELECT query, COUNT(*) as count 
       FROM search_logs 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) 
       GROUP BY query 
       ORDER BY count DESC 
       LIMIT ?`,
      [limit]
    );

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
    const [countResult] = await pool.execute<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM dreams 
       WHERE is_published = TRUE AND title LIKE ?`,
      [letterPattern]
    );
    const total = countResult[0].count;

    // Get dreams
    const [dreams] = await pool.execute<(Dream & { category_name: string })[]>(
      `SELECT d.*, c.name as category_name 
       FROM dreams d 
       LEFT JOIN categories c ON d.category_id = c.id 
       WHERE d.is_published = TRUE AND d.title LIKE ? 
       ORDER BY d.title ASC 
       LIMIT ? OFFSET ?`,
      [letterPattern, limit, offset]
    );

    res.json({
      success: true,
      data: dreams,
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