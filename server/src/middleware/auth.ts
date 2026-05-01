import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { supabase } from '../config/database';
import type { UserPublic, Profile, UserRole } from '../types/index';
import logger from '../utils/logger';

import { env } from '../config/env';

export interface AuthRequest extends Request {
  user?: UserPublic;
}

const JWT_SECRET = env.JWT_SECRET;

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
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.auth_token;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      res.status(401).json({ success: false, error: 'No token provided' });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }

    const [{ data: profile }, { data: roleData }] = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', decoded.userId).single(),
      supabase.from('user_roles').select('role').eq('user_id', decoded.userId).single(),
    ]);

    if (profile) {
      (req as AuthRequest).user = {
        id: decoded.userId, email: decoded.email, profile,
        role: (roleData?.role as 'admin' | 'moderator' | 'user') || 'user',
      };
      next();
      return;
    }

    const [{ data: existingUser }] = await Promise.all([
      supabase.from('users').select('id, email').eq('email', decoded.email).single(),
    ]);

    if (!existingUser) {
      res.status(401).json({ success: false, error: 'User not found in database' });
      return;
    }

    const profileId = crypto.randomUUID();
    const roleId = crypto.randomUUID();
    const now = new Date();

    await Promise.all([
      supabase.from('profiles').insert({ id: profileId, user_id: decoded.userId, email: decoded.email, full_name: decoded.email.split('@')[0], username: decoded.email.split('@')[0] }),
      supabase.from('user_roles').insert({ id: roleId, user_id: decoded.userId, role: 'user' }),
    ]);

    (req as AuthRequest).user = {
      id: decoded.userId, email: decoded.email,
      profile: { id: profileId, user_id: decoded.userId, email: decoded.email, full_name: decoded.email.split('@')[0], username: decoded.email.split('@')[0], avatar_url: null, bio: null, created_at: now, updated_at: now },
      role: 'user',
    };
    next();
  } catch (error) {
    logger.error({ err: error }, 'Auth middleware error');
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};

export const optionalAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const cookieToken = req.cookies?.auth_token;

    let token: string | undefined;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (cookieToken) {
      token = cookieToken;
    }

    if (!token) {
      next();
      return;
    }

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
    logger.error({ err: error }, 'Auth middleware error');
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

