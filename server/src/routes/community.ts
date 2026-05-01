import { Router, Response, NextFunction } from 'express';
import { authMiddleware, optionalAuthMiddleware, AuthRequest } from '../middleware/auth';
import { pollService } from '../services/pollService';
import { trendingService } from '../services/trendingService';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Günlük anket
router.get('/poll/today', optionalAuthMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const poll = await pollService.getTodayPoll();
    let userVote = null;
    if (poll && req.user) {
      userVote = await pollService.getUserVote(poll.id, req.user.id);
    }
    res.json({ success: true, data: poll, userVote });
  } catch (error) { next(error); }
});

router.post('/poll/vote', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { pollId, optionIndex } = req.body;
    await pollService.vote(pollId, req.user!.id, optionIndex);
    const poll = await pollService.getTodayPoll();
    res.json({ success: true, data: poll });
  } catch (error) { next(error); }
});

router.get('/poll/history', cacheMiddleware({ ttl: 300 }), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 30;
    const data = await pollService.getPollHistory(limit);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// Trending temalar
router.get('/trending/weekly', cacheMiddleware({ ttl: 600 }), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const data = await trendingService.getWeeklyTrending(limit);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/trending/monthly', cacheMiddleware({ ttl: 600 }), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const data = await trendingService.getMonthlyTrending(limit);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

export default router;
