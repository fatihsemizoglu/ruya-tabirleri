import { Router, Response, NextFunction } from 'express';
import { authMiddleware, requireModerator, AuthRequest } from '../middleware/auth';
import { adminService } from '../services/adminService';
import { supabase } from '../config/database';
import { AppError } from '../middleware/errorMiddleware';

const router = Router();

router.use(authMiddleware);
router.use(requireModerator);

router.get('/statistics', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await adminService.getStatistics();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/category-stats', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await adminService.getCategoryStats();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/top-dreams', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const data = await adminService.getTopDreams(limit);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/comments', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const status = req.query.status as string;
    const data = await adminService.getComments(status);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/comments/:id/approve', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await adminService.approveComment(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.post('/comments/:id/reject', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await adminService.rejectComment(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.delete('/comments/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await adminService.deleteComment(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.get('/contact-messages', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await adminService.getContactMessages();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/contact-messages/:id/read', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await adminService.markMessageRead(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.delete('/contact-messages/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await adminService.deleteMessage(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.get('/users', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const search = req.query.search as string;
    const role = req.query.role as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const data = await adminService.getUsers(search, role, page, limit);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/users/:id/role', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role } = req.body;
    await adminService.updateUserRole(req.params.id, role);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.delete('/users/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await adminService.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.get('/audit-logs', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const data = await adminService.getAuditLogs(limit);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/notifications', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.query.user_id as string;
    const data = await adminService.getNotifications(userId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/notifications', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await adminService.createNotification(req.body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/notifications/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await adminService.updateNotification(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.delete('/notifications/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await adminService.deleteNotification(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.post('/notifications/:id/toggle', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { is_active } = req.body;
    await adminService.toggleNotification(req.params.id, is_active);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.post('/notifications/:id/read', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await adminService.markNotificationRead(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.get('/notifications/active', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await adminService.getActiveNotifications();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// İçerik Takvimi
router.get('/content-calendar', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const { data, error } = await supabase.from('content_calendar').select('*').gte('scheduled_date', startDate).lt('scheduled_date', endDate).order('scheduled_date');
    if (error) throw new AppError('Takvim verileri alınamadı', 500);
    res.json({ success: true, data: data || [] });
  } catch (error) { next(error); }
});

router.post('/content-calendar', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase.from('content_calendar').insert({ ...req.body, assigned_to: req.user?.id }).select().single();
    if (error) throw new AppError('İçerik oluşturulamadı', 500);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/content-calendar/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase.from('content_calendar').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw new AppError('İçerik güncellenemedi', 500);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/content-calendar/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error } = await supabase.from('content_calendar').delete().eq('id', req.params.id);
    if (error) throw new AppError('İçerik silinemedi', 500);
    res.json({ success: true });
  } catch (error) { next(error); }
});

// Reklam Yönetimi
router.get('/ads', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
    if (error) throw new AppError('Reklamlar alınamadı', 500);
    res.json({ success: true, data: data || [] });
  } catch (error) { next(error); }
});

router.post('/ads', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase.from('ads').insert(req.body).select().single();
    if (error) throw new AppError('Reklam oluşturulamadı', 500);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/ads/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { data, error } = await supabase.from('ads').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw new AppError('Reklam güncellenemedi', 500);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/ads/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { error } = await supabase.from('ads').delete().eq('id', req.params.id);
    if (error) throw new AppError('Reklam silinemedi', 500);
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;