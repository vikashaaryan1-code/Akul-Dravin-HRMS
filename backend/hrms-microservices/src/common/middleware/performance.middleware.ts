import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Add compression hint
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Cache static resources
    if (req.method === 'GET' && !req.url.includes('/api/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    
    // API responses - short cache
    if (req.method === 'GET' && req.url.includes('/api/')) {
      res.setHeader('Cache-Control', 'private, max-age=60');
    }
    
    next();
  }
}
