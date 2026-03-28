import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabase } from '../config/database';
import type { UserPublic, Profile, UserRole } from '../types/index';

export interface AuthRequest extends Request {
  user?: UserPublic;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export const generateToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email }, JWT_SECRET as string, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any);
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', decoded.userId)
      .single();

    if (!profile) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', decoded.email)
        .single();

      if (existingUser) {
        const { data: emailProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', decoded.email)
          .single();

        if (emailProfile) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', existingUser.id)
            .single();

          (req as AuthRequest).user = {
            id: decoded.userId,
            email: decoded.email,
            profile: emailProfile,
            role: (roleData?.role as 'admin' | 'moderator' | 'user') || 'user',
          };
        } else {
          const profileId = crypto.randomUUID();
          await supabase.from('profiles').insert({
            id: profileId,
            user_id: decoded.userId,
            email: decoded.email,
            full_name: 'Admin',
            username: 'admin',
          });

          await supabase.from('user_roles').insert({
            id: crypto.randomUUID(),
            user_id: decoded.userId,
            role: 'admin',
          });

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
        res.status(401).json({ success: false, error: 'User not found in database' });
        return;
      }
    } else {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', decoded.userId)
        .single();

      (req as AuthRequest).user = {
        id: decoded.userId,
        email: decoded.email,
        profile,
        role: (roleData?.role as 'admin' | 'moderator' | 'user') || 'user',
      };
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};

export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', decoded.userId)
      .single();

    if (profile) {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', decoded.userId)
        .single();

      (req as AuthRequest).user = {
        id: decoded.userId,
        email: decoded.email,
        profile,
        role: (roleData?.role as 'admin' | 'moderator' | 'user') || 'user',
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
