import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database';
import { authMiddleware, requireAdmin, requireModerator, AuthRequest } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);
router.use(requireModerator);

// Get dashboard statistics
router.get('/statistics', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { count: dreamCount } = await supabase.from('dreams').select('*', { count: 'exact', head: true });
    const { count: blogPostCount } = await supabase.from('blog_posts').select('*', { count: 'exact', head: true });
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: categoryCount } = await supabase.from('categories').select('*', { count: 'exact', head: true });
    const { count: subscriberCount } = await supabase.from('blog_subscribers').select('*', { count: 'exact', head: true }).eq('is_verified', true);

    // Get recent activity
    const { data: recentDreams } = await supabase
      .from('dreams')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    const { data: recentPosts } = await supabase
      .from('blog_posts')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      success: true,
      data: {
        totalDreams: dreamCount || 0,
        totalCategories: categoryCount || 0,
        totalUsers: userCount || 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        featuredDreams: 0,
        avgViewsPerDream: 0,
        dreams: dreamCount || 0,
        categories: recentDreams || [],
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
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*');

    if (error) throw error;

    // Get dream counts per category
    const { data: dreams } = await supabase
      .from('dreams')
      .select('category_id');

    const countMap: Record<string, number> = {};
    (dreams || []).forEach((d: any) => {
      if (d.category_id) {
        countMap[d.category_id] = (countMap[d.category_id] || 0) + 1;
      }
    });

    const stats = (categories || []).map((c: any) => ({
      name: c.name,
      dreamCount: countMap[c.id] || 0,
    })).sort((a, b) => b.dreamCount - a.dreamCount);

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

    const { data: dreams, error } = await supabase
      .from('dreams')
      .select('id, title, view_count, like_count')
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({
      success: true,
      data: dreams || [],
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

    let query = supabase
      .from('blog_comments')
      .select('*, profiles!user_id(full_name), blog_posts!post_id(title)', { count: 'exact' });

    if (status === 'pending') {
      query = query.eq('is_approved', false);
    } else if (status === 'approved') {
      query = query.eq('is_approved', true);
    }

    const { data: comments, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const result = (comments || []).map((c: any) => ({
      ...c,
      author_name: c.profiles?.full_name,
      post_title: c.blog_posts?.title,
    }));

    res.json({
      success: true,
      data: result,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
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

    await supabase
      .from('blog_comments')
      .update({ is_approved: true })
      .eq('id', id);

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

    await supabase
      .from('blog_comments')
      .update({ is_approved: false })
      .eq('id', id);

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

    await supabase.from('blog_comments').delete().eq('id', id);

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

    let query = supabase
      .from('contact_messages')
      .select('*', { count: 'exact' });

    if (isRead !== undefined) {
      query = query.eq('is_read', isRead === 'true');
    }

    const { data: messages, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        messages: messages || [],
        total: count || 0,
      },
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
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

    await supabase
      .from('contact_messages')
      .update({ is_read: true })
      .eq('id', id);

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

    await supabase.from('contact_messages').delete().eq('id', id);

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

    const { data: users, count, error } = await supabase
      .from('users')
      .select('id, email, created_at, updated_at, profiles(full_name, username), user_roles(role)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const result = (users || []).map((u: any) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      updated_at: u.updated_at,
      full_name: u.profiles?.[0]?.full_name,
      username: u.profiles?.[0]?.username,
      role: u.user_roles?.[0]?.role,
    }));

    res.json({
      success: true,
      data: result,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
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

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', userIds);

    if (error) throw error;

    res.json({
      success: true,
      data: profiles || [],
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

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`action.ilike.%${search}%,details.ilike.%${search}%`);
    }

    const { data: logs, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        logs: logs || [],
        total: count || 0,
      },
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
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

    // Upsert: try update first, then insert if not exists
    const { data: existing } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', id)
      .single();

    if (existing) {
      await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', id);
    } else {
      await supabase
        .from('user_roles')
        .insert({ user_id: id, role, created_at: new Date().toISOString() });
    }

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

    await supabase.from('profiles').delete().eq('user_id', id);
    await supabase.from('user_roles').delete().eq('user_id', id);
    await supabase.from('users').delete().eq('id', id);

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

    let query = supabase
      .from('admin_notifications')
      .select('*', { count: 'exact' });

    if (isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data: notifications, count, error } = await query
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: notifications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
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

    const { data: newNotification, error } = await supabase
      .from('admin_notifications')
      .insert({
        id,
        type: notificationType,
        title,
        description: description || null,
        link: link || null,
        is_active: is_active !== undefined ? is_active : true,
        display_order: display_order || 0,
        created_by: req.user?.id,
        expires_at: expires_at || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: newNotification });
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

    const { data: existing, error: fetchError } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    const validTypes = ['info', 'warning', 'success', 'error', 'comment', 'message'];
    const notificationType = type && validTypes.includes(type) ? type : existing.type;

    const { data: updated, error } = await supabase
      .from('admin_notifications')
      .update({
        type: notificationType,
        title: title ?? existing.title,
        description: description !== undefined ? description : existing.description,
        link: link !== undefined ? link : existing.link,
        is_active: is_active !== undefined ? is_active : existing.is_active,
        display_order: display_order !== undefined ? display_order : existing.display_order,
        expires_at: expires_at !== undefined ? expires_at : existing.expires_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({ success: false, error: 'Failed to update notification' });
  }
});

// Delete notification
router.delete('/notifications/:id', requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: existing, error: fetchError } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    await supabase.from('admin_notifications').delete().eq('id', id);

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

    const { data: existing, error: fetchError } = await supabase
      .from('admin_notifications')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({ success: false, error: 'Notification not found' });
      return;
    }

    const newStatus = !existing.is_active;
    await supabase
      .from('admin_notifications')
      .update({ is_active: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

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

    await supabase
      .from('admin_notifications')
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
  }
});

// Get active notifications (for notification center)
router.get('/notifications/active', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data: notifications, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    res.json({ success: true, data: notifications || [] });
  } catch (error) {
    console.error('Get active notifications error:', error);
    res.status(500).json({ success: false, error: 'Failed to get notifications' });
  }
});

export default router;
