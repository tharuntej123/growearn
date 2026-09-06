import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'ufp-super-secret-jwt-key-2026-production-grade';
const JWT_EXPIRES_IN = '7d';
export const AUTH_COOKIE_NAME = 'ufp_auth_token';

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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJwtToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUserFromCookies(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyJwtToken(token);
  } catch {
    return null;
  }
}

export function getCurrentUserFromRequest(req: NextRequest): JWTPayload | null {
  // Check Authorization Bearer header first
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const payload = verifyJwtToken(token);
    if (payload) return payload;
  }

  // Then check cookies
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
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


