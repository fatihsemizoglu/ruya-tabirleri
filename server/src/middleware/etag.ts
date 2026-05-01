import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

export function etagMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);
  
  res.json = (data: any) => {
    if (req.method === 'GET' && data && !res.getHeader('ETag')) {
      const jsonString = JSON.stringify(data);
      const hash = crypto.createHash('md5').update(jsonString).digest('hex');
      const etag = `"${hash}"`;
      
      res.setHeader('ETag', etag);
      
      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch === etag) {
        res.status(304).end();
        return res;
      }
    }
    return originalJson(data);
  };
  
  next();
}