import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database.js';
import { authMiddleware, optionalAuthMiddleware, requireModerator, AuthRequest } from '../middleware/auth.js';
import type { Category, Dream } from '../types/index.js';

const router = Router();

// Get all categories
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [categories] = await pool.execute<(Category & { dream_count: number })[]>(
      `SELECT c.*, COUNT(d.id) as dream_count 
       FROM categories c 
       LEFT JOIN dreams d ON c.id = d.category_id AND d.is_published = TRUE 
       GROUP BY c.id 
       ORDER BY c.order_index ASC, c.name ASC`
    );

    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to get categories' });
  }
});

// Get category by slug
router.get('/:slug', optionalAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const [categories] = await pool.execute<(Category & { dream_count: number })[]>(
      `SELECT c.*, COUNT(d.id) as dream_count 
       FROM categories c 
       LEFT JOIN dreams d ON c.id = d.category_id AND d.is_published = TRUE 
       WHERE c.slug = ? 
       GROUP BY c.id`,
      [slug]
    );

    if (categories.length === 0) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    res.json({ success: true, data: categories[0] });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ success: false, error: 'Failed to get category' });
  }
});

// Get dreams by category
router.get('/:slug/dreams', optionalAuthMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get category
    const [categories] = await pool.execute<Category[]>(
      'SELECT * FROM categories WHERE slug = ?',
      [slug]
    );

    if (categories.length === 0) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    const category = categories[0];

    // Get total count
    const [countResult] = await pool.execute<{ count: number }[]>(
      'SELECT COUNT(*) as count FROM dreams WHERE category_id = ? AND is_published = TRUE',
      [category.id]
    );
    const total = countResult[0].count;

    // Get dreams
    const [dreams] = await pool.execute<Dream[]>(
      `SELECT * FROM dreams 
       WHERE category_id = ? AND is_published = TRUE 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [category.id, limit, offset]
    );

    res.json({
      success: true,
      data: dreams,
      category,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get category dreams error:', error);
    res.status(500).json({ success: false, error: 'Failed to get category dreams' });
  }
});

// Create category (admin/moderator only)
router.post('/', authMiddleware, requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, slug, description, icon, parent_id, order_index } = req.body;

    if (!name || !slug) {
      res.status(400).json({ success: false, error: 'Name and slug are required' });
      return;
    }

    const id = uuidv4();

    await pool.execute(
      `INSERT INTO categories (id, name, slug, description, icon, parent_id, order_index, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, name, slug, description || null, icon || null, parent_id || null, order_index || 0]
    );

    const [newCategory] = await pool.execute<Category[]>(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    res.status(201).json({ success: true, data: newCategory[0] });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, error: 'Failed to create category' });
  }
});

// Update category (admin/moderator only)
router.put('/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, slug, description, icon, parent_id, order_index } = req.body;

    const [existing] = await pool.execute<Category[]>(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    const existingCategory = existing[0];
    
    // Use existing values if new values are undefined
    const updatedName = name !== undefined ? name : existingCategory.name;
    const updatedSlug = slug !== undefined ? slug : existingCategory.slug;
    const updatedDescription = description !== undefined ? description : existingCategory.description;
    const updatedIcon = icon !== undefined ? icon : existingCategory.icon;
    const updatedParentId = parent_id !== undefined ? parent_id : existingCategory.parent_id;
    const updatedOrderIndex = order_index !== undefined ? order_index : existingCategory.order_index;

    await pool.execute(
      `UPDATE categories SET 
        name = ?,
        slug = ?,
        description = ?,
        icon = ?,
        parent_id = ?,
        order_index = ?,
        updated_at = NOW()
      WHERE id = ?`,
      [updatedName, updatedSlug, updatedDescription, updatedIcon, updatedParentId, updatedOrderIndex, id]
    );

    const [updated] = await pool.execute<Category[]>(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ success: false, error: 'Failed to update category' });
  }
});

// Delete category (admin only)
router.delete('/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [existing] = await pool.execute<Category[]>(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      res.status(404).json({ success: false, error: 'Category not found' });
      return;
    }

    // Set category_id to NULL for dreams in this category
    await pool.execute(
      'UPDATE dreams SET category_id = NULL WHERE category_id = ?',
      [id]
    );

    await pool.execute('DELETE FROM categories WHERE id = ?', [id]);

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
});

export default router;