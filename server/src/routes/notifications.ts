import { Router, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { notificationService } from '../services/notificationService';
import { journalAnalyticsService } from '../services/journalAnalyticsService';
import { reactionService } from '../services/reactionService';

const router = Router();

// Kullanıcı bildirimleri
router.get('/', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unread === 'true';
    const result = await notificationService.getUserNotifications(req.user!.id, page, limit, unreadOnly);
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

router.get('/unread-count', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const count = await notificationService.getUnreadCount(req.user!.id);
    res.json({ success: true, count });
  } catch (error) { next(error); }
});

router.put('/:id/read', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await notificationService.markAsRead(req.params.id, req.user!.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.put('/read-all', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await notificationService.markAllAsRead(req.user!.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await notificationService.delete(req.params.id, req.user!.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

// Bildirim tercihleri
router.get('/preferences', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await notificationService.getPreferences(req.user!.id);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/preferences', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await notificationService.updatePreferences(req.user!.id, req.body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// Push notification aboneliği
router.post('/push/subscribe', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await notificationService.subscribeToPush(req.user!.id, req.body);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.post('/push/unsubscribe', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await notificationService.unsubscribeFromPush(req.user!.id, req.body.endpoint);
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;
