import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database.js';
import { authMiddleware, optionalAuthMiddleware, requireModerator, AuthRequest } from '../middleware/auth.js';
import type { BlogPost, BlogCategory, BlogComment, BlogLike, BlogSubscriber } from '../types/index.js';

const router = Router();

// Get all blog posts
router.get('/posts', optionalAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const category_id = req.query.category_id as string;
    const tag = req.query.tag as string;
    const is_featured = req.query.is_featured === 'true';

    let whereClause = 'WHERE is_published = TRUE';
    const params: (string | number | boolean)[] = [];

    if (category_id) {
      whereClause += ' AND category_id = ?';
      params.push(category_id);
    }

    if (tag) {
      whereClause += ' AND JSON_CONTAINS(tags, ?)';
      params.push(JSON.stringify(tag));
    }

    if (req.query.is_featured !== undefined) {
      whereClause += ' AND is_featured = ?';
      params.push(is_featured);
    }

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as count FROM blog_posts ${whereClause}`,
      params
    );
    const total = countResult[0]?.count ?? 0;

    // Get posts
    const [posts] = await pool.execute(
      `SELECT bp.*, p.full_name as author_name, bc.name as category_name 
       FROM blog_posts bp 
       JOIN profiles p ON bp.author_id = p.user_id 
       LEFT JOIN blog_categories bc ON bp.category_id = bc.id 
       ${whereClause} 
       ORDER BY bp.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get blog posts error:', error);
    res.status(500).json({ success: false, error: 'Failed to get blog posts' });
  }
});

// Get single blog post by slug
router.get('/posts/:slug', optionalAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const [posts] = await pool.execute(
      `SELECT bp.*, p.full_name as author_name, p.avatar_url as author_avatar, bc.name as category_name 
       FROM blog_posts bp 
       JOIN profiles p ON bp.author_id = p.user_id 
       LEFT JOIN blog_categories bc ON bp.category_id = bc.id 
       WHERE bp.slug = ?`,
      [slug]
    );

    if (posts.length === 0) {
      res.status(404).json({ success: false, error: 'Blog post not found' });
      return;
    }

    const post = posts[0];

    // Increment view count
    await pool.execute(
      'UPDATE blog_posts SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?',
      [post.id]
    );

    // Check if user liked
    let isLiked = false;
    if (req.user) {
      const [likes] = await pool.execute(
        'SELECT * FROM blog_likes WHERE post_id = ? AND user_id = ?',
        [post.id, req.user.id]
      ) as any;
      isLiked = (likes?.length ?? 0) > 0;
    }

    res.json({
      success: true,
      data: {
        ...post,
        isLiked,
      },
    });
  } catch (error) {
    console.error('Get blog post error:', error);
    res.status(500).json({ success: false, error: 'Failed to get blog post' });
  }
});

// Create blog post (admin/moderator only)
router.post('/posts', authMiddleware, requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      slug,
      content,
      excerpt,
      category_id,
      featured_image,
      is_published,
      is_featured,
      scheduled_at,
      tags,
      meta_title,
      meta_description,
    } = req.body;

    if (!title || !slug || !content) {
      res.status(400).json({ success: false, error: 'Title, slug, and content are required' });
      return;
    }

    const id = uuidv4();
    const author_id = req.user!.id;

    await pool.execute(
      `INSERT INTO blog_posts (
        id, title, slug, content, excerpt, author_id, category_id, featured_image,
        is_published, is_featured, scheduled_at, tags, meta_title, meta_description, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        title,
        slug,
        content,
        excerpt || null,
        author_id,
        category_id || null,
        featured_image || null,
        is_published !== undefined ? is_published : true,
        is_featured || false,
        scheduled_at || null,
        JSON.stringify(tags || []),
        meta_title || null,
        meta_description || null,
      ]
    );

    const [newPost] = await pool.execute(
      'SELECT * FROM blog_posts WHERE id = ?',
      [id]
    );

    res.status(201).json({ success: true, data: newPost[0] });
  } catch (error) {
    console.error('Create blog post error:', error);
    res.status(500).json({ success: false, error: 'Failed to create blog post' });
  }
});

// Update blog post
router.put('/posts/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      slug,
      content,
      excerpt,
      category_id,
      featured_image,
      is_published,
      is_featured,
      scheduled_at,
      tags,
      meta_title,
      meta_description,
    } = req.body;

    const [existing] = await pool.execute<BlogPost[]>(
      'SELECT * FROM blog_posts WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      res.status(404).json({ success: false, error: 'Blog post not found' });
      return;
    }

    await pool.execute(
      `UPDATE blog_posts SET 
        title = COALESCE(?, title),
        slug = COALESCE(?, slug),
        content = COALESCE(?, content),
        excerpt = ?,
        category_id = ?,
        featured_image = ?,
        is_published = ?,
        is_featured = ?,
        scheduled_at = ?,
        tags = ?,
        meta_title = ?,
        meta_description = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [
        title,
        slug,
        content,
        excerpt,
        category_id,
        featured_image,
        is_published,
        is_featured,
        scheduled_at,
        tags ? JSON.stringify(tags) : null,
        meta_title,
        meta_description,
        id,
      ]
    );

    const [updated] = await pool.execute<BlogPost[]>(
      'SELECT * FROM blog_posts WHERE id = ?',
      [id]
    );

    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Update blog post error:', error);
    res.status(500).json({ success: false, error: 'Failed to update blog post' });
  }
});

// Delete blog post
router.delete('/posts/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute<BlogPost[]>(
      'SELECT * FROM blog_posts WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      res.status(404).json({ success: false, error: 'Blog post not found' });
      return;
    }

    await pool.execute('DELETE FROM blog_posts WHERE id = ?', [id]);

    res.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (error) {
    console.error('Delete blog post error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete blog post' });
  }
});

// Like/Unlike blog post
router.post('/posts/:id/like', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const [existing] = await pool.execute<BlogLike[]>(
      'SELECT * FROM blog_likes WHERE post_id = ? AND user_id = ?',
      [id, userId]
    );

    if (existing.length > 0) {
      await pool.execute('DELETE FROM blog_likes WHERE post_id = ? AND user_id = ?', [id, userId]);
      await pool.execute(
        'UPDATE blog_posts SET like_count = GREATEST(0, COALESCE(like_count, 0) - 1) WHERE id = ?',
        [id]
      );
      res.json({ success: true, liked: false, message: 'Post unliked' });
    } else {
      await pool.execute(
        'INSERT INTO blog_likes (id, post_id, user_id, created_at) VALUES (?, ?, ?, NOW())',
        [uuidv4(), id, userId]
      );
      await pool.execute(
        'UPDATE blog_posts SET like_count = COALESCE(like_count, 0) + 1 WHERE id = ?',
        [id]
      );
      res.json({ success: true, liked: true, message: 'Post liked' });
    }
  } catch (error) {
    console.error('Like blog post error:', error);
    res.status(500).json({ success: false, error: 'Failed to like/unlike post' });
  }
});

// Get blog categories
router.get('/categories', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [categories] = await pool.execute<(BlogCategory & { post_count: number })[]>(
      `SELECT bc.*, COUNT(bp.id) as post_count 
       FROM blog_categories bc 
       LEFT JOIN blog_posts bp ON bc.id = bp.category_id AND bp.is_published = TRUE 
       GROUP BY bc.id 
       ORDER BY bc.order_index ASC, bc.name ASC`
    );

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get blog categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to get blog categories' });
  }
});

// Create blog category
router.post('/categories', authMiddleware, requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, slug, description, icon, order_index } = req.body;

    if (!name || !slug) {
      res.status(400).json({ success: false, error: 'Name and slug are required' });
      return;
    }

    const id = uuidv4();

    await pool.execute(
      `INSERT INTO blog_categories (id, name, slug, description, icon, order_index, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, name, slug, description || null, icon || null, order_index || 0]
    );

    const [newCategory] = await pool.execute<BlogCategory[]>(
      'SELECT * FROM blog_categories WHERE id = ?',
      [id]
    );

    res.status(201).json({ success: true, data: newCategory[0] });
  } catch (error) {
    console.error('Create blog category error:', error);
    res.status(500).json({ success: false, error: 'Failed to create blog category' });
  }
});

// Update blog category
router.put('/categories/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, order_index } = req.body;

    const [existing] = await pool.execute<BlogCategory[]>(
      'SELECT * FROM blog_categories WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      res.status(404).json({ success: false, error: 'Blog category not found' });
      return;
    }

    await pool.execute(
      `UPDATE blog_categories SET 
        name = COALESCE(?, name),
        slug = COALESCE(?, slug),
        description = ?,
        icon = ?,
        order_index = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [name, slug, description, icon, order_index, id]
    );

    const [updated] = await pool.execute<BlogCategory[]>(
      'SELECT * FROM blog_categories WHERE id = ?',
      [id]
    );

    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Update blog category error:', error);
    res.status(500).json({ success: false, error: 'Failed to update blog category' });
  }
});

// Delete blog category
router.delete('/categories/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute<BlogCategory[]>(
      'SELECT * FROM blog_categories WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      res.status(404).json({ success: false, error: 'Blog category not found' });
      return;
    }

    // Set category_id to NULL for posts in this category
    await pool.execute(
      'UPDATE blog_posts SET category_id = NULL WHERE category_id = ?',
      [id]
    );

    await pool.execute('DELETE FROM blog_categories WHERE id = ?', [id]);

    res.json({ success: true, message: 'Blog category deleted successfully' });
  } catch (error) {
    console.error('Delete blog category error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete blog category' });
  }
});

// Get blog comments
router.get('/posts/:id/comments', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [comments] = await pool.execute(
      `SELECT bc.*, p.full_name as author_name, p.avatar_url as author_avatar 
       FROM blog_comments bc 
       JOIN profiles p ON bc.user_id = p.user_id 
       WHERE bc.post_id = ? AND bc.is_approved = TRUE 
       ORDER BY bc.created_at DESC`,
      [id]
    ) as any;

    res.json({ success: true, data: comments });
  } catch (error) {
    console.error('Get blog comments error:', error);
    res.status(500).json({ success: false, error: 'Failed to get blog comments' });
  }
});

// Add blog comment
router.post('/posts/:id/comments', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content, parent_id } = req.body;
    const userId = req.user!.id;

    if (!content || content.trim().length === 0) {
      res.status(400).json({ success: false, error: 'Comment content is required' });
      return;
    }

    const commentId = uuidv4();

    await pool.execute(
      `INSERT INTO blog_comments (id, content, post_id, user_id, parent_id, is_approved, like_count, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, TRUE, 0, NOW(), NOW())`,
      [commentId, content, id, userId, parent_id || null]
    );

    const [newComment] = await pool.execute(
      `SELECT bc.*, p.full_name as author_name, p.avatar_url as author_avatar 
       FROM blog_comments bc 
       JOIN profiles p ON bc.user_id = p.user_id 
       WHERE bc.id = ?`,
      [commentId]
    ) as any;

    res.status(201).json({ success: true, data: newComment[0] });
  } catch (error) {
    console.error('Add blog comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
});

// Subscribe to newsletter
router.post('/subscribe', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, name } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }

    // Check if already subscribed
    const [existing] = await pool.execute(
      'SELECT * FROM blog_subscribers WHERE email = ?',
      [email]
    ) as any;

    if (existing.length > 0) {
      if (existing[0].unsubscribed_at) {
        // Resubscribe
        await pool.execute(
          'UPDATE blog_subscribers SET unsubscribed_at = NULL, subscribed_at = NOW(), updated_at = NOW() WHERE email = ?',
          [email]
        );
        res.json({ success: true, message: 'Resubscribed successfully' });
      } else {
        res.status(400).json({ success: false, error: 'Already subscribed' });
      }
      return;
    }

    const id = uuidv4();
    const verificationToken = uuidv4();

    await pool.execute(
      `INSERT INTO blog_subscribers (id, email, name, is_verified, verification_token, subscribed_at, created_at, updated_at) 
       VALUES (?, ?, ?, FALSE, ?, NOW(), NOW(), NOW())`,
      [id, email, name || null, verificationToken]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Subscribed successfully. Please check your email to verify.',
      verification_token: verificationToken,
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ success: false, error: 'Failed to subscribe' });
  }
});

// Verify subscription
router.post('/verify-subscription', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ success: false, error: 'Token is required' });
      return;
    }

    const [subscribers] = await pool.execute(
      'SELECT * FROM blog_subscribers WHERE verification_token = ?',
      [token]
    ) as any;

    if (subscribers.length === 0) {
      res.status(404).json({ success: false, error: 'Invalid verification token' });
      return;
    }

    await pool.execute(
      'UPDATE blog_subscribers SET is_verified = TRUE, verification_token = NULL, updated_at = NOW() WHERE id = ?',
      [subscribers[0].id]
    );

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify subscription error:', error);
    res.status(500).json({ success: false, error: 'Failed to verify subscription' });
  }
});

// Unsubscribe
router.post('/unsubscribe', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }

    await pool.execute(
      'UPDATE blog_subscribers SET unsubscribed_at = NOW(), updated_at = NOW() WHERE email = ?',
      [email]
    );

    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).json({ success: false, error: 'Failed to unsubscribe' });
  }
});

// Get popular tags
router.get('/tags', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [posts] = await pool.execute(
      'SELECT tags FROM blog_posts WHERE is_published = TRUE AND tags IS NOT NULL'
    ) as any;

    const tagCount: Record<string, number> = {};
    posts.forEach(post => {
      try {
        const tags = JSON.parse(post.tags as string);
        if (Array.isArray(tags)) {
          tags.forEach(tag => {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
          });
        }
      } catch {
        // Ignore parse errors
      }
    });

    const sortedTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, count]) => ({ name, count }));

    res.json({ success: true, data: sortedTags });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ success: false, error: 'Failed to get tags' });
  }
});

export default router;
