import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { env } from '../config/env';

const userRequestCounts = new Map<string, { count: number; resetTime: number }>();

export function perUserRateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userId = (req as AuthRequest).user?.id;
    const key = userId || req.ip || 'anonymous';
    const now = Date.now();

    let entry = userRequestCounts.get(key);
    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + windowMs };
      userRequestCounts.set(key, entry);
    }

    entry.count++;

    const remaining = Math.max(0, maxRequests - entry.count);
    res.set('X-RateLimit-Limit', String(maxRequests));
    res.set('X-RateLimit-Remaining', String(remaining));
    res.set('X-RateLimit-Reset', String(Math.ceil(entry.resetTime / 1000)));

    if (entry.count > maxRequests) {
      res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      });
      return;
    }

    next();
  };
}

export function premiumRateLimit(req: Request, res: Response, next: NextFunction): void {
  const user = (req as AuthRequest).user;
  const role = user?.role || 'user';

  const limits: Record<string, number> = {
    admin: 1000,
    moderator: 500,
    user: env.isDevelopment ? 500 : 100,
  };

  perUserRateLimit(limits[role] || 100)(req, res, next);
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of userRequestCounts.entries()) {
    if (now > entry.resetTime) {
      userRequestCounts.delete(key);
    }
  }
}, 60000);
