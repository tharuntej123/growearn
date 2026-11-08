import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from './prisma';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  failClosed?: boolean;
}

export interface CircuitBreakerMetrics {
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  totalFailures: number;
  consecutiveFailures: number;
  lastFailureTime: number | null;
}

export class MemoryFallbackLimiter {
  private static store = new Map<string, { points: number; resetAt: number }>();

  static consume(key: string, limit: number, windowSeconds: number): RateLimitResult {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetAt <= now) {
      this.store.set(key, { points: 1, resetAt: now + windowSeconds * 1000 });
      return { success: true, limit, remaining: Math.max(0, limit - 1), resetSeconds: windowSeconds };
    }

    entry.points += 1;
    const resetSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));

    if (entry.points > limit) {
      return { success: false, limit, remaining: 0, resetSeconds };
    }

    return { success: true, limit, remaining: Math.max(0, limit - entry.points), resetSeconds };
  }
}

export class DatabaseRateLimiter {
  // Circuit breaker state tracking
  private static circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private static consecutiveFailures = 0;
  private static totalFailures = 0;
  private static lastFailureTime: number | null = null;
  private static lastLogTime = 0;

  private static readonly FAILURE_THRESHOLD = 5;
  private static readonly CIRCUIT_COOLDOWN_MS = 15000; // 15s circuit breaker trial cooldown
  private static readonly LOG_THROTTLE_MS = 30000; // Throttle log flooding to once per 30s

  /**
   * Returns current circuit breaker telemetry and failure counters.
   */
  static getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.circuitState,
      totalFailures: this.totalFailures,
      consecutiveFailures: this.consecutiveFailures,
      lastFailureTime: this.lastFailureTime,
    };
  }

  /**
   * Resets circuit breaker state (useful in test suites).
   */
  static resetCircuit(): void {
    this.circuitState = 'CLOSED';
    this.consecutiveFailures = 0;
    this.lastFailureTime = null;
  }

  /**
   * Consume rate limit points for a given key.
   * Backed by PostgreSQL rate_limits table with atomic single-statement upsert.
   * On database failure or circuit trip, executes a tiered degradation policy:
   * - High-risk targets (auth, payments, AI) fail closed.
   * - Low-risk read routes fail open with a stricter in-memory limit.
   */
  static async consume(
    key: string,
    limit: number,
    windowSeconds: number,
    options?: { failClosed?: boolean }
  ): Promise<RateLimitResult> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
    const shouldFailClosed = Boolean(options?.failClosed);

    // Circuit Breaker Evaluation
    const currentTime = Date.now();
    if (this.circuitState === 'OPEN') {
      if (this.lastFailureTime && currentTime - this.lastFailureTime > this.CIRCUIT_COOLDOWN_MS) {
        this.circuitState = 'HALF_OPEN';
      } else {
        // Circuit is open: execute tiered degradation without hammering down DB
        return this.handleDegradedMode(key, limit, windowSeconds, shouldFailClosed);
      }
    }

    try {
      const rows = await prisma.$queryRawUnsafe<Array<{ points: number; expires_at: Date }>>(
        `
        INSERT INTO rate_limits (key, points, expires_at)
        VALUES ($1, 1, NOW() + ($2 || ' seconds')::interval)
        ON CONFLICT (key)
        DO UPDATE SET
          points = CASE WHEN rate_limits.expires_at < NOW() THEN 1 ELSE rate_limits.points + 1 END,
          expires_at = CASE WHEN rate_limits.expires_at < NOW() THEN NOW() + ($2 || ' seconds')::interval ELSE rate_limits.expires_at END
        RETURNING points, expires_at;
        `,
        key,
        windowSeconds.toString()
      );

      // On successful database interaction, reset circuit if it was HALF_OPEN
      if (this.circuitState === 'HALF_OPEN') {
        this.circuitState = 'CLOSED';
        this.consecutiveFailures = 0;
      }

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
 } catch (_e) { const err = _e as Error; 
      this.totalFailures += 1;
      this.consecutiveFailures += 1;
      this.lastFailureTime = Date.now();

      // Trip circuit breaker if consecutive failure threshold is exceeded
      if (this.consecutiveFailures >= this.FAILURE_THRESHOLD) {
        this.circuitState = 'OPEN';
      }

      // Throttled high-severity logging to avoid log storms during pooler outages
      if (Date.now() - this.lastLogTime > this.LOG_THROTTLE_MS) {
        this.lastLogTime = Date.now();
        logger.error('[RateLimiter:HighSeverity] Database connection failed; rate limiter operating in degraded mode', {
          error: err?.message || String(err),
          circuitState: this.circuitState,
          consecutiveFailures: this.consecutiveFailures,
          totalFailures: this.totalFailures,
        });
      }

      return this.handleDegradedMode(key, limit, windowSeconds, shouldFailClosed);
    }
  }

  /**
   * Tiered degradation strategy:
   * - Critical abuse/cost targets: Fail closed (return 429/503).
   * - Low-risk read routes: Fail open with a stricter in-memory limit.
   */
  private static handleDegradedMode(
    key: string,
    limit: number,
    windowSeconds: number,
    failClosed: boolean
  ): RateLimitResult {
    if (failClosed) {
      return {
        success: false,
        limit,
        remaining: 0,
        resetSeconds: 60,
        failClosed: true,
      };
    }

    // Low-risk read routes: stricter quota in memory (50% of standard limit, at least 1)
    const strictLimit = Math.max(1, Math.floor(limit / 2));
    return MemoryFallbackLimiter.consume(key, strictLimit, windowSeconds);
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
  const ipv4Pattern = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
  const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){1,7}[0-9a-fA-F]{1,4}$|^::1$/;
  return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

/**
 * Securely extracts the authentic client IP address.
 * Prevents client-side X-Forwarded-For header spoofing by:
 * 1. Prioritizing trusted cloud platform headers (Vercel, Cloudflare, x-real-ip).
 * 2. Taking the rightmost IP in X-Forwarded-For (appended by the edge proxy)
 *    rather than the attacker-controlled leftmost header.
 */
export function getClientIp(req: NextRequest): string {
  // 1. Vercel trusted edge header
  const vercelIp = req.headers.get('x-vercel-forwarded-for');
  if (vercelIp) {
    const candidate = vercelIp.split(',')[0].trim();
    if (isValidIp(candidate)) return candidate;
  }

  // 2. Cloudflare trusted edge header
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp && isValidIp(cfIp.trim())) {
    return cfIp.trim();
  }

  // 3. Trusted Real IP header
  const realIp = req.headers.get('x-real-ip');
  if (realIp && isValidIp(realIp.trim())) {
    return realIp.trim();
  }

  // 4. Standard X-Forwarded-For: Take the rightmost verified entry
  // In a reverse-proxy topology, proxies append IPs; the leftmost IP can be injected by untrusted clients.
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const candidates = forwarded
      .split(',')
      .map((ip) => ip.trim())
      .filter((ip) => isValidIp(ip));

    if (candidates.length > 0) {
      // Pick the rightmost IP representing the connection received by the first trusted ingress proxy
      return candidates[candidates.length - 1];
    }
  }

  return '127.0.0.1';
}

/**
 * Identifies whether a target route is an abuse or cost target that must fail closed.
 */
export function isAbuseOrCostTarget(pathname: string, prefix?: string): boolean {
  const p = pathname.toLowerCase();
  const pref = (prefix || '').toLowerCase();
  return (
    p.startsWith('/api/auth') ||
    p.startsWith('/api/payments') ||
    p.startsWith('/api/ai') ||
    p.includes('login') ||
    p.includes('register') ||
    p.includes('password') ||
    p.includes('verify') ||
    pref.includes('auth') ||
    pref.includes('payment') ||
    pref.includes('ai')
  );
}

// Middleware helper for API routes: checks rate limit and returns 429/503 response if exceeded or failed-closed.
export async function enforceRateLimit(
  req: NextRequest,
  prefix: string,
  limit: number,
  windowSeconds: number,
  userId?: string,
  options?: { failClosed?: boolean }
): Promise<NextResponse | null> {
  // In automated test environments only, bypass rate limiting if CI=true is explicitly set
  // UNLESS the request is explicitly testing rate limits
  if (process.env.NODE_ENV === 'test' && process.env.CI === 'true' && !req.headers.has('x-test-rate-limit')) {
    return null;
  }

  const ip = getClientIp(req);
  const identifier = userId ? `${prefix}:${userId}` : `${prefix}:${ip}`;
  const shouldFailClosed = options?.failClosed ?? isAbuseOrCostTarget(req.nextUrl.pathname, prefix);

  const result = await DatabaseRateLimiter.consume(identifier, limit, windowSeconds, {
    failClosed: shouldFailClosed,
  });

  if (!result.success) {
    if (result.failClosed) {
      const message = 'Rate limiter unavailable. Request rejected to protect system integrity. Please retry shortly.';
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITER_OUTAGE_FAIL_CLOSED',
            message,
          },
          message,
          code: 'RATE_LIMITER_OUTAGE_FAIL_CLOSED',
          retryAfter: result.resetSeconds,
        },
        {
          status: 503,
          headers: {
            'Retry-After': result.resetSeconds.toString(),
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': result.resetSeconds.toString(),
          },
        }
      );
    }

    const message = `Too many requests. Please retry after ${result.resetSeconds} seconds.`;
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message,
        },
        message,
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
