import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import prisma from '@/lib/prisma';

// Ensure environment variables from .env / .env.local are loaded if not yet set in process.env
if (!process.env.AUTH_SECRET && !process.env.JWT_SECRET && typeof window === 'undefined') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const dotenv = require('dotenv');
    dotenv.config();
    dotenv.config({ path: '.env.local' });
  } catch {}
}

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error('FATAL SECURITY ERROR: AUTH_SECRET environment variable is missing. Authentication cannot operate without a secure secret.');
  }
  if (secret.length < 32) {
    throw new Error('INSECURE CONFIGURATION ERROR: AUTH_SECRET must be at least 32 characters long to ensure cryptographic session security.');
  }
  return secret;
}

export function getAuthSecretKey(): Uint8Array {
  return new TextEncoder().encode(getAuthSecret());
}

export const AUTH_COOKIE_NAME = 'groearn_session';
export const OAUTH_STATE_COOKIE_NAME = 'groearn_oauth_state';
export const LINKING_COOKIE_NAME = 'groearn_account_linking';
export const LEGACY_COOKIE_NAME = 'growearn_auth_token';
export const LEGACY_UFP_COOKIE_NAME = 'ufp_auth_token';

export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface SessionPayload {
  sessionId: string;
  sessionToken: string;
  userId: string;
  email: string;
  role: CanonicalRole;
  name: string;
  avatarUrl?: string | null;
}

// Backward-compatible type alias for existing codebase call sites
export type JWTPayload = SessionPayload;

export type CanonicalRole = 'LEARNER' | 'FREELANCER' | 'MENTOR' | 'COMPANY' | 'ADMIN';

export function normalizeRole(rawRole?: string): CanonicalRole {
  if (!rawRole) return 'LEARNER';
  const r = rawRole.toUpperCase().trim();
  if (r === 'STUDENT' || r === 'LEARNER') return 'LEARNER';
  if (r === 'FREELANCER' || r === 'PROFESSIONAL') return 'FREELANCER';
  if (r === 'MENTOR') return 'MENTOR';
  if (r === 'COMPANY' || r === 'EMPLOYER') return 'COMPANY';
  if (r === 'ADMIN') return 'ADMIN';
  throw new Error(`Invalid role '${rawRole}': Must be one of LEARNER, FREELANCER, MENTOR, COMPANY, ADMIN`);
}

export function isValidRole(role: string): boolean {
  try {
    normalizeRole(role);
    return true;
  } catch {
    return false;
  }
}

export function isRoleAllowed(userRole: string | undefined, allowedRoles: string[]): boolean {
  if (!userRole) return false;
  let normalizedUserRole: CanonicalRole;
  try {
    normalizedUserRole = normalizeRole(userRole);
  } catch {
    return false;
  }
  if (normalizedUserRole === 'ADMIN') return true; // ADMIN has superuser access
  return allowedRoles.some((r) => {
    try {
      return normalizeRole(r) === normalizedUserRole;
    } catch {
      return false;
    }
  });
}

export function getAppBaseUrl(): string {
  if (process.env.AUTH_URL && !process.env.AUTH_URL.includes('localhost')) {
    return process.env.AUTH_URL.replace(/\/$/, '');
  }
  if (process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes('localhost')) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, '');
  }
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes('localhost')) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (process.env.GOOGLE_REDIRECT_URI) {
    try {
      const u = new URL(process.env.GOOGLE_REDIRECT_URI);
      return u.origin;
    } catch {}
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, '');
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`.replace(/\/$/, '');
  }
  const fallback = process.env.AUTH_URL || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return fallback.replace(/\/$/, '');
}

export function getGoogleOAuthClient(redirectUri?: string): OAuth2Client {
  const clientId = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  const defaultRedirect =
    process.env.GOOGLE_REDIRECT_URI?.trim() ||
    process.env.GOOGLE_CALLBACK_URL?.trim() ||
    `${getAppBaseUrl()}/api/auth/callback/google`;

  return new OAuth2Client({
    clientId: clientId || 'unconfigured_google_client_id',
    clientSecret: clientSecret || 'unconfigured_google_client_secret',
    redirectUri: redirectUri || defaultRedirect,
  });
}

export function isGoogleOAuthConfigured(): boolean {
  const id = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const sec = (process.env.GOOGLE_CLIENT_SECRET || '').trim();
  return Boolean(
    id.length > 0 &&
    !id.includes('your-google-client-id') &&
    !id.includes('mock-google-client-id') &&
    sec.length > 0 &&
    !sec.includes('your-google-client-secret') &&
    !sec.includes('mock-google-client-secret')
  );
}

// Generates cryptographically secure OAuth 2.0 PKCE code verifier and challenge
export function generatePKCE() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  return { codeVerifier, codeChallenge };
}

// Signs OAuth state containing role and action to guarantee server integrity across redirect
export async function createSignedOAuthState(params: {
  role?: string;
  action: 'signup' | 'login';
  redirectUrl?: string;
  oauthRedirectUri?: string;
}): Promise<{ stateToken: string; randomState: string; codeVerifier: string; codeChallenge: string }> {
  const randomState = crypto.randomBytes(24).toString('hex');
  const { codeVerifier, codeChallenge } = generatePKCE();

  const secretKey = getAuthSecretKey();
  const stateToken = await new SignJWT({
    state: randomState,
    role: params.role ? normalizeRole(params.role) : undefined,
    action: params.action,
    redirectUrl: params.redirectUrl || undefined,
    codeVerifier,
    oauthRedirectUri: params.oauthRedirectUri || undefined,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m') // State expires in 10 minutes
    .sign(secretKey);

  return { stateToken, randomState, codeVerifier, codeChallenge };
}

// Verifies OAuth state returned from Google callback against signed server state
export async function verifySignedOAuthState(
  stateToken: string,
  returnedState: string
): Promise<{
  valid: boolean;
  role?: CanonicalRole;
  action: 'signup' | 'login';
  redirectUrl?: string;
  codeVerifier?: string;
  oauthRedirectUri?: string;
  error?: string;
}> {
  try {
    const secretKey = getAuthSecretKey();
    const { payload } = await jwtVerify(stateToken, secretKey, { algorithms: ['HS256'] });

    // Validate state:
    // If stateToken was passed as state to Google, returnedState matches stateToken.
    // If randomState was passed or extracted, payload.state matches returnedState.
    const isStateMatch =
      payload &&
      (payload.state === returnedState ||
        stateToken === returnedState ||
        (typeof payload.state === 'string' && returnedState.includes(payload.state)));

    if (!isStateMatch) {
      return { valid: false, action: 'login', error: 'OAuth state mismatch: possible CSRF or tampered state parameter' };
    }

    const action = payload.action === 'signup' ? 'signup' : 'login';
    let role: CanonicalRole | undefined = undefined;
    if (payload.role && typeof payload.role === 'string') {
      try {
        role = normalizeRole(payload.role);
      } catch {
        role = undefined;
      }
    }

    return {
      valid: true,
      action,
      role,
      redirectUrl: typeof payload.redirectUrl === 'string' ? payload.redirectUrl : undefined,
      codeVerifier: typeof payload.codeVerifier === 'string' ? payload.codeVerifier : undefined,
      oauthRedirectUri: typeof payload.oauthRedirectUri === 'string' ? payload.oauthRedirectUri : undefined,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid state token';
    return { valid: false, action: 'login', error: `OAuth state validation failed: ${msg}` };
  }
}

// Creates a database-backed session and returns signed session cookie value
export async function createDatabaseSession(user: {
  id: string;
  email: string;
  role: string;
  name: string;
  avatarUrl?: string | null;
}): Promise<{ sessionToken: string; cookieValue: string }> {
  const canonicalRole = normalizeRole(user.role);
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  const dbSession = await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expiresAt,
    },
  });

  const secretKey = getAuthSecretKey();
  const cookieValue = await new SignJWT({
    sessionId: dbSession.id,
    sessionToken,
    userId: user.id,
    email: user.email,
    role: canonicalRole,
    name: user.name,
    avatarUrl: user.avatarUrl || null,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey);

  return { sessionToken, cookieValue };
}

// Verifies a signed session cookie and checks active DB session status
export async function verifySessionCookie(cookieValue: string): Promise<SessionPayload | null> {
  try {
    const secretKey = getAuthSecretKey();
    const { payload } = await jwtVerify(cookieValue, secretKey, { algorithms: ['HS256'] });

    if (!payload || !payload.userId || !payload.sessionToken) {
      return null;
    }

    // Verify session existence in database (enforces revocation and expiry)
    const dbSession = await prisma.session.findUnique({
      where: { sessionToken: payload.sessionToken as string },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!dbSession || dbSession.expiresAt < new Date()) {
      return null;
    }

    return {
      sessionId: dbSession.id,
      sessionToken: dbSession.sessionToken,
      userId: dbSession.user.id,
      email: dbSession.user.email,
      role: normalizeRole(dbSession.user.role),
      name: dbSession.user.name,
      avatarUrl: dbSession.user.avatarUrl,
    };
  } catch {
    return null;
  }
}

// Fast edge / middleware verification without database roundtrip
export async function verifySessionCookieFast(cookieValue: string): Promise<SessionPayload | null> {
  try {
    const secretKey = getAuthSecretKey();
    const { payload } = await jwtVerify(cookieValue, secretKey, { algorithms: ['HS256'] });

    if (!payload || !payload.userId || !payload.role) {
      return null;
    }

    return {
      sessionId: (payload.sessionId as string) || '',
      sessionToken: (payload.sessionToken as string) || '',
      userId: payload.userId as string,
      email: payload.email as string,
      role: normalizeRole(payload.role as string),
      name: (payload.name as string) || '',
      avatarUrl: (payload.avatarUrl as string) || null,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUserFromCookies(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifySessionCookie(token);
  } catch {
    return null;
  }
}

export async function getCurrentUserFromRequest(req: NextRequest): Promise<SessionPayload | null> {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionCookie(token);
}

export async function getCurrentUser(req?: NextRequest): Promise<(SessionPayload & { id: string }) | null> {
  let payload: SessionPayload | null = null;
  if (req) {
    payload = await getCurrentUserFromRequest(req);
  }
  if (!payload) {
    payload = await getCurrentUserFromCookies();
  }
  if (!payload) return null;
  return {
    ...payload,
    id: payload.userId,
  };
}

export async function revokeSession(sessionToken: string): Promise<void> {
  try {
    await prisma.session.deleteMany({
      where: { sessionToken },
    });
  } catch {}
}

export function getAuthCookieOptions() {
  const isHttps = process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') || Boolean(process.env.VERCEL_URL?.startsWith('https://'));
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd || Boolean(isHttps),
    sameSite: 'lax' as const,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/',
  };
}
