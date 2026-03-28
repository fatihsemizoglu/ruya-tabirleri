import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database';
import { authMiddleware, requireModerator, AuthRequest } from '../middleware/auth';
import type { ContactMessage } from '../types/index';

const router = Router();

// Submit contact form
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      res.status(400).json({ success: false, error: 'All fields are required' });
      return;
    }

    const id = uuidv4();

    const { error } = await supabase
      .from('contact_messages')
      .insert({
        id,
        name,
        email,
        subject,
        message,
        is_read: false,
        created_at: new Date().toISOString(),
      });

    if (error) throw error;

    res.status(201).json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

// Get all messages (admin/moderator only)
router.get('/', requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const is_read = req.query.is_read as string;

    let query = supabase
      .from('contact_messages')
      .select('*', { count: 'exact' });

    if (is_read !== undefined) {
      query = query.eq('is_read', is_read === 'true');
    }

    const { data: messages, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const total = count || 0;

    res.json({
      success: true,
      data: messages || [],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, error: 'Failed to get messages' });
  }
});

// Mark message as read
router.put('/:id/read', authMiddleware, requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await supabase
      .from('contact_messages')
      .update({ is_read: true })
      .eq('id', id);

    res.json({ success: true, message: 'Message marked as read' });
  } catch (error) {
    console.error('Mark message read error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark message as read' });
  }
});

// Delete message (admin only)
router.delete('/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete message' });
  }
});

export default router;
