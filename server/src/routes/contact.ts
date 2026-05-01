import { Router, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database';
import { authMiddleware, requireModerator, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorMiddleware';

const router = Router();

router.post('/', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) throw new AppError('All fields are required', 400);

    const { error } = await supabase.from('contact_messages').insert({
      id: uuidv4(), name, email, subject, message, is_read: false, created_at: new Date().toISOString(),
    });

    if (error) throw new AppError('Failed to send message', 500);
    res.status(201).json({ success: true, message: 'Message sent successfully' });
  } catch (error) { next(error); }
});

router.get('/', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const is_read = req.query.is_read as string;

    let query = supabase.from('contact_messages').select('*', { count: 'exact' });
    if (is_read !== undefined) query = query.eq('is_read', is_read === 'true');

    const { data: messages, count, error } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw new AppError('Failed to get messages', 500);

    const total = count || 0;
    res.json({ success: true, data: messages || [], pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
});

router.put('/:id/read', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await supabase.from('contact_messages').update({ is_read: true }).eq('id', req.params.id);
    res.json({ success: true, message: 'Message marked as read' });
  } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await supabase.from('contact_messages').delete().eq('id', req.params.id);
    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) { next(error); }
});

export default router;


