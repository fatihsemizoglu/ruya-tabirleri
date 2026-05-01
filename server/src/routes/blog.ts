import { Router, Response, NextFunction } from 'express';
import { optionalAuthMiddleware, authMiddleware, requireModerator, AuthRequest } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';
import { blogService } from '../services/blogService';

const router = Router();

router.get('/posts', cacheMiddleware({ ttl: 300 }), optionalAuthMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await blogService.getPosts({
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      category_id: req.query.category_id as string,
      is_published: req.query.is_published as string,
      search: req.query.search as string,
    });
    res.json({ success: true, ...result });
  } catch (error) { next(error); }
});

router.get('/posts/:slug', optionalAuthMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await blogService.getPostBySlug(req.params.slug);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/posts', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await blogService.createPost({ ...req.body, author_id: req.user?.id });
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/posts/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await blogService.updatePost(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/posts/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await blogService.deletePost(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.get('/categories', cacheMiddleware({ ttl: 600 }), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await blogService.getCategories();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/categories', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await blogService.createCategory(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.put('/categories/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await blogService.updateCategory(req.params.id, req.body);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.delete('/categories/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await blogService.deleteCategory(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.get('/tags', cacheMiddleware({ ttl: 300 }), async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await blogService.getTags();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.get('/posts/:id/comments', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await blogService.getComments(req.params.id);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/posts/:id/comments', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) throw new AppError('Authentication required', 401);
    const data = await blogService.createComment({ post_id: req.params.id, content: req.body.content, user_id: req.user.id, is_approved: false });
    res.status(201).json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/comments/:id/approve', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await blogService.approveComment(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.delete('/comments/:id', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await blogService.deleteComment(req.params.id);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.get('/subscribers', authMiddleware, requireModerator, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = await blogService.getSubscribers();
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

router.post('/subscribe', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const result = await blogService.subscribe(email);
    res.status(201).json({ success: true, data: result.subscriber });
  } catch (error) { next(error); }
});

router.post('/verify', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;
    await blogService.verifySubscriber(token);
    res.json({ success: true });
  } catch (error) { next(error); }
});

router.post('/unsubscribe', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    await blogService.unsubscribe(email);
    res.json({ success: true });
  } catch (error) { next(error); }
});

export default router;