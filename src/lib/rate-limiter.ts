import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

export class DatabaseRateLimiter {
  // Consume rate limit points for a given key.
  // Backed by PostgreSQL RateLimit table for multi-instance high-availability.
  static async consume(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

    try {
      // Fetch or initialize rate limit record
      const record = await prisma.rateLimit.findUnique({
        where: { key },
      });

      if (!record || record.expiresAt < now) {
        // Window expired or first request -> create / reset
        await prisma.rateLimit.upsert({
          where: { key },
          create: {
            key,
            points: 1,
            expiresAt,
          },
          update: {
            points: 1,
            expiresAt,
          },
        });

        return {
          success: true,
          limit,
          remaining: limit - 1,
          resetSeconds: windowSeconds,
        };
      }

      // Existing window active
      const remainingTime = Math.max(1, Math.ceil((record.expiresAt.getTime() - now.getTime()) / 1000));

      if (record.points >= limit) {
        return {
          success: false,
          limit,
          remaining: 0,
          resetSeconds: remainingTime,
        };
      }

      // Increment points
      const updated = await prisma.rateLimit.update({
        where: { key },
        data: {
          points: { increment: 1 },
        },
      });

      return {
        success: true,
        limit,
        remaining: Math.max(0, limit - updated.points),
        resetSeconds: remainingTime,
      };
    } catch (err) {
      // In case of transient DB issue, log and fail-open to not break core availability
      console.warn(`[RateLimiter] Database rate check warning:`, err);
      return {
        success: true,
        limit,
        remaining: limit - 1,
        resetSeconds: windowSeconds,
      };
    }
  }

  // Clean up expired rate limits (can be called periodically or in background tasks).
  static async cleanupExpired(): Promise<number> {
    try {
      const result = await prisma.rateLimit.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });
      return result.count;
    } catch {
      return 0;
    }
  }
}

// Extract client IP or identifier from request headers
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

// Middleware helper for API routes: checks rate limit and returns 429 response if exceeded.
export async function enforceRateLimit(
  req: NextRequest,
  prefix: string,
  limit: number,
  windowSeconds: number,
  userId?: string
): Promise<NextResponse | null> {
  // In CI automated testing, bypass IP rate limiting to prevent test suite self-throttling
  if (process.env.CI === 'true') {
    return null;
  }

  const ip = getClientIp(req);
  const identifier = userId ? `${prefix}:${userId}` : `${prefix}:${ip}`;

  const result = await DatabaseRateLimiter.consume(identifier, limit, windowSeconds);

  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: `Too many requests. Please retry after ${result.resetSeconds} seconds.`,
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: result.resetSeconds,
      },
      {
        status: 429,
        headers: {
          'Retry-After': result.resetSeconds.toString(),
          'X-RateLimit-Limit': result.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.resetSeconds.toString(),
        },
      }
    );
  }

  return null;
}
