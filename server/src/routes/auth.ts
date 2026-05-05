import { Router, Response, NextFunction } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { authService, setAuthCookie, clearAuthCookie } from '../services/authService';
import { supabaseAuthService } from '../services/supabaseAuthService';
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

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const updatePasswordSchema = z.object({
  new_password: z.string().min(6, 'Password must be at least 6 characters'),
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

    const response = await supabaseAuthService.register({ email, password, full_name, username });
    setAuthCookie(res, response.token);
    res.status(201).json({ success: true, data: { user: response.user, token: response.token, expiresIn: response.expiresIn } });
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

    const response = await supabaseAuthService.login({ email, password });
    setAuthCookie(res, response.token);
    res.json({ success: true, data: { user: response.user, token: response.token, expiresIn: response.expiresIn } });
  } catch (error) {
    next(error);
  }
});

// Admin Login
router.post('/admin', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new AppError('Validation failed', 400);
    }

    const { email, password } = validationResult.data as LoginRequest;

    const response = await supabaseAuthService.adminLogin({ email, password });
    setAuthCookie(res, response.token);
    res.json({ success: true, data: { user: response.user, token: response.token, expiresIn: response.expiresIn } });
  } catch (error) {
    next(error);
  }
});

// Password Reset Request
router.post('/reset-password', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = resetPasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new AppError('Validation failed', 400);
    }

    const { email } = validationResult.data;
    const response = await supabaseAuthService.resetPassword(email);
    res.json({ success: true, ...response });
  } catch (error) {
    next(error);
  }
});

// Password Reset Update
router.put('/reset-password', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validationResult = updatePasswordSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw new AppError('Validation failed', 400);
    }

    const { new_password } = validationResult.data;
    const response = await supabaseAuthService.updatePassword(new_password);
    res.json({ success: true, ...response });
  } catch (error) {
    next(error);
  }
});

// OAuth Sign In
router.get('/oauth/:provider', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { provider } = req.params;

    if (!['google', 'facebook', 'github'].includes(provider)) {
      throw new AppError('Invalid OAuth provider', 400);
    }

    const response = await supabaseAuthService.signInWithOAuth(provider as 'google' | 'facebook' | 'github');
    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
});

// OAuth Callback (handles the redirect from OAuth provider)
router.get('/oauth/callback', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { access_token, refresh_token } = req.query;

    if (!access_token) {
      throw new AppError('Invalid OAuth callback', 400);
    }

    const response = await supabaseAuthService.verifyOAuthToken(access_token as string);
    setAuthCookie(res, response.token);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${response.token}`);
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
