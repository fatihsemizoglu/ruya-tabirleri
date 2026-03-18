import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { pool } from '../config/database.js';
import type { AuthUser, Profile, UserRole } from '../types/index.js';

// Extend Express Request type
export interface AuthRequest extends Request {
  user?: AuthUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export const generateToken = (userId: string, email: string): string => {
  return jwt.sign(
    { userId, email },
    JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
  );
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }

    // Get user profile and role
    const [profiles] = await pool.execute(
      `SELECT p.*, ur.role 
       FROM profiles p 
       LEFT JOIN user_roles ur ON p.user_id = ur.user_id 
       WHERE p.user_id = ?`,
      [decoded.userId]
    );

    // If no profile found, check if there's a profile with this email
    if (profiles.length === 0) {
      // Check if there's a user with this email in the users table
      const [existingUsers] = await pool.execute(
        'SELECT id, email FROM users WHERE email = ?',
        [decoded.email]
      );

      if (existingUsers.length > 0) {
        // There's a user with this email, create profile for the current userId
        const [emailProfiles] = await pool.execute(
          'SELECT * FROM profiles WHERE email = ?',
          [decoded.email]
        );
        
        if (emailProfiles.length > 0) {
          // Use existing profile and role
          const [roles] = await pool.execute(
            'SELECT role FROM user_roles WHERE user_id = ?',
            [existingUsers[0].id]
          );
          
          (req as AuthRequest).user = {
            id: decoded.userId,
            email: decoded.email,
            profile: emailProfiles[0],
            role: (roles[0]?.role as 'admin' | 'moderator' | 'user') || 'user',
          };
        } else {
          // Create profile for this user
          const profileId = crypto.randomUUID();
          await pool.execute(
            `INSERT INTO profiles (id, user_id, email, full_name, username, created_at, updated_at) 
             VALUES (?, ?, ?, 'Admin', 'admin', NOW(), NOW())`,
            [profileId, decoded.userId, decoded.email]
          );
          
          // Assign admin role
          await pool.execute(
            'INSERT INTO user_roles (id, user_id, role, created_at) VALUES (?, ?, ?, NOW())',
            [crypto.randomUUID(), decoded.userId, 'admin']
          );

          (req as AuthRequest).user = {
            id: decoded.userId,
            email: decoded.email,
            profile: {
              id: profileId,
              user_id: decoded.userId,
              email: decoded.email,
              full_name: 'Admin',
              username: 'admin',
              avatar_url: null,
              bio: null,
              created_at: new Date(),
              updated_at: new Date(),
            },
            role: 'admin',
          };
        }
      } else {
        // No user with this email - this shouldn't happen normally
        res.status(401).json({ success: false, error: 'User not found in database' });
        return;
      }
    } else {
      const userProfile = profiles[0];
      
      (req as AuthRequest).user = {
        id: decoded.userId,
        email: decoded.email,
        profile: {
          id: userProfile.id,
          user_id: userProfile.user_id,
          email: userProfile.email,
          full_name: userProfile.full_name,
          username: userProfile.username,
          avatar_url: userProfile.avatar_url,
          bio: userProfile.bio,
          created_at: userProfile.created_at,
          updated_at: userProfile.updated_at,
        },
        role: (userProfile.role as 'admin' | 'moderator' | 'user') || 'user',
      };
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};

export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      next();
      return;
    }

    // Get user profile and role
    const [profiles] = await pool.execute(
      `SELECT p.*, ur.role 
      FROM profiles p 
      LEFT JOIN user_roles ur ON p.user_id = ur.user_id 
      WHERE p.user_id = ?`,
      [decoded.userId]
    );

    if (profiles.length > 0) {
      const userProfile = profiles[0];
      
      (req as AuthRequest).user = {
        id: decoded.userId,
        email: decoded.email,
        profile: {
          id: userProfile.id,
          user_id: userProfile.user_id,
          email: userProfile.email,
          full_name: userProfile.full_name,
          username: userProfile.username,
          avatar_url: userProfile.avatar_url,
          bio: userProfile.bio,
          created_at: userProfile.created_at,
          updated_at: userProfile.updated_at,
        },
        role: (userProfile.role as 'admin' | 'moderator' | 'user') || 'user',
      };
    }

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

export const requireRole = (...roles: ('admin' | 'moderator' | 'user')[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;
    
    if (!user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({ success: false, error: 'Insufficient permissions' });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');
export const requireModerator = requireRole('admin', 'moderator');
