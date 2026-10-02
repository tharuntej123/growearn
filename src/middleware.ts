import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'growearn-super-secret-jwt-key-2026-production-grade'
);

const AUTH_COOKIE_NAME = 'growearn_auth_token';
const LEGACY_COOKIE_NAME = 'ufp_auth_token';

type CanonicalRole = 'LEARNER' | 'PROFESSIONAL' | 'MENTOR' | 'EMPLOYER' | 'ADMIN';

function getNormalizedRole(rawRole?: string): CanonicalRole | 'UNKNOWN' {
  if (!rawRole) return 'UNKNOWN';
  const role = rawRole.toUpperCase();
  if (role === 'LEARNER' || role === 'STUDENT') return 'LEARNER';
  if (role === 'EMPLOYER' || role === 'COMPANY') return 'EMPLOYER';
  if (role === 'MENTOR') return 'MENTOR';
  if (role === 'PROFESSIONAL' || role === 'FREELANCER') return 'PROFESSIONAL';
  if (role === 'ADMIN') return 'ADMIN';
  return 'UNKNOWN';
}

function getDefaultDashboard(role: CanonicalRole | 'UNKNOWN'): string {
  switch (role) {
    case 'LEARNER':
      return '/learner/dashboard';
    case 'PROFESSIONAL':
      return '/professional/dashboard';
    case 'MENTOR':
      return '/mentor/dashboard';
    case 'EMPLOYER':
      return '/employer/dashboard';
    case 'ADMIN':
      return '/admin/dashboard';
    default:
      return '/login';
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/uploads') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Backwards compatibility 307 redirects from legacy paths to canonical paths
  if (pathname.startsWith('/student/')) {
    const canonicalPath = pathname.replace('/student/', '/learner/');
    return NextResponse.redirect(new URL(canonicalPath, req.url));
  }
  if (pathname === '/student') {
    return NextResponse.redirect(new URL('/learner/dashboard', req.url));
  }

  if (pathname.startsWith('/company/')) {
    const canonicalPath = pathname.replace('/company/', '/employer/');
    return NextResponse.redirect(new URL(canonicalPath, req.url));
  }
  if (pathname === '/company') {
    return NextResponse.redirect(new URL('/employer/dashboard', req.url));
  }

  if (pathname.startsWith('/freelancer/')) {
    const canonicalPath = pathname.replace('/freelancer/', '/professional/');
    return NextResponse.redirect(new URL(canonicalPath, req.url));
  }
  if (pathname === '/freelancer') {
    return NextResponse.redirect(new URL('/professional/dashboard', req.url));
  }

  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value || req.cookies.get(LEGACY_COOKIE_NAME)?.value;
  let userPayload: { userId: string; email: string; role: string; name: string } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      userPayload = payload as unknown as { userId: string; email: string; role: string; name: string };
    } catch {
      userPayload = null;
    }
  }

  const normalizedRole = getNormalizedRole(userPayload?.role);
  const isAuthenticated = Boolean(userPayload);

  // Admin Area Protection (Admin ONLY)
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (normalizedRole !== 'ADMIN') {
      const properDashboard = getDefaultDashboard(normalizedRole);
      return NextResponse.redirect(new URL(properDashboard, req.url));
    }
  }

  // Learner Area Protection
  if (pathname.startsWith('/learner')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (normalizedRole !== 'LEARNER' && normalizedRole !== 'ADMIN') {
      const properDashboard = getDefaultDashboard(normalizedRole);
      return NextResponse.redirect(new URL(properDashboard, req.url));
    }
  }

  // Employer Area Protection
  if (pathname.startsWith('/employer')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (normalizedRole !== 'EMPLOYER' && normalizedRole !== 'ADMIN') {
      const properDashboard = getDefaultDashboard(normalizedRole);
      return NextResponse.redirect(new URL(properDashboard, req.url));
    }
  }

  // Mentor Area Protection
  if (pathname.startsWith('/mentor') && !pathname.startsWith('/mentors')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (normalizedRole !== 'MENTOR' && normalizedRole !== 'ADMIN') {
      const properDashboard = getDefaultDashboard(normalizedRole);
      return NextResponse.redirect(new URL(properDashboard, req.url));
    }
  }

  // Professional Area Protection
  if (pathname.startsWith('/professional')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (normalizedRole !== 'PROFESSIONAL' && normalizedRole !== 'ADMIN') {
      const properDashboard = getDefaultDashboard(normalizedRole);
      return NextResponse.redirect(new URL(properDashboard, req.url));
    }
  }

  // Onboarding Protection
  if (pathname.startsWith('/onboarding')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/learner/:path*',
    '/student/:path*',
    '/employer/:path*',
    '/company/:path*',
    '/mentor/:path*',
    '/professional/:path*',
    '/freelancer/:path*',
    '/onboarding/:path*',
  ],
};
