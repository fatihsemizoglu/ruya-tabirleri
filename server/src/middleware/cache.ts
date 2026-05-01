import NodeCache from 'node-cache';
import { Request, Response, NextFunction } from 'express';

const cache = new NodeCache({
  stdTTL: 300, // 5 minutes default
  checkperiod: 60,
});

export interface CacheOptions {
  ttl?: number;
  key?: string;
}

export function cacheMiddleware(options: CacheOptions = {}) {
  const { ttl = 300, key } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method !== 'GET') {
      next();
      return;
    }

    const cacheKey = key || req.originalUrl;
    const cached = cache.get(cacheKey);

    if (cached) {
      res.set('X-Cache', 'HIT');
      res.json(cached);
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (res.statusCode === 200 && body) {
        cache.set(cacheKey, body, ttl);
      }
      return originalJson(body);
    };

    next();
  };
}

export function invalidateCache(pattern: string): void {
  const keys = cache.keys();
  keys.forEach((k) => {
    if (k.includes(pattern)) {
      cache.del(k);
    }
  });
}

export function clearAllCache(): void {
  cache.flushAll();
}

export { cache };