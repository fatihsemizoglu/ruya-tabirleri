import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth';
import type { Profile, UserRole, Favorite, ViewHistory, Dream, DreamJournalEntry, DreamLike } from '../types/index';

const router = Router();

// Get user favorites
router.get('/favorites', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get total count
    const { count } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const total = count || 0;

    // Get favorites with dream details
    const { data: favorites, error } = await supabase
      .from('favorites')
      .select('*, dreams(*, categories(name))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const result = (favorites || []).map((f: any) => ({
      ...f,
      ...(f.dreams || {}),
      category_name: f.dreams?.categories?.name,
    }));

    res.json({
      success: true,
      data: result,
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
    const { count } = await supabase
      .from('view_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const total = count || 0;

    // Get view history with dream details
    const { data: history, error } = await supabase
      .from('view_history')
      .select('*, dreams(*, categories(name))')
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const result = (history || []).map((h: any) => ({
      ...h,
      ...(h.dreams || {}),
      category_name: h.dreams?.categories?.name,
    }));

    res.json({
      success: true,
      data: result,
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
    const { count } = await supabase
      .from('dream_journal')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const total = count || 0;

    // Get journal entries
    const { data: entries, error } = await supabase
      .from('dream_journal')
      .select('*')
      .eq('user_id', userId)
      .order('dream_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      success: true,
      data: entries || [],
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

    const { data: newEntry, error } = await supabase
      .from('dream_journal')
      .insert({
        id,
        user_id: userId,
        title,
        content,
        dream_date: dream_date || new Date().toISOString(),
        mood: mood || null,
        tags: JSON.stringify(tags || []),
        is_private: is_private !== undefined ? is_private : true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data: newEntry });
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
    const { data: existing, error: fetchError } = await supabase
      .from('dream_journal')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({ success: false, error: 'Journal entry not found' });
      return;
    }

    const { data: updated, error } = await supabase
      .from('dream_journal')
      .update({
        title: title ?? existing.title,
        content: content ?? existing.content,
        dream_date: dream_date ?? existing.dream_date,
        mood: mood !== undefined ? mood : existing.mood,
        tags: tags ? JSON.stringify(tags) : existing.tags,
        is_private: is_private !== undefined ? is_private : existing.is_private,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data: updated });
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
    const { data: existing, error: fetchError } = await supabase
      .from('dream_journal')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !existing) {
      res.status(404).json({ success: false, error: 'Journal entry not found' });
      return;
    }

    await supabase
      .from('dream_journal')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

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

    const { data: likes, error } = await supabase
      .from('dream_likes')
      .select('*, dreams(title, slug)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const result = (likes || []).map((l: any) => ({
      ...l,
      title: l.dreams?.title,
      slug: l.dreams?.slug,
    }));

    res.json({ success: true, data: result });
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

    await supabase
      .from('favorites')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

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

    await supabase
      .from('view_history')
      .delete()
      .eq('user_id', userId);

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

    await supabase
      .from('view_history')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

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
    const { count: favCount } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get view history count
    const { count: viewCount } = await supabase
      .from('view_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get comments count
    const { count: commentCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get total likes on user's comments
    const { data: userComments } = await supabase
      .from('comments')
      .select('like_count')
      .eq('user_id', userId);

    const totalLikes = (userComments || []).reduce((sum: number, c: any) => sum + (c.like_count || 0), 0);

    // Get journal entries count
    const { count: journalCount } = await supabase
      .from('dream_journal')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Get mood distribution
    const { data: journalEntries } = await supabase
      .from('dream_journal')
      .select('mood')
      .eq('user_id', userId)
      .not('mood', 'is', null);

    const moodDistribution: Record<string, number> = {};
    (journalEntries || []).forEach((item: any) => {
      if (item.mood) {
        moodDistribution[item.mood] = (moodDistribution[item.mood] || 0) + 1;
      }
    });

    // Get recent comments with dream info
    const { data: recentComments } = await supabase
      .from('comments')
      .select('created_at, dreams(title, slug)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    // Get recent journal entries
    const { data: recentJournal } = await supabase
      .from('dream_journal')
      .select('title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    // Build recent activity
    const recentActivity: { type: string; title: string; date: string; link?: string }[] = [];

    (recentComments || []).forEach((comment: any) => {
      recentActivity.push({
        type: 'comment',
        title: `"${comment.dreams?.title || 'Rüya'}" için yorum yaptiniz`,
        date: comment.created_at,
        link: comment.dreams?.slug ? `/ruya/${comment.dreams.slug}` : undefined,
      });
    });

    (recentJournal || []).forEach((entry: any) => {
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
        totalFavorites: favCount || 0,
        totalViews: viewCount || 0,
        totalComments: commentCount || 0,
        totalLikes,
        journalEntries: journalCount || 0,
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

    const { data: comments, error } = await supabase
      .from('comments')
      .select('*, dreams(title, slug)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const result = (comments || []).map((c: any) => ({
      ...c,
      title: c.dreams?.title,
      slug: c.dreams?.slug,
    }));

    res.json({ success: true, data: result });
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
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const total = count || 0;

    // Get users with roles
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const result = (users || []).map((u: any) => ({
      ...u,
      role: u.user_roles?.[0]?.role,
    }));

    res.json({
      success: true,
      data: result,
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

    // Upsert: check if role exists, then update or insert
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
        .insert({ id: uuidv4(), user_id: id, role, created_at: new Date().toISOString() });
    }

    res.json({ success: true, message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ success: false, error: 'Failed to update user role' });
  }
});

export default router;
