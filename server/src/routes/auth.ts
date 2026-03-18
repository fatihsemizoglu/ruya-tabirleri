import { Router, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/database.js';
import { authMiddleware, generateToken } from '../middleware/auth.js';
import type { AuthRequest, LoginRequest, RegisterRequest, AuthResponse, Profile, UserRole } from '../types/index.js';
import { z } from 'zod';
import { AppError } from '../middleware/errorMiddleware.js';

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

    // Check if user already exists
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [existingUsers] = await connection.execute<Profile[]>(
        'SELECT * FROM profiles WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        await connection.rollback();
        throw new AppError('Email already registered', 400);
      }

      const userId = uuidv4();
      const profileId = uuidv4();
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user in users table
      await connection.execute(
        'INSERT INTO users (id, email, password, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [userId, email, hashedPassword]
      );

      // Create profile
      await connection.execute(
        `INSERT INTO profiles (id, user_id, email, full_name, username, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [profileId, userId, email, full_name || null, username || null]
      );

      // Assign default user role
      await connection.execute(
        'INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, ?, NOW())',
        [uuidv4(), userId, 'user']
      );

      await connection.commit();

      // Generate token
      const token = generateToken(userId, email);

      const response: AuthResponse = {
        user: {
          id: userId,
          email,
          profile: {
            id: profileId,
            user_id: userId,
            email,
            full_name: full_name || null,
            username: username || null,
            avatar_url: null,
            bio: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
          role: 'user',
        },
        token,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      };

      res.status(201).json({ success: true, data: response });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
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

    // Get user with password
    const [users] = await pool.execute<(Profile & { password: string; role: string })[]>(
      `SELECT u.id, u.email, u.password, p.*, ur.role 
       FROM users u 
       JOIN profiles p ON u.id = p.user_id 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       WHERE u.email = ?`,
      [email]
    );

    if (users.length === 0) {
      throw new AppError('Invalid email or password', 401);
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    await pool.execute(
      'UPDATE users SET updated_at = NOW() WHERE id = ?',
      [user.id]
    );

    // Generate token
    const token = generateToken(user.id, user.email);

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        profile: {
          id: user.user_id,
          user_id: user.user_id,
          email: user.email,
          full_name: user.full_name,
          username: user.username,
          avatar_url: user.avatar_url,
          bio: user.bio,
          created_at: user.created_at,
          updated_at: user.updated_at,
        },
        role: (user.role as 'admin' | 'moderator' | 'user') || 'user',
      },
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    };

    res.json({ success: true, data: response });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json({ success: true, data: req.user });
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
    const userId = req.user!.id; // req.user is guaranteed by authMiddleware
    const { full_name, username, bio, avatar_url } = req.body;

    await pool.execute(
      `UPDATE profiles 
       SET full_name = ?, username = ?, bio = ?, avatar_url = ?, updated_at = NOW() 
       WHERE user_id = ?`,
      [full_name || null, username || null, bio || null, avatar_url || null, userId]
    );

    const [profiles] = await pool.execute(
      'SELECT * FROM profiles WHERE user_id = ?',
      [userId]
    ) as [any[], any];

    res.json({
      success: true,
      data: {
        ...req.user,
        profile: profiles[0],
      }
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

    if (!current_password || !new_password) {
      throw new AppError('Current and new passwords are required', 400);
    }

    if (new_password.length < 6) {
      throw new AppError('New password must be at least 6 characters', 400);
    }

    // Get current user password
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    ) as [any[], any];

    if (users.length === 0) {
      throw new AppError('User not found', 404);
    }

    const isPasswordValid = await bcrypt.compare(current_password, users[0].password);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Update password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    await pool.execute(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;