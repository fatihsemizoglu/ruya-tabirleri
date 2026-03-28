import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../middleware/errorMiddleware';
import type { Dream, Category, Comment, DreamLike, Favorite, ViewHistory } from '../types/index';

interface DreamWithCategory extends Dream {
  category_name?: string;
  category_slug?: string;
}

export class DreamService {
  /**
   * Get all dreams with pagination and filters
   */
  async getDreams(filters: {
    page?: number;
    limit?: number;
    category_id?: string;
    search?: string;
    is_featured?: boolean;
    sort_by?: string;
    sort_order?: string;
  }): Promise<{
    dreams: DreamWithCategory[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const offset = (page - 1) * limit;
    const category_id = filters.category_id;
    const search = filters.search;
    const is_featured = filters.is_featured;
    const sort_by = filters.sort_by ?? 'created_at';
    const sort_order = filters.sort_order ?? 'DESC';

    // Validate sort parameters
    const validSortColumns = ['created_at', 'view_count', 'like_count', 'title'];
    const validSortOrders = ['ASC', 'DESC'];
    const safeSortBy = validSortColumns.includes(sort_by) ? sort_by : 'created_at';
    const safeSortOrder = validSortOrders.includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';

    let whereClause = 'WHERE is_published = TRUE';
    const params: any[] = [];

    if (category_id) {
      whereClause += ' AND category_id = ?';
      params.push(category_id);
    }

    if (search) {
      whereClause += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (is_featured !== undefined) {
      whereClause += ' AND is_featured = ?';
      params.push(is_featured);
    }

    // Get total count
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as count FROM dreams ${whereClause}`,
      params
    ) as any;
    const total = countResult[0]?.count ?? 0;

    // Get dreams
    const [dreams] = await pool.execute(
      `SELECT d.*, c.name as category_name, c.slug as category_slug 
       FROM dreams d 
       LEFT JOIN categories c ON d.category_id = c.id 
       ${whereClause} 
       ORDER BY d.${safeSortBy} ${safeSortOrder} 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ) as any;

    return {
      dreams: dreams as DreamWithCategory[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get featured dreams
   */
  async getFeaturedDreams(limit: number = 5): Promise<DreamWithCategory[]> {
    const [dreams] = await pool.execute(
      `SELECT d.*, c.name as category_name, c.slug as category_slug 
       FROM dreams d 
       LEFT JOIN categories c ON d.category_id = c.id 
       WHERE d.is_published = TRUE AND d.is_featured = TRUE 
       ORDER BY d.view_count DESC 
       LIMIT ?`,
      [limit]
    ) as any;

    return dreams as DreamWithCategory[];
  }

  /**
   * Get dream by slug
   */
  async getDreamBySlug(slug: string): Promise<{
    dream: DreamWithCategory;
    isLiked: boolean;
    isFavorited: boolean;
    userId?: string;
  } | null> {
    const [dreams] = await pool.execute(
      `SELECT d.*, c.name as category_name, c.slug as category_slug 
       FROM dreams d 
       LEFT JOIN categories c ON d.category_id = c.id 
       WHERE d.slug = ?`,
      [slug]
    ) as any;

    if (dreams.length === 0) {
      return null;
    }

    const dream = dreams[0] as DreamWithCategory;

    // Increment view count
    await pool.execute(
      'UPDATE dreams SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?',
      [dream.id]
    );

    return {
      dream,
      isLiked: false, // Will be set by caller if userId is provided
      isFavorited: false,
    };
  }

  /**
   * Create dream
   */
  async createDream(
    data: Omit<Dream, 'id' | 'created_at' | 'updated_at'> & {
      userId: string;
    }
  ): Promise<Dream> {
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
      userId,
    } = data;

    // Check if slug already exists
    const [existingSlug] = await pool.execute(
      'SELECT id FROM dreams WHERE slug = ?',
      [slug]
    ) as any;

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
    ) as any;

    return newDream[0] as Dream;
  }

  /**
   * Update dream
   */
  async updateDream(
    id: string,
    data: Partial<Omit<Dream, 'id' | 'created_at' | 'updated_at'> & { slug?: string }>
  ): Promise<Dream> {
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
    } = data;

    // Check if dream exists
    const [existing] = await pool.execute(
      'SELECT * FROM dreams WHERE id = ?',
      [id]
    ) as any;

    if (existing.length === 0) {
      throw new AppError('Dream not found', 404);
    }

    // Check slug uniqueness if slug is being updated
    if (slug && slug !== existing[0].slug) {
      const [existingSlug] = await pool.execute(
        'SELECT id FROM dreams WHERE slug = ? AND id != ?',
        [slug, id]
      ) as any;

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
    ) as any;

    return updated[0] as Dream;
  }

  /**
   * Delete dream
   */
  async deleteDream(id: string): Promise<{ message: string }> {
    // Check if dream exists
    const [existing] = await pool.execute(
      'SELECT * FROM dreams WHERE id = ?',
      [id]
    ) as any;

    if (existing.length === 0) {
      throw new AppError('Dream not found', 404);
    }

    await pool.execute('DELETE FROM dreams WHERE id = ?', [id]);

    return { message: 'Dream deleted successfully' };
  }

  /**
   * Like/unlike dream
   */
  async toggleLike(dreamId: string, userId: string): Promise<{
    liked: boolean;
    message: string;
  }> {
    const [existing] = await pool.execute(
      'SELECT * FROM dream_likes WHERE dream_id = ? AND user_id = ?',
      [dreamId, userId]
    ) as any;

    if (existing.length > 0) {
      // Unlike
      await pool.execute('DELETE FROM dream_likes WHERE dream_id = ? AND user_id = ?', [dreamId, userId]);
      await pool.execute(
        'UPDATE dreams SET like_count = GREATEST(0, COALESCE(like_count, 0) - 1) WHERE id = ?',
        [dreamId]
      );
      return { liked: false, message: 'Dream unliked' };
    } else {
      // Like
      await pool.execute(
        'INSERT INTO dream_likes (id, dream_id, user_id, created_at) VALUES (?, ?, ?, NOW())',
        [uuidv4(), dreamId, userId]
      );
      await pool.execute(
        'UPDATE dreams SET like_count = COALESCE(like_count, 0) + 1 WHERE id = ?',
        [dreamId]
      );
      return { liked: true, message: 'Dream liked' };
    }
  }

  /**
   * Toggle favorite
   */
  async toggleFavorite(dreamId: string, userId: string): Promise<{
    favorited: boolean;
    message: string;
  }> {
    const [existing] = await pool.execute(
      'SELECT * FROM favorites WHERE dream_id = ? AND user_id = ?',
      [dreamId, userId]
    ) as any;

    if (existing.length > 0) {
      // Remove from favorites
      await pool.execute('DELETE FROM favorites WHERE dream_id = ? AND user_id = ?', [dreamId, userId]);
      return { favorited: false, message: 'Removed from favorites' };
    } else {
      // Add to favorites
      await pool.execute(
        'INSERT INTO favorites (id, dream_id, user_id, created_at) VALUES (?, ?, ?, NOW())',
        [uuidv4(), dreamId, userId]
      );
      return { favorited: true, message: 'Added to favorites' };
    }
  }

  /**
   * Get comments for a dream
   */
  async getComments(dreamId: string): Promise<Comment[]> {
    const [comments] = await pool.execute(
      `SELECT c.*, p.full_name as author_name, p.avatar_url as author_avatar 
       FROM comments c 
       JOIN profiles p ON c.user_id = p.user_id 
       WHERE c.dream_id = ? AND c.is_approved = TRUE 
       ORDER BY c.created_at DESC`,
      [dreamId]
    ) as any;

    return comments as Comment[];
  }

  /**
   * Add comment to dream
   */
  async addComment(
    dreamId: string,
    userId: string,
    content: string
  ): Promise<Comment> {
    if (!content || content.trim().length === 0) {
      throw new AppError('Comment content is required', 400);
    }

    const commentId = uuidv4();

    await pool.execute(
      `INSERT INTO comments (id, content, dream_id, user_id, is_approved, like_count, created_at, updated_at) 
       VALUES (?, ?, ?, ?, TRUE, 0, NOW(), NOW())`,
      [commentId, content, dreamId, userId]
    );

    const [newComment] = await pool.execute(
      `SELECT c.*, p.full_name as author_name, p.avatar_url as author_avatar 
       FROM comments c 
       JOIN profiles p ON c.user_id = p.user_id 
       WHERE c.id = ?`,
      [commentId]
    ) as any;

    return newComment[0] as Comment;
  }

  /**
   * Get similar dreams
   */
  async getSimilarDreams(dreamId: string, limit: number = 5): Promise<DreamWithCategory[]> {
    // Get the current dream's category
    const [currentDream] = await pool.execute(
      'SELECT category_id FROM dreams WHERE id = ?',
      [dreamId]
    ) as any;

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
      [categoryId, dreamId, limit]
    ) as any;

    return similar as DreamWithCategory[];
  }
}

// Export a singleton instance
export const dreamService = new DreamService();