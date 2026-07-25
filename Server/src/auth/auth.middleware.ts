import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const blacklistedTokens = new Set<string>();

export function blacklistToken(token: string) {
  blacklistedTokens.add(token);
}

export function isTokenBlacklisted(token: string) {
  return blacklistedTokens.has(token);
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly jwtSecret = process.env.JWT_SECRET || process.env.SECRET_KEY || 'defaultJwtSecret';

  use(req: Request, res: Response, next: NextFunction) {
    // Allow CORS preflight requests through without auth
    if (req.method === 'OPTIONS') {
      return next();
    }
    const authorization = req.headers['authorization'] || req.headers['Authorization'];
    const token = typeof authorization === 'string' && authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : null;

    if (!token) {
      throw new UnauthorizedException('Authorization token missing');
    }

    if (isTokenBlacklisted(token)) {
      throw new UnauthorizedException('Token has been logged out');
    }

    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      (req as any).user = decoded;
      next();
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
