import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing. Authentication cannot operate without a secure secret.');
  }
  if (secret.length < 32) {
    throw new Error('INSECURE CONFIGURATION ERROR: JWT_SECRET must be at least 32 characters long to ensure cryptographic token security.');
  }
  return secret;
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export const AUTH_COOKIE_NAME = 'growearn_auth_token';
const LEGACY_COOKIE_NAME = 'ufp_auth_token';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signJwtToken(payload: JWTPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

export function verifyJwtToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JWTPayload;
  } catch {
    return null;
  }
}

export function normalizeRole(rawRole?: string): 'LEARNER' | 'FREELANCER' | 'MENTOR' | 'COMPANY' | 'ADMIN' {
  if (!rawRole) return 'LEARNER';
  const r = rawRole.toUpperCase();
  if (r === 'STUDENT' || r === 'LEARNER') return 'LEARNER';
  if (r === 'FREELANCER' || r === 'PROFESSIONAL') return 'FREELANCER';
  if (r === 'MENTOR') return 'MENTOR';
  if (r === 'COMPANY' || r === 'EMPLOYER') return 'COMPANY';
  if (r === 'ADMIN') return 'ADMIN';
  return 'LEARNER';
}

export function isRoleAllowed(userRole: string | undefined, allowedRoles: string[]): boolean {
  if (!userRole) return false;
  const normalizedUserRole = normalizeRole(userRole);
  if (normalizedUserRole === 'ADMIN') return true; // ADMIN has superuser access
  return allowedRoles.map((r) => normalizeRole(r)).includes(normalizedUserRole);
}

export async function getCurrentUserFromCookies(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value || cookieStore.get(LEGACY_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyJwtToken(token);
  } catch {
    return null;
  }
}

export function getCurrentUserFromRequest(req: NextRequest): JWTPayload | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyJwtToken(token);
    if (payload) return payload;
  }

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value || req.cookies.get(LEGACY_COOKIE_NAME)?.value;
  if (token) {
    return verifyJwtToken(token);
  }

  return null;
}

export async function getCurrentUser(req?: NextRequest): Promise<(JWTPayload & { id: string }) | null> {
  let payload: JWTPayload | null = null;
  if (req) {
    payload = getCurrentUserFromRequest(req);
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

export function getAuthCookieOptions() {
  const isHttps = process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') || Boolean(process.env.VERCEL_URL?.startsWith('https://'));
  return {
    httpOnly: true,
    secure: Boolean(isHttps),
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  };
}
