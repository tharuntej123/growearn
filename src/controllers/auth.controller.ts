import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services/auth.service';
import { roleSelectSchema } from '@/validators/auth.schema';
import { apiSuccess, apiError } from '@/lib/utils';
import {
  AUTH_COOKIE_NAME,
  OAUTH_STATE_COOKIE_NAME,
  LINKING_COOKIE_NAME,
  LEGACY_COOKIE_NAME,
  LEGACY_UFP_COOKIE_NAME,
  getCurrentUserFromRequest,
  getAuthCookieOptions,
  getAppBaseUrl,
} from '@/lib/auth';
import { enforceRateLimit } from '@/lib/rate-limiter';

// Helper to validate redirects and prevent Open Redirect attacks
function sanitizeRedirect(urlStr?: string | null): string | null {
  if (!urlStr) return null;
  // Only allow relative paths starting with a single '/'
  if (urlStr.startsWith('/') && !urlStr.startsWith('//') && !urlStr.includes('\\')) {
    return urlStr;
  }
  return null;
}

export class AuthController {
  /**
   * Initiates Google OAuth: generates PKCE, signs state, sets temporary state cookie,
   * and redirects user to Google's consent screen (or returns authUrl).
   */
  static async googleInit(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const role = searchParams.get('role') || undefined;
      const action = (searchParams.get('action') as 'signup' | 'login') || (role ? 'signup' : 'login');
      const rawRedirect = searchParams.get('redirect');
      const redirectUrl = sanitizeRedirect(rawRedirect) || undefined;

      const { authUrl, stateToken } = await AuthService.initiateGoogleAuth({
        role,
        action,
        redirectUrl,
      });

      // If client requests JSON
      if (req.headers.get('accept')?.includes('application/json')) {
        const response = apiSuccess({ authUrl });
        response.cookies.set(OAUTH_STATE_COOKIE_NAME, stateToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 600, // 10 minutes
          path: '/',
        });
        return response;
      }

      // Default: Direct 302 redirect to Google OAuth
      const response = NextResponse.redirect(authUrl);
      response.cookies.set(OAUTH_STATE_COOKIE_NAME, stateToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600, // 10 minutes
        path: '/',
      });
      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google OAuth initiation failed';
      if (req.headers.get('accept')?.includes('text/html')) {
        const appBaseUrl = getAppBaseUrl();
        return NextResponse.redirect(`${appBaseUrl}/login?error=${encodeURIComponent(message)}`);
      }
      return apiError(message, 'OAUTH_INIT_ERROR', 500);
    }
  }

  /**
   * Google OAuth Callback: receives auth code, verifies state,
   * performs token exchange & ID verification, creates session, and redirects to dashboard.
   */
  static async googleCallback(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const returnedState = searchParams.get('state');
    const googleError = searchParams.get('error');

    const appBaseUrl = getAppBaseUrl();

    // Check if user denied consent or Google returned an error
    if (googleError) {
      const errorMsg =
        googleError === 'access_denied'
          ? 'Sign in was cancelled. You must grant access to continue.'
          : `Google sign in failed: ${googleError}`;
      return NextResponse.redirect(`${appBaseUrl}/login?error=${encodeURIComponent(errorMsg)}`);
    }

    if (!code || !returnedState) {
      return NextResponse.redirect(`${appBaseUrl}/login?error=${encodeURIComponent('Missing authorization code or state from Google.')}`);
    }

    const stateCookie = req.cookies.get(OAUTH_STATE_COOKIE_NAME)?.value;

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
    const ua = req.headers.get('user-agent') || undefined;

    try {
      const result = await AuthService.handleGoogleCallback({
        code,
        returnedState,
        stateCookie,
        ipAddress: ip,
        userAgent: ua,
      });

      if (result.status === 'NEEDS_LINKING' && result.linkingToken) {
        // Redirect to secure account linking confirmation screen
        const linkingRedirect = new URL('/auth/link-account', appBaseUrl);
        const response = NextResponse.redirect(linkingRedirect);
        response.cookies.set(LINKING_COOKIE_NAME, result.linkingToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 900, // 15 minutes
          path: '/',
        });
        response.cookies.set(OAUTH_STATE_COOKIE_NAME, '', { path: '/', maxAge: 0 });
        return response;
      }

      if (result.status === 'SUCCESS' && result.session) {
        const destination = result.targetDashboard || '/learner/dashboard';
        const response = NextResponse.redirect(new URL(destination, appBaseUrl));

        // Establish secure session cookie
        response.cookies.set(AUTH_COOKIE_NAME, result.session.cookieValue, getAuthCookieOptions());

        // Clear temporary state and legacy cookies
        response.cookies.set(OAUTH_STATE_COOKIE_NAME, '', { path: '/', maxAge: 0 });
        response.cookies.set(LEGACY_COOKIE_NAME, '', { path: '/', maxAge: 0 });
        response.cookies.set(LEGACY_UFP_COOKIE_NAME, '', { path: '/', maxAge: 0 });

        return response;
      }

      return NextResponse.redirect(`${appBaseUrl}/login?error=${encodeURIComponent('Authentication completed without an active session.')}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Google authentication failed';
      return NextResponse.redirect(`${appBaseUrl}/login?error=${encodeURIComponent(message)}`);
    }
  }

  /**
   * Confirms linking Google account to an existing profile
   */
  static async confirmLink(req: NextRequest) {
    try {
      const body = await req.json().catch(() => ({}));
      const linkingToken = body.linkingToken || req.cookies.get(LINKING_COOKIE_NAME)?.value;

      if (!linkingToken) {
        return apiError('Account linking token missing or expired', 'LINKING_ERROR', 400);
      }

      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined;
      const ua = req.headers.get('user-agent') || undefined;

      const result = await AuthService.confirmAccountLink({
        linkingToken,
        ipAddress: ip,
        userAgent: ua,
      });

      if (result.status === 'SUCCESS' && result.session) {
        const response = apiSuccess(result);
        response.cookies.set(AUTH_COOKIE_NAME, result.session.cookieValue, getAuthCookieOptions());
        response.cookies.set(LINKING_COOKIE_NAME, '', { path: '/', maxAge: 0 });
        return response;
      }

      return apiError('Failed to link account', 'LINKING_ERROR', 400);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Account linking failed';
      return apiError(message, 'LINKING_ERROR', 400);
    }
  }

  /**
   * Current user profile from validated session
   */
  static async me(req: NextRequest) {
    const userPayload = await getCurrentUserFromRequest(req);
    if (!userPayload) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const user = await AuthService.getCurrentUser(userPayload.userId);
    if (!user) {
      return apiError('User not found', 'NOT_FOUND', 404);
    }

    return apiSuccess({ user });
  }

  /**
   * Role selection for authenticated users
   */
  static async roleSelect(req: NextRequest) {
    const userPayload = await getCurrentUserFromRequest(req);
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

      if (result.session) {
        response.cookies.set(AUTH_COOKIE_NAME, result.session.cookieValue, getAuthCookieOptions());
      }

      return response;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Role update failed';
      return apiError(message, 'ROLE_SELECT_ERROR', 400);
    }
  }

  /**
   * Logs out user, revoking server session and clearing cookies
   */
  static async logout(req: NextRequest) {
    const userPayload = await getCurrentUserFromRequest(req);
    if (userPayload?.sessionToken) {
      await AuthService.logout(userPayload.sessionToken);
    }

    const response = apiSuccess({ message: 'Logged out successfully' });
    const clearOpts = { path: '/', maxAge: 0 };
    response.cookies.set(AUTH_COOKIE_NAME, '', clearOpts);
    response.cookies.set(OAUTH_STATE_COOKIE_NAME, '', clearOpts);
    response.cookies.set(LINKING_COOKIE_NAME, '', clearOpts);
    response.cookies.set(LEGACY_COOKIE_NAME, '', clearOpts);
    response.cookies.set(LEGACY_UFP_COOKIE_NAME, '', clearOpts);

    return response;
  }

  /**
   * Retired endpoints
   */
  static async retiredPasswordEndpoint() {
    return apiError(
      'Password authentication has been retired on GroEarn. Please sign in or register exclusively using Google OAuth.',
      'AUTH_METHOD_RETIRED',
      410
    );
  }
}
