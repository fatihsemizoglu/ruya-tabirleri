import { pool } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { AppError } from '../middleware/errorMiddleware.js';
import type { LoginRequest, RegisterRequest, AuthResponse, UserPublic, Profile, UserRole } from '../types/index.js';
import { generateToken, AuthRequest } from '../middleware/auth.js';

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const { email, password, full_name, username } = data;

    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT * FROM profiles WHERE email = ?',
      [email]
    ) as any;

    if (existingUsers.length > 0) {
      throw new AppError('Email already registered', 400);
    }

    const userId = uuidv4();
    const profileId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
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
          name: full_name || username || undefined,
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

      return response;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const { email, password } = data;

    // Get user with password
    const [users] = await pool.execute(
      `SELECT u.id, u.email, u.password, p.*, ur.role 
       FROM users u 
       JOIN profiles p ON u.id = p.user_id 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       WHERE u.email = ?`,
      [email]
    ) as any;

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
        name: user.full_name || user.username || undefined,
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

    return response;
  }

  /**
   * Get current user profile
   */
  async getProfile(userId: string): Promise<{ user: UserPublic }> {
    const [profiles] = await pool.execute(
      'SELECT * FROM profiles WHERE user_id = ?',
      [userId]
    ) as any;

    if (profiles.length === 0) {
      throw new AppError('Profile not found', 404);
    }

    const profile = profiles[0];

    // Get user role
    const [roles] = await pool.execute(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [userId]
    ) as any;

    const role = (roles[0]?.role as 'admin' | 'moderator' | 'user') || 'user';

    const user: UserPublic = {
      id: profile.user_id,
      email: profile.email,
      name: profile.full_name || profile.username || undefined,
      profile,
      role,
    };

    return { user };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: { full_name?: string; username?: string; bio?: string; avatar_url?: string }
  ): Promise<{ user: UserPublic }> {
    const { full_name, username, bio, avatar_url } = data;

    await pool.execute(
      `UPDATE profiles 
       SET full_name = ?, username = ?, bio = ?, avatar_url = ?, updated_at = NOW() 
       WHERE user_id = ?`,
      [full_name || null, username || null, bio || null, avatar_url || null, userId]
    );

    const [profiles] = await pool.execute(
      'SELECT * FROM profiles WHERE user_id = ?',
      [userId]
    ) as any;

    if (profiles.length === 0) {
      throw new AppError('Profile not found', 404);
    }

    const profile = profiles[0];

    // Get user role
    const [roles] = await pool.execute(
      'SELECT role FROM user_roles WHERE user_id = ?',
      [userId]
    ) as any;

    const role = (roles[0]?.role as 'admin' | 'moderator' | 'user') || 'user';

    const user: UserPublic = {
      id: profile.user_id,
      email: profile.email,
      name: profile.full_name || profile.username || undefined,
      profile,
      role,
    };

    return { user };
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    data: { current_password: string; new_password: string }
  ): Promise<{ message: string }> {
    const { current_password, new_password } = data;

    if (new_password.length < 6) {
      throw new AppError('New password must be at least 6 characters', 400);
    }

    // Get current user password
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    ) as any;

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

    return { message: 'Password updated successfully' };
  }
}

// Export a singleton instance
export const authService = new AuthService();