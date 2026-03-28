import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database.js';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth.js';
import type { Profile, UserRole, Favorite, ViewHistory, Dream, DreamJournalEntry, DreamLike } from '../types/index.js';

const router = Router();

// Get user favorites
router.get('/favorites', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await (pool.execute as any)(
      'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
      [userId]
    );
    const total = countResult[0].count;

    // Get favorites with dream details
    const [favorites] = await (pool.execute as any)(
      `SELECT f.*, d.*, c.name as category_name 
       FROM favorites f 
       JOIN dreams d ON f.dream_id = d.id 
       LEFT JOIN categories c ON d.category_id = c.id 
       WHERE f.user_id = ? 
       ORDER BY f.created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    res.json({
      success: true,
      data: favorites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ success: false, error: 'Failed to get favorites' });
  }
});

// Get user view history
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await (pool.execute as any)(
      'SELECT COUNT(*) as count FROM history WHERE user_id = ?',
      [userId]
    );
    const total = countResult[0].count;

    // Get view history with dream details
    const [history] = await (pool.execute as any)(
      `SELECT vh.*, d.*, c.name as category_name 
       FROM view_history vh 
       JOIN dreams d ON vh.dream_id = d.id 
       LEFT JOIN categories c ON d.category_id = c.id 
       WHERE vh.user_id = ? 
       ORDER BY vh.viewed_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    res.json({
      success: true,
      data: history,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, error: 'Failed to get view history' });
  }
});

// Get user dream journal
router.get('/journal', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await (pool.execute as any)(
      'SELECT COUNT(*) as count FROM dream_journal WHERE user_id = ?',
      [userId]
    );
    const total = countResult[0].count;

    // Get journal entries
    const [entries] = await (pool.execute as any)(
      `SELECT * FROM dream_journal 
       WHERE user_id = ? 
       ORDER BY dream_date DESC, created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    res.json({
      success: true,
      data: entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get journal error:', error);
    res.status(500).json({ success: false, error: 'Failed to get dream journal' });
  }
});

// Create journal entry
router.post('/journal', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { title, content, dream_date, mood, tags, is_private } = req.body;

    if (!title || !content) {
      res.status(400).json({ success: false, error: 'Title and content are required' });
      return;
    }

    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();

    await pool.execute(
      `INSERT INTO dream_journal (id, user_id, title, content, dream_date, mood, tags, is_private, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        userId,
        title,
        content,
        dream_date || new Date(),
        mood || null,
        JSON.stringify(tags || []),
        is_private !== undefined ? is_private : true,
      ]
    );

    const [newEntry] = await (pool.execute as any)(
      'SELECT * FROM dream_journal WHERE id = ?',
      [id]
    );

    res.status(201).json({ success: true, data: newEntry[0] });
  } catch (error) {
    console.error('Create journal entry error:', error);
    res.status(500).json({ success: false, error: 'Failed to create journal entry' });
  }
});

// Update journal entry
router.put('/journal/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { title, content, dream_date, mood, tags, is_private } = req.body;

    // Check ownership
    const [existing] = await (pool.execute as any)(
      'SELECT * FROM dream_journal WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      res.status(404).json({ success: false, error: 'Journal entry not found' });
      return;
    }

    await pool.execute(
      `UPDATE dream_journal SET 
        title = COALESCE(?, title),
        content = COALESCE(?, content),
        dream_date = COALESCE(?, dream_date),
        mood = ?,
        tags = ?,
        is_private = ?,
        updated_at = NOW()
      WHERE id = ? AND user_id = ?`,
      [title, content, dream_date, mood, tags ? JSON.stringify(tags) : null, is_private, id, userId]
    );

    const [updated] = await (pool.execute as any)(
      'SELECT * FROM dream_journal WHERE id = ?',
      [id]
    );

    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Update journal entry error:', error);
    res.status(500).json({ success: false, error: 'Failed to update journal entry' });
  }
});

// Delete journal entry
router.delete('/journal/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    // Check ownership
    const [existing] = await (pool.execute as any)(
      'SELECT * FROM dream_journal WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      res.status(404).json({ success: false, error: 'Journal entry not found' });
      return;
    }

    await pool.execute('DELETE FROM dream_journal WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({ success: true, message: 'Journal entry deleted successfully' });
  } catch (error) {
    console.error('Delete journal entry error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete journal entry' });
  }
});

// Get user likes
router.get('/likes', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [likes] = await (pool.execute as any)(
      `SELECT dl.*, d.title, d.slug 
       FROM dream_likes dl 
       JOIN dreams d ON dl.dream_id = d.id 
       WHERE dl.user_id = ? 
       ORDER BY dl.created_at DESC`,
      [userId]
    );

    res.json({ success: true, data: likes });
  } catch (error) {
    console.error('Get likes error:', error);
    res.status(500).json({ success: false, error: 'Failed to get likes' });
  }
});

// Remove favorite
router.delete('/favorites/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await pool.execute('DELETE FROM favorites WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({ success: true, message: 'Favorite removed successfully' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove favorite' });
  }
});

// Clear all history
router.delete('/history', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await pool.execute('DELETE FROM view_history WHERE user_id = ?', [userId]);

    res.json({ success: true, message: 'History cleared successfully' });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ success: false, error: 'Failed to clear history' });
  }
});

// Remove single history item
router.delete('/history/:id', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    await pool.execute('DELETE FROM view_history WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({ success: true, message: 'History item removed successfully' });
  } catch (error) {
    console.error('Remove history item error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove history item' });
  }
});

// Get user stats
router.get('/stats', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    // Get favorites count
    const [favCount] = await (pool.execute as any)(
      'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
      [userId]
    );

    // Get view history count
    const [viewCount] = await (pool.execute as any)(
      'SELECT COUNT(*) as count FROM view_history WHERE user_id = ?',
      [userId]
    );

    // Get comments count
    const [commentCount] = await (pool.execute as any)(
      'SELECT COUNT(*) as count FROM comments WHERE user_id = ?',
      [userId]
    );

    // Get total likes on user's comments
    const [likesResult] = await (pool.execute as any)(
      'SELECT COALESCE(SUM(like_count), 0) as total FROM comments WHERE user_id = ?',
      [userId]
    );

    // Get journal entries count and mood distribution
    const [journalCount] = await (pool.execute as any)(
      'SELECT COUNT(*) as count FROM dream_journal WHERE user_id = ?',
      [userId]
    );

    const [moodData] = await (pool.execute as any)(
      'SELECT mood, COUNT(*) as count FROM dream_journal WHERE user_id = ? AND mood IS NOT NULL GROUP BY mood',
      [userId]
    );

    const moodDistribution: Record<string, number> = {};
    moodData.forEach((item) => {
      moodDistribution[item.mood] = item.count;
    });

    // Get recent comments with dream info
    const [recentComments] = await (pool.execute as any)(
      `SELECT c.created_at, d.title, d.slug 
       FROM comments c 
       JOIN dreams d ON c.dream_id = d.id 
       WHERE c.user_id = ? 
       ORDER BY c.created_at DESC 
       LIMIT 3`,
      [userId]
    );

    // Get recent journal entries
    const [recentJournal] = await (pool.execute as any)(
      'SELECT title, created_at FROM dream_journal WHERE user_id = ? ORDER BY created_at DESC LIMIT 3',
      [userId]
    );

    // Build recent activity
    const recentActivity: { type: string; title: string; date: string; link?: string }[] = [];

    recentComments.forEach((comment: any) => {
      recentActivity.push({
        type: 'comment',
        title: `"${comment.title || 'Rüya'}" için yorum yaptiniz`,
        date: comment.created_at,
        link: comment.slug ? `/ruya/${comment.slug}` : undefined,
      });
    });

    recentJournal.forEach((entry) => {
      recentActivity.push({
        type: 'journal',
        title: `"${entry.title}" rüyasini kaydettiniz`,
        date: entry.created_at,
      });
    });

    // Sort by date
    recentActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json({
      success: true,
      data: {
        totalFavorites: favCount[0].count,
        totalViews: viewCount[0].count,
        totalComments: commentCount[0].count,
        totalLikes: likesResult[0].total,
        journalEntries: journalCount[0].count,
        moodDistribution,
        recentActivity: recentActivity.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get stats' });
  }
});

// Get user comments
router.get('/comments', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const [comments] = await (pool.execute as any)(
      `SELECT c.*, d.title, d.slug 
       FROM comments c 
       JOIN dreams d ON c.dream_id = d.id 
       WHERE c.user_id = ? 
       ORDER BY c.created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );

    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, error: 'Failed to get comments' });
  }
});

// Admin: Get all users
router.get('/all', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get total count
    const [countResult] = await (pool.execute as any)(
      'SELECT COUNT(*) as count FROM profiles'
    );
    const total = countResult[0].count;

    // Get users with roles
    const [users] = await (pool.execute as any)(
      `SELECT p.*, ur.role 
       FROM profiles p 
       LEFT JOIN user_roles ur ON p.user_id = ur.user_id 
       ORDER BY p.created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to get users' });
  }
});

// Admin: Update user role
router.put('/:id/role', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'moderator', 'user'].includes(role)) {
      res.status(400).json({ success: false, error: 'Invalid role' });
      return;
    }

    // Use INSERT...ON DUPLICATE KEY UPDATE to create or update the role
    await pool.execute(
      'INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE role = VALUES(role)',
      [uuidv4(), id, role]
    );

    res.json({ success: true, message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user role' });
  }
});

export default router;