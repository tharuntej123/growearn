import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is required in production.');
    }
    return 'growearn-super-secret-jwt-key-2026-production-grade';
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

export function normalizeRole(rawRole?: string): 'LEARNER' | 'PROFESSIONAL' | 'MENTOR' | 'EMPLOYER' | 'ADMIN' {
  if (!rawRole) return 'LEARNER';
  const r = rawRole.toUpperCase();
  if (r === 'STUDENT' || r === 'LEARNER') return 'LEARNER';
  if (r === 'FREELANCER' || r === 'PROFESSIONAL') return 'PROFESSIONAL';
  if (r === 'MENTOR') return 'MENTOR';
  if (r === 'COMPANY' || r === 'EMPLOYER') return 'EMPLOYER';
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
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  };
}
