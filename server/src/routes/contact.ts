import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database.js';
import { authMiddleware, requireModerator, AuthRequest } from '../middleware/auth.js';
import type { ContactMessage } from '../types/index.js';

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

    await pool.execute(
      `INSERT INTO contact_messages (id, name, email, subject, message, is_read, created_at) 
       VALUES (?, ?, ?, ?, ?, FALSE, NOW())`,
      [id, name, email, subject, message]
    );

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

    let whereClause = '';
    const params: (boolean | number)[] = [];

    if (is_read !== undefined) {
      whereClause = 'WHERE is_read = ?';
      params.push(is_read === 'true');
    }

    // Get total count
    const [countResult] = await pool.execute<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM contact_messages ${whereClause}`,
      params
    );
    const total = countResult[0].count;

    // Get messages
    const [messages] = await pool.execute<ContactMessage[]>(
      `SELECT * FROM contact_messages ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: messages,
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

    await pool.execute(
      'UPDATE contact_messages SET is_read = TRUE WHERE id = ?',
      [id]
    );

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

    await pool.execute('DELETE FROM contact_messages WHERE id = ?', [id]);

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete message' });
  }
});

export default router;