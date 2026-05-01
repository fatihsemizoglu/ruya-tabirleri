import { Router, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { authService, setAuthCookie, clearAuthCookie } from '../services/authService';
import type { LoginRequest, RegisterRequest } from '../types/index';
import { z } from 'zod';
import { AppError } from '../middleware/errorMiddleware';

const router = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().optional(),
  username: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Register
router.post('/register', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = registerSchema.safeParse(req.body);

    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validationResult.error.errors
      });
      return;
    }

    const { email, password, full_name, username } = validationResult.data as RegisterRequest;

    const response = await authService.register({ email, password, full_name, username });
    setAuthCookie(res, response.token);
    res.status(201).json({ success: true, data: { user: response.user, expiresIn: response.expiresIn } });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new AppError('Validation failed', 400);
    }

    const { email, password } = validationResult.data as LoginRequest;

    const response = await authService.login({ email, password });
    setAuthCookie(res, response.token);
    res.json({ success: true, data: { user: response.user, expiresIn: response.expiresIn } });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const response = await authService.getProfile(userId);
    res.json({ success: true, data: response.user });
  } catch (error) {
    next(error);
  }
});

// Logout
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logged out successfully' });
});

router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { full_name, username, bio, avatar_url } = req.body;
    const response = await authService.updateProfile(req.user!.id, { full_name, username, bio, avatar_url });
    res.json({ success: true, data: response.user });
  } catch (error) { next(error); }
});

// Change password
router.put('/password', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { current_password, new_password } = req.body;

    const response = await authService.changePassword(userId, { current_password, new_password });
    res.json({ success: true, message: response.message });
  } catch (error) {
    next(error);
  }
});

export default router;
