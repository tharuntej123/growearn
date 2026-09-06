import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { registerSchema, loginSchema, roleSelectSchema } from '@/validators/auth.schema';
import { apiSuccess, apiError } from '@/lib/utils';
import { AUTH_COOKIE_NAME, getCurrentUserFromRequest } from '@/lib/auth';

export class AuthController {
  static async register(req: NextRequest) {
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

      const result = await AuthService.register(validated.data);
      const response = apiSuccess(result, 201);
      
      // Set secure auth cookie
      response.cookies.set(AUTH_COOKIE_NAME, result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      return apiError(message, 'REGISTRATION_ERROR', 400);
    }
  }

  static async login(req: NextRequest) {
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

      const result = await AuthService.login(validated.data);
      const response = apiSuccess(result, 200);

      // Set cookie
      response.cookies.set(AUTH_COOKIE_NAME, result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

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

      const result = await AuthService.selectRole(userPayload.userId, validated.data.role);
      const response = apiSuccess(result);

      response.cookies.set(AUTH_COOKIE_NAME, result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Role update failed';
      return apiError(message, 'ROLE_SELECT_ERROR', 400);
    }
  }
}
