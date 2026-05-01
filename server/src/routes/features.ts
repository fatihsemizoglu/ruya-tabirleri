import { Router, Response, NextFunction } from 'express';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../middleware/auth';
import { journalAnalyticsService } from '../services/journalAnalyticsService';
import { reactionService } from '../services/reactionService';
import { consultantService } from '../services/consultantService';
import { adService } from '../services/adService';

const router = Router();

// Takvim verileri
router.get('/calendar', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const data = await journalAnalyticsService.getCalendarData(req.user!.id, year, month);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// Aylık özet
router.get('/monthly-summary', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const data = await journalAnalyticsService.getMonthlySummary(req.user!.id, year, month);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// Uyku kalitesi
router.get('/sleep', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const data = await journalAnalyticsService.getSleepQuality(req.user!.id, days);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/sleep', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sleepDate, quality, hoursSlept, notes } = req.body;
    const data = await journalAnalyticsService.logSleepQuality(req.user!.id, sleepDate, quality, hoursSlept, notes);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// Uyku-rüya korelasyonu
router.get('/sleep-correlation', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const days = parseInt(req.query.days as string) || 90;
    const data = await journalAnalyticsService.getSleepCorrelation(req.user!.id, days);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// Emoji reaksiyonları
router.get('/reactions/:commentId', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await reactionService.getReactions(req.params.commentId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/reactions/:commentId', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { emoji } = req.body;
    const result = await reactionService.toggleReaction(req.params.commentId, req.user!.id, emoji);
    const reactions = await reactionService.getReactions(req.params.commentId);
    res.json({ success: true, data: reactions, ...result });
  } catch (error) { next(error); }
});

// Rüya danışmanlığı
router.get('/consultants', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await consultantService.getAll(true);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/consultants/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await consultantService.getById(req.params.id);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/appointments', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { consultantId, appointmentDate, durationMinutes, notes } = req.body;
    const data = await consultantService.bookAppointment(consultantId, req.user!.id, appointmentDate, durationMinutes, notes);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/appointments', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await consultantService.getUserAppointments(req.user!.id);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/appointments/:id/cancel', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await consultantService.cancelAppointment(req.params.id, req.user!.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

// Reklamlar
router.get('/ads', optionalAuthMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const position = req.query.position as string;
    const data = await adService.getActiveAds(position);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/ads/:id/impression', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await adService.recordImpression(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.post('/ads/:id/click', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await adService.recordClick(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;
