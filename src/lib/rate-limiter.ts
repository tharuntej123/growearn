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
  // Backed by PostgreSQL rate_limits table with atomic single-statement upsert
  // for multi-instance high-availability and zero race conditions under concurrent load.
  static async consume(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + windowSeconds * 1000);

    try {
      const rows = await prisma.$queryRawUnsafe<Array<{ points: number; expires_at: Date }>>(
        `
        INSERT INTO rate_limits (key, points, expires_at)
        VALUES ($1, 1, $2)
        ON CONFLICT (key)
        DO UPDATE SET
          points = CASE WHEN rate_limits.expires_at < NOW() THEN 1 ELSE rate_limits.points + 1 END,
          expires_at = CASE WHEN rate_limits.expires_at < NOW() THEN $2 ELSE rate_limits.expires_at END
        RETURNING points, expires_at;
        `,
        key,
        expiresAt
      );

      const record = rows[0];
      const points = record ? record.points : 1;
      const recordExpiresAt = record?.expires_at ? new Date(record.expires_at) : expiresAt;
      const remainingTime = Math.max(1, Math.ceil((recordExpiresAt.getTime() - now.getTime()) / 1000));

      if (points > limit) {
        return {
          success: false,
          limit,
          remaining: 0,
          resetSeconds: remainingTime,
        };
      }

      return {
        success: true,
        limit,
        remaining: Math.max(0, limit - points),
        resetSeconds: remainingTime,
      };
    } catch (err) {
      console.warn(`[RateLimiter] Database rate check error:`, err);

      // Strict fail-closed policy for sensitive and abuse-prone endpoints
      const isSensitivePath =
        key.startsWith('auth:') ||
        key.startsWith('payments:') ||
        key.startsWith('ai:') ||
        key.startsWith('storage:') ||
        key.startsWith('mentorship:');

      if (isSensitivePath) {
        return {
          success: false,
          limit,
          remaining: 0,
          resetSeconds: windowSeconds,
        };
      }

      // Fail-open for general read endpoints to avoid total platform outage on transient DB errors
      return {
        success: true,
        limit,
        remaining: Math.max(0, limit - 1),
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

function isValidIp(ip: string): boolean {
  // Validate IPv4 or IPv6 format
  const ipv4Pattern = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){1,7}[0-9a-fA-F]{1,4}$|^::1$/;
  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

// Extract client IP or identifier safely
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const candidate = forwarded.split(',')[0].trim();
    if (isValidIp(candidate)) {
      return candidate;
    }
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp && isValidIp(realIp.trim())) {
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
  // In automated test environments only, bypass rate limiting if CI=true is explicitly set
  if (process.env.NODE_ENV === 'test' && process.env.CI === 'true') {
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
