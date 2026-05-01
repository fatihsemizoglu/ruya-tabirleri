import { Router, Response, NextFunction } from 'express';
import { authMiddleware, optionalAuthMiddleware, requireModerator, AuthRequest } from '../middleware/auth';
import { symbolService } from '../services/symbolService';
import { culturalService } from '../services/culturalService';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Sembol sözlüğü
router.get('/symbols', cacheMiddleware({ ttl: 600 }), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const result = await symbolService.getAll(page, limit, search);
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

router.get('/symbols/:slug', cacheMiddleware({ ttl: 300 }), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await symbolService.getBySlug(req.params.slug);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/symbols/:slug/related', cacheMiddleware({ ttl: 300 }), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await symbolService.getRelated(req.params.slug);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/symbols', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await symbolService.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/symbols/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await symbolService.update(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/symbols/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await symbolService.delete(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

// Kültürel yorumlar
router.get('/cultures', cacheMiddleware({ ttl: 600 }), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await culturalService.getCultures();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/cultures/:code', cacheMiddleware({ ttl: 300 }), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const result = await culturalService.getByCulture(req.params.code, page);
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

router.get('/compare/:symbol', cacheMiddleware({ ttl: 300 }), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await culturalService.compareSymbol(req.params.symbol);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// Osmanlı tabirleri
router.get('/ottoman', cacheMiddleware({ ttl: 600 }), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const search = req.query.search as string;
    const result = await culturalService.getOttomanInterpretations(page, 50, search);
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

export default router;
