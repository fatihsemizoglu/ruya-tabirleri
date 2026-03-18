import { Router, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database.js';
import { authMiddleware, optionalAuthMiddleware, requireAdmin, requireModerator, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorMiddleware.js';
import type { Dream, Category, Comment, DreamLike, Favorite, ViewHistory } from '../types/index.js';

const router = Router();

// Get all dreams with pagination and filters
router.get('/', optionalAuthMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const category_id = req.query.category_id as string;
    const search = req.query.search as string;
    const is_featured = req.query.is_featured === 'true';
    const sort_by = (req.query.sort_by as string) || 'created_at';
    const sort_order = (req.query.sort_order as string) || 'DESC';

    let whereClause = 'WHERE is_published = TRUE';
    const params: (string | number | boolean)[] = [];

    if (category_id) {
      whereClause += ' AND category_id = ?';
      params.push(category_id);
    }

    if (search) {
      whereClause += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (req.query.is_featured !== undefined) {
      whereClause += ' AND is_featured = ?';
      params.push(is_featured);
    }

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as count FROM dreams ${whereClause}`,
      params
    ) as [any[], any];
    const total = countResult[0].count;

    // Get dreams
    const validSortColumns = ['created_at', 'view_count', 'like_count', 'title'];
    const validSortOrders = ['ASC', 'DESC'];
    const safeSortBy = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const safeSortOrder = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

    const [dreams] = await pool.execute(
      `SELECT d.*, c.name as category_name, c.slug as category_slug 
       FROM dreams d 
       LEFT JOIN categories c ON d.category_id = c.id 
       ${whereClause} 
       ORDER BY d.${safeSortBy} ${safeSortOrder} 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ) as [any[], any];

    res.json({
      success: true,
      data: dreams,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get featured dreams
router.get('/featured', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    const [dreams] = await pool.execute(
      `SELECT d.*, c.name as category_name, c.slug as category_slug 
       FROM dreams d 
       LEFT JOIN categories c ON d.category_id = c.id 
       WHERE d.is_published = TRUE AND d.is_featured = TRUE 
       ORDER BY d.view_count DESC 
       LIMIT ?`,
      [limit]
    ) as [any[], any];

    res.json({ success: true, data: dreams });
  } catch (error) {
    next(error);
  }
});

// Get dream by slug
router.get('/:slug', optionalAuthMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;

    const [dreams] = await pool.execute(
      `SELECT d.*, c.name as category_name, c.slug as category_slug 
       FROM dreams d 
       LEFT JOIN categories c ON d.category_id = c.id 
       WHERE d.slug = ?`,
      [slug]
    ) as [any[], any];

    if (dreams.length === 0) {
      throw new AppError('Dream not found', 404);
    }

    const dream = dreams[0];

    // Increment view count
    await pool.execute(
      'UPDATE dreams SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?',
      [dream.id]
    );

    // Record view history if user is authenticated
    if (req.user) {
      // Check if already viewed
      const [existing] = await pool.execute(
        'SELECT * FROM view_history WHERE user_id = ? AND dream_id = ?',
        [req.user.id, dream.id]
      ) as [any[], any];

      if (existing.length === 0) {
        await pool.execute(
          'INSERT INTO view_history (id, user_id, dream_id, viewed_at) VALUES (?, ?, ?, NOW())',
          [uuidv4(), req.user.id, dream.id]
        );
      } else {
        await pool.execute(
          'UPDATE view_history SET viewed_at = NOW() WHERE user_id = ? AND dream_id = ?',
          [req.user.id, dream.id]
        );
      }
    }

    // Check if user liked/favorited
    let isLiked = false;
    let isFavorited = false;

    if (req.user) {
      const [likes] = await pool.execute(
        'SELECT * FROM dream_likes WHERE dream_id = ? AND user_id = ?',
        [dream.id, req.user.id]
      ) as [any[], any];
      isLiked = likes.length > 0;

      const [favorites] = await pool.execute(
        'SELECT * FROM favorites WHERE dream_id = ? AND user_id = ?',
        [dream.id, req.user.id]
      ) as [any[], any];
      isFavorited = favorites.length > 0;
    }

    res.json({
      success: true,
      data: {
        ...dream,
        isLiked,
        isFavorited,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create dream (admin/moderator only)
router.post('/', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      title,
      slug,
      content,
      category_id,
      islamic_interpretation,
      psychological_interpretation,
      keywords,
      is_featured,
      is_published,
      meta_title,
      meta_description,
    } = req.body;

    if (!title || !slug || !content) {
      throw new AppError('Title, slug, and content are required', 400);
    }

    // Check if slug already exists
    const [existingSlug] = await pool.execute(
      'SELECT id FROM dreams WHERE slug = ?',
      [slug]
    ) as [any[], any];

    if (existingSlug.length > 0) {
      throw new AppError('A dream with this slug already exists', 400);
    }

    const id = uuidv4();

    await pool.execute(
      `INSERT INTO dreams (
        id, title, slug, content, category_id, islamic_interpretation, psychological_interpretation,
        keywords, is_featured, is_published, meta_title, meta_description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        title,
        slug,
        content,
        category_id || null,
        islamic_interpretation || null,
        psychological_interpretation || null,
        JSON.stringify(keywords || []),
        is_featured || false,
        is_published !== undefined ? is_published : true,
        meta_title || null,
        meta_description || null,
      ]
    );

    const [newDream] = await pool.execute(
      'SELECT * FROM dreams WHERE id = ?',
      [id]
    ) as [any[], any];

    res.status(201).json({ success: true, data: newDream[0] });
  } catch (error) {
    next(error);
  }
});

// Update dream (admin/moderator only)
router.put('/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      content,
      category_id,
      islamic_interpretation,
      psychological_interpretation,
      keywords,
      is_featured,
      is_published,
      meta_title,
      meta_description,
    } = req.body;

    const [existing] = await pool.execute(
      'SELECT * FROM dreams WHERE id = ?',
      [id]
    ) as [any[], any];

    if (existing.length === 0) {
      throw new AppError('Dream not found', 404);
    }

    // Check slug uniqueness
    if (slug && slug !== existing[0].slug) {
      const [existingSlug] = await pool.execute(
        'SELECT id FROM dreams WHERE slug = ? AND id != ?',
        [slug, id]
      ) as [any[], any];

      if (existingSlug.length > 0) {
        throw new AppError('A dream with this slug already exists', 400);
      }
    }

    await pool.execute(
      `UPDATE dreams SET 
        title = COALESCE(?, title),
        slug = COALESCE(?, slug),
        content = COALESCE(?, content),
        category_id = ?,
        islamic_interpretation = ?,
        psychological_interpretation = ?,
        keywords = ?,
        is_featured = ?,
        is_published = ?,
        meta_title = ?,
        meta_description = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        title,
        slug,
        content,
        category_id,
        islamic_interpretation,
        psychological_interpretation,
        keywords ? JSON.stringify(keywords) : null,
        is_featured,
        is_published,
        meta_title,
        meta_description,
        id,
      ]
    );

    const [updated] = await pool.execute(
      'SELECT * FROM dreams WHERE id = ?',
      [id]
    ) as [any[], any];

    res.json({ success: true, data: updated[0] });
  } catch (error) {
    next(error);
  }
});

// Delete dream (admin only)
router.delete('/:id', authMiddleware, requireAdmin, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute(
      'SELECT * FROM dreams WHERE id = ?',
      [id]
    ) as [any[], any];

    if (existing.length === 0) {
      throw new AppError('Dream not found', 404);
    }

    await pool.execute('DELETE FROM dreams WHERE id = ?', [id]);

    res.json({ success: true, message: 'Dream deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Like/Unlike dream
router.post('/:id/like', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const [existing] = await pool.execute(
      'SELECT * FROM dream_likes WHERE dream_id = ? AND user_id = ?',
      [id, userId]
    ) as [any[], any];

    if (existing.length > 0) {
      // Unlike
      await pool.execute('DELETE FROM dream_likes WHERE dream_id = ? AND user_id = ?', [id, userId]);
      await pool.execute(
        'UPDATE dreams SET like_count = GREATEST(0, COALESCE(like_count, 0) - 1) WHERE id = ?',
        [id]
      );
      res.json({ success: true, liked: false, message: 'Dream unliked' });
    } else {
      // Like
      await pool.execute(
        'INSERT INTO dream_likes (id, dream_id, user_id, created_at) VALUES (?, ?, ?, NOW())',
        [uuidv4(), id, userId]
      );
      await pool.execute(
        'UPDATE dreams SET like_count = COALESCE(like_count, 0) + 1 WHERE id = ?',
        [id]
      );
      res.json({ success: true, liked: true, message: 'Dream liked' });
    }
  } catch (error) {
    next(error);
  }
});

// Add/Remove from favorites
router.post('/:id/favorite', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const [existing] = await pool.execute(
      'SELECT * FROM favorites WHERE dream_id = ? AND user_id = ?',
      [id, userId]
    ) as [any[], any];

    if (existing.length > 0) {
      // Remove from favorites
      await pool.execute('DELETE FROM favorites WHERE dream_id = ? AND user_id = ?', [id, userId]);
      res.json({ success: true, favorited: false, message: 'Removed from favorites' });
    } else {
      // Add to favorites
      await pool.execute(
        'INSERT INTO favorites (id, dream_id, user_id, created_at) VALUES (?, ?, ?, NOW())',
        [uuidv4(), id, userId]
      );
      res.json({ success: true, favorited: true, message: 'Added to favorites' });
    }
  } catch (error) {
    next(error);
  }
});

// Get comments for a dream
router.get('/:id/comments', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const [comments] = await pool.execute(
      `SELECT c.*, p.full_name as author_name, p.avatar_url as author_avatar 
       FROM comments c 
       JOIN profiles p ON c.user_id = p.user_id 
       WHERE c.dream_id = ? AND c.is_approved = TRUE 
       ORDER BY c.created_at DESC`,
      [id]
    ) as [any[], any];

    res.json({ success: true, data: comments });
  } catch (error) {
    next(error);
  }
});

// Add comment to dream
router.post('/:id/comments', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user!.id;

    if (!content || content.trim().length === 0) {
      throw new AppError('Comment content is required', 400);
    }

    const commentId = uuidv4();

    await pool.execute(
      `INSERT INTO comments (id, content, dream_id, user_id, is_approved, like_count, created_at, updated_at) 
       VALUES (?, ?, ?, ?, TRUE, 0, NOW(), NOW())`,
      [commentId, content, id, userId]
    );

    const [newComment] = await pool.execute(
      `SELECT c.*, p.full_name as author_name, p.avatar_url as author_avatar 
       FROM comments c 
       JOIN profiles p ON c.user_id = p.user_id 
       WHERE c.id = ?`,
      [commentId]
    ) as [any[], any];

    res.status(201).json({ success: true, data: newComment[0] });
  } catch (error) {
    next(error);
  }
});

// Get similar dreams
router.get('/:id/similar', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    // Get the current dream's category
    const [currentDream] = await pool.execute(
      'SELECT category_id FROM dreams WHERE id = ?',
      [id]
    ) as [any[], any];

    if (currentDream.length === 0) {
      throw new AppError('Dream not found', 404);
    }

    const categoryId = currentDream[0].category_id;

    // Get similar dreams from same category
    const [similar] = await pool.execute(
      `SELECT d.*, c.name as category_name 
       FROM dreams d 
       LEFT JOIN categories c ON d.category_id = c.id 
       WHERE d.category_id = ? AND d.id != ? AND d.is_published = TRUE 
       ORDER BY d.view_count DESC 
       LIMIT ?`,
      [categoryId, id, limit]
    ) as [any[], any];

    res.json({ success: true, data: similar });
  } catch (error) {
    next(error);
  }
});

export default router;