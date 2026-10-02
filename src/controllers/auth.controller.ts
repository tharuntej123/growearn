import { NextRequest } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { registerSchema, loginSchema, roleSelectSchema } from '@/validators/auth.schema';
import { apiSuccess, apiError } from '@/lib/utils';
import { AUTH_COOKIE_NAME, getCurrentUserFromRequest, getAuthCookieOptions } from '@/lib/auth';
import { enforceRateLimit } from '@/lib/rate-limiter';

export class AuthController {
  static async register(req: NextRequest) {
    // Enforce 5 registrations per 10 minutes per IP
    const rateLimitResponse = await enforceRateLimit(req, 'auth:register', 5, 600);
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const body = await req.json();
      const validated = registerSchema.safeParse(body);
      if (!validated.success) {
        return apiError(
          validated.error.errors[0]?.message || 'Validation failed',
          'VALIDATION_ERROR',
          400,
          validated.error.format()
        );
      }

      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
      const ua = req.headers.get('user-agent') || undefined;

      const result = await AuthService.register(validated.data, ip, ua);
      const response = apiSuccess(result, 201);

      response.cookies.set(AUTH_COOKIE_NAME, result.token, getAuthCookieOptions());

      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      return apiError(message, 'REGISTRATION_ERROR', 400);
    }
  }

  static async login(req: NextRequest) {
    // Enforce 10 login attempts per 1 minute per IP
    const rateLimitResponse = await enforceRateLimit(req, 'auth:login', 10, 60);
    if (rateLimitResponse) return rateLimitResponse;

    try {
      const body = await req.json();
      const validated = loginSchema.safeParse(body);
      if (!validated.success) {
        return apiError(
          validated.error.errors[0]?.message || 'Validation failed',
          'VALIDATION_ERROR',
          400
        );
      }

      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
      const ua = req.headers.get('user-agent') || undefined;

      const result = await AuthService.login(validated.data, ip, ua);
      const response = apiSuccess(result, 200);

      response.cookies.set(AUTH_COOKIE_NAME, result.token, getAuthCookieOptions());

      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid credentials';
      return apiError(message, 'AUTH_ERROR', 401);
    }
  }

  static async logout() {
    const response = apiSuccess({ message: 'Logged out successfully' });
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  static async me(req: NextRequest) {
    const userPayload = getCurrentUserFromRequest(req);
    if (!userPayload) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const user = await AuthService.getCurrentUser(userPayload.userId);
    if (!user) {
      return apiError('User not found', 'NOT_FOUND', 404);
    }

    return apiSuccess({ user });
  }

  static async roleSelect(req: NextRequest) {
    const userPayload = getCurrentUserFromRequest(req);
    if (!userPayload) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401);
    }

    try {
      const body = await req.json();
      const validated = roleSelectSchema.safeParse(body);
      if (!validated.success) {
        return apiError(validated.error.errors[0]?.message || 'Invalid role', 'VALIDATION_ERROR', 400);
      }

      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
      const ua = req.headers.get('user-agent') || undefined;

      const result = await AuthService.selectRole(userPayload.userId, validated.data.role, ip, ua);
      const response = apiSuccess(result);

      response.cookies.set(AUTH_COOKIE_NAME, result.token, getAuthCookieOptions());

      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Role update failed';
      return apiError(message, 'ROLE_SELECT_ERROR', 400);
    }
  }
}
