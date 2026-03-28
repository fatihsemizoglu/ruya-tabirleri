import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/database';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { authService } from '../services/authService';
import type { LoginRequest, RegisterRequest, AuthResponse, UserPublic } from '../types/index';
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
    res.status(201).json({ success: true, data: response });
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
    res.json({ success: true, data: response });
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

// Logout (client-side token removal, but we can log it)
router.post('/logout', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Update profile
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { full_name, username, bio, avatar_url } = req.body;

    await supabase
      .from('profiles')
      .update({
        full_name: full_name || null,
        username: username || null,
        bio: bio || null,
        avatar_url: avatar_url || null,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    const { data: updatedProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!updatedProfile) {
      res.status(404).json({ success: false, error: 'Profile not found' });
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    const role = (roleData?.role as 'admin' | 'moderator' | 'user') || 'user';

    const user: UserPublic = {
      id: updatedProfile.user_id,
      email: updatedProfile.email,
      name: updatedProfile.full_name || updatedProfile.username || undefined,
      profile: updatedProfile,
      role,
    };

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
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
