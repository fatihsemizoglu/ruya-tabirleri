import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database';
import { authMiddleware, requireAdmin, requireModerator, AuthRequest } from '../middleware/auth';
import { RowDataPacket } from 'mysql2/promise';

interface CountResult extends RowDataPacket {
  count: number;
}

interface CategoryStats extends RowDataPacket {
  name: string;
  dreamCount: number;
}

interface TopDream extends RowDataPacket {
  id: string;
  title: string;
  view_count: number;
  like_count: number;
}

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(requireModerator);

// Get dashboard statistics
router.get('/statistics', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get counts
    const [dreamCount] = await (pool.execute as any)('SELECT COUNT(*) as count FROM dreams');
    const [blogPostCount] = await (pool.execute as any)('SELECT COUNT(*) as count FROM blog_posts');
    const [userCount] = await (pool.execute as any)('SELECT COUNT(*) as count FROM users');
    const [categoryCount] = await (pool.execute as any)('SELECT COUNT(*) as count FROM categories');
    const [subscriberCount] = await (pool.execute as any)('SELECT COUNT(*) as count FROM blog_subscribers WHERE is_verified = TRUE');

    // Get recent activity
    const [recentDreams] = await pool.execute(
      'SELECT id, title, created_at FROM dreams ORDER BY created_at DESC LIMIT 5'
    );
    const [recentPosts] = await pool.execute(
      'SELECT id, title, created_at FROM blog_posts ORDER BY created_at DESC LIMIT 5'
    );

    res.json({
      success: true,
      data: {
        totalDreams: dreamCount[0]?.count || 0,
        totalCategories: categoryCount[0]?.count || 0,
        totalUsers: userCount[0]?.count || 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        featuredDreams: 0,
        avgViewsPerDream: 0,
        dreams: dreamCount[0]?.count || 0,
        categories: recentDreams,
      },
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ success: false, error: 'Failed to get statistics' });
  }
});

// Get category statistics
router.get('/category-stats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [stats] = await pool.execute(
      `SELECT c.name, COUNT(d.id) as dreamCount 
       FROM categories c 
       LEFT JOIN dreams d ON c.id = d.category_id 
       GROUP BY c.id, c.name 
       ORDER BY dreamCount DESC`
    );

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to get category stats' });
  }
});

// Get top dreams
router.get('/top-dreams', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const [dreams] = await pool.execute(
      `SELECT id, title, COALESCE(view_count, 0) as view_count, COALESCE(like_count, 0) as like_count 
       FROM dreams 
       ORDER BY view_count DESC 
       LIMIT ?`,
      [limit]
    );

    res.json({
      success: true,
      data: dreams,
    });
  } catch (error) {
    console.error('Get top dreams error:', error);
    res.status(500).json({ success: false, error: 'Failed to get top dreams' });
  }
});

// Get all comments (admin)
router.get('/comments', requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: (string | number)[] = [];

    if (status === 'pending') {
      whereClause = 'WHERE bc.is_approved = FALSE';
    } else if (status === 'approved') {
      whereClause = 'WHERE bc.is_approved = TRUE';
    }

    const [comments] = await pool.execute(
      `SELECT bc.*, p.full_name as author_name, bp.title as post_title 
       FROM blog_comments bc 
       LEFT JOIN profiles p ON bc.user_id = p.user_id 
       LEFT JOIN blog_posts bp ON bc.post_id = bp.id 
       ${whereClause}
       ORDER BY bc.created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as count FROM blog_comments bc ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: comments,
      pagination: {
        page,
        limit,
        total: countResult[0]?.count || 0,
        totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, error: 'Failed to get comments' });
  }
});

// Approve comment
router.put('/comments/:id/approve', requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await pool.execute(
      'UPDATE blog_comments SET is_approved = TRUE WHERE id = ?',
      [id]
    );

    res.json({ success: true, message: 'Comment approved' });
  } catch (error) {
    console.error('Approve comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to approve comment' });
  }
});

// Reject comment
router.put('/comments/:id/reject', requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await pool.execute(
      'UPDATE blog_comments SET is_approved = FALSE WHERE id = ?',
      [id]
    );

    res.json({ success: true, message: 'Comment rejected' });
  } catch (error) {
    console.error('Reject comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to reject comment' });
  }
});

// Delete comment
router.delete('/comments/:id', requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await pool.execute('DELETE FROM blog_comments WHERE id = ?', [id]);

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete comment' });
  }
});

// Get contact messages
router.get('/contact-messages', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;
    const isRead = req.query.is_read;

    let whereClause = '';
    const params: (string | number)[] = [];

    if (isRead !== undefined) {
      whereClause = 'WHERE is_read = ?';
      params.push(isRead === 'true' ? 1 : 0);
    }

    const [messages] = await pool.execute(
      `SELECT * FROM contact_messages ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as count FROM contact_messages ${whereClause}`,
      params
    );

    res.json({
      success: true,
      data: {
        messages,
        total: countResult[0]?.count || 0,
      },
      pagination: {
        page,
        limit,
        total: countResult[0]?.count || 0,
        totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Get contact messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to get contact messages' });
  }
});

// Mark contact message as read
router.put('/contact-messages/:id/read', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await pool.execute(
      'UPDATE contact_messages SET is_read = TRUE WHERE id = ?',
      [id]
    );

    res.json({ success: true, message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark message as read' });
  }
});

// Delete contact message
router.delete('/contact-messages/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await pool.execute('DELETE FROM contact_messages WHERE id = ?', [id]);

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete message' });
  }
});

// Get all users (admin)
router.get('/users', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const [users] = await pool.execute(
      `SELECT u.id, u.email, u.created_at, u.updated_at, p.full_name, p.username, ur.role 
       FROM users u 
       LEFT JOIN profiles p ON u.id = p.user_id 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       ORDER BY u.created_at DESC 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    const [countResult] = await (pool.execute as any)('SELECT COUNT(*) as count FROM users');

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total: countResult[0]?.count || 0,
        totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Failed to get users' });
  }
});

// Get profiles by IDs
router.get('/profiles', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ids = req.query.ids as string;
    if (!ids) {
      res.status(400).json({ success: false, error: 'Missing ids parameter' });
      return;
    }

    const userIds = ids.split(',');
    const placeholders = userIds.map(() => '?').join(',');

    const [profiles] = await pool.execute(
      `SELECT * FROM profiles WHERE user_id IN (${placeholders})`,
      userIds
    );

    res.json({
      success: true,
      data: profiles,
    });
  } catch (error) {
    console.error('Get profiles error:', error);
    res.status(500).json({ success: false, error: 'Failed to get profiles' });
  }
});

// Get audit logs
router.get('/audit-logs', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;

    let whereClause = '';
    const params: (string | number)[] = [];

    if (search) {
      whereClause = 'WHERE action LIKE ? OR details LIKE ?';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    const [logs] = await pool.execute(
      `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

     const [countResult] = await (pool.execute as any)(
       `SELECT COUNT(*) as count FROM audit_logs ${whereClause}`,
       params
     );

    res.json({
      success: true,
      data: {
        logs,
        total: countResult[0]?.count || 0,
      },
      pagination: {
        page,
        limit,
        total: countResult[0]?.count || 0,
        totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ success: false, error: 'Failed to get audit logs' });
  }
});

// Update user role
router.put('/users/:id/role', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'moderator', 'user'].includes(role)) {
      res.status(400).json({ success: false, error: 'Invalid role' });
      return;
    }

    await pool.execute(
      `INSERT INTO user_roles (user_id, role) VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE role = ?`,
      [id, role, role]
    );

    res.json({ success: true, message: 'Role updated' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, error: 'Failed to update role' });
  }
});

// Delete user
router.delete('/users/:id', requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Don't allow deleting yourself
    if (id === req.user?.id) {
      res.status(400).json({ success: false, error: 'Cannot delete your own account' });
      return;
    }

    await pool.execute('DELETE FROM profiles WHERE user_id = ?', [id]);
    await pool.execute('DELETE FROM user_roles WHERE user_id = ?', [id]);
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// Admin Notifications CRUD

// Get all notifications
router.get('/notifications', requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const page = parseInt(req.query.page as string) || 1;
    const offset = (page - 1) * limit;
    const isActive = req.query.is_active;

    let whereClause = '';
    const params: (string | number)[] = [];

    if (isActive !== undefined) {
      whereClause = 'WHERE is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    const [notifications] = await pool.execute(
      `SELECT * FROM admin_notifications ${whereClause} ORDER BY display_order ASC, created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

     const [countResult] = await (pool.execute as any)(
       `SELECT COUNT(*) as count FROM admin_notifications ${whereClause}`,
       params
     );

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total: countResult[0]?.count || 0,
        totalPages: Math.ceil((countResult[0]?.count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, error: 'Failed to get notifications' });
  }
});

// Create notification
router.post('/notifications', requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, title, description, link, is_active, display_order, expires_at } = req.body;

    if (!title) {
      res.status(400).json({ success: false, error: 'Title is required' });
      return;
    }

    const id = uuidv4();
    const validTypes = ['info', 'warning', 'success', 'error', 'comment', 'message'];
    const notificationType = validTypes.includes(type) ? type : 'info';

    await pool.execute(
      `INSERT INTO admin_notifications (id, type, title, description, link, is_active, display_order, created_by, expires_at, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        notificationType,
        title,
        description || null,
        link || null,
        is_active !== undefined ? is_active : true,
        display_order || 0,
        req.user?.id,
        expires_at || null,
      ]
    );

    const [newNotification] = await (pool.execute as any)('SELECT * FROM admin_notifications WHERE id = ?', [id]);

    res.status(201).json({ success: true, data: newNotification[0] });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ success: false, error: 'Failed to create notification' });
  }
});

// Update notification
router.put('/notifications/:id', requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
     const { id } = req.params;
     const { type, title, description, link, is_active, display_order, expires_at } = req.body;
 
     const [existing] = await (pool.execute as any)('SELECT * FROM admin_notifications WHERE id = ?', [id]);
     if (existing.length === 0) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    const validTypes = ['info', 'warning', 'success', 'error', 'comment', 'message'];
    const notificationType = type && validTypes.includes(type) ? type : existing[0].type;

    await pool.execute(
      `UPDATE admin_notifications SET 
        type = ?,
        title = COALESCE(?, title),
        description = ?,
        link = ?,
        is_active = ?,
        display_order = ?,
        expires_at = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [
        notificationType,
        title || null,
        description || null,
        link || null,
        is_active !== undefined ? is_active : existing[0].is_active,
        display_order !== undefined ? display_order : existing[0].display_order,
        expires_at || null,
        id,
      ]
    );

     const [updated] = await (pool.execute as any)('SELECT * FROM admin_notifications WHERE id = ?', [id]);

    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
});

// Delete notification
router.delete('/notifications/:id', requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [existing] = await (pool.execute as any)('SELECT * FROM admin_notifications WHERE id = ?', [id]);
    if (existing.length === 0) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    await pool.execute('DELETE FROM admin_notifications WHERE id = ?', [id]);

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
});

// Toggle notification active status
router.patch('/notifications/:id/toggle', requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const [existing] = await (pool.execute as any)('SELECT is_active FROM admin_notifications WHERE id = ?', [id]);
    if (existing.length === 0) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    const newStatus = !existing[0].is_active;
    await pool.execute('UPDATE admin_notifications SET is_active = ?, updated_at = NOW() WHERE id = ?', [newStatus, id]);

    res.json({ success: true, data: { is_active: newStatus } });
  } catch (error) {
    console.error('Toggle notification error:', error);
    res.status(500).json({ success: false, error: 'Failed to toggle notification' });
  }
});

// Mark notification as read
router.patch('/notifications/:id/read', requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await pool.execute('UPDATE admin_notifications SET is_read = TRUE, updated_at = NOW() WHERE id = ?', [id]);

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
  }
});

// Get active notifications (for notification center)
router.get('/notifications/active', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const now = new Date();
    
    const [notifications] = await pool.execute(
      `SELECT * FROM admin_notifications 
       WHERE is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY display_order ASC, created_at DESC LIMIT 20`
    );

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Get active notifications error:', error);
    res.status(500).json({ success: false, error: 'Failed to get notifications' });
  }
});

export default router;
