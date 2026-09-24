import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'ufp-super-secret-jwt-key-2026-production-grade'
);

const AUTH_COOKIE_NAME = 'ufp_auth_token';

// Normalize user roles into canonical categories
function getNormalizedRole(rawRole?: string): 'STUDENT' | 'COMPANY' | 'MENTOR' | 'PROFESSIONAL' | 'ADMIN' | 'UNKNOWN' {
  if (!rawRole) return 'UNKNOWN';
  const role = rawRole.toUpperCase();
  if (role === 'LEARNER' || role === 'STUDENT') return 'STUDENT';
  if (role === 'EMPLOYER' || role === 'COMPANY') return 'COMPANY';
  if (role === 'MENTOR') return 'MENTOR';
  if (role === 'PROFESSIONAL' || role === 'FREELANCER') return 'PROFESSIONAL';
  if (role === 'ADMIN') return 'ADMIN';
  return 'UNKNOWN';
}

function getDefaultDashboard(normalizedRole: string): string {
  switch (normalizedRole) {
    case 'STUDENT':
      return '/student/dashboard';
    case 'COMPANY':
      return '/company/dashboard';
    case 'MENTOR':
      return '/mentor/dashboard';
    case 'PROFESSIONAL':
      return '/professional/dashboard';
    case 'ADMIN':
      return '/student/dashboard';
    default:
      return '/feed';
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Ignore static assets, next internal files, and api routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Retrieve token from cookies
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
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

  // 1. Student / Learner Route Protection: /student/*
  if (pathname.startsWith('/student')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (normalizedRole !== 'STUDENT' && normalizedRole !== 'ADMIN') {
      const properDashboard = getDefaultDashboard(normalizedRole);
      return NextResponse.redirect(new URL(properDashboard, req.url));
    }
  }

  // 2. Company / Employer Route Protection: /company/* or /employer/*
  if (pathname.startsWith('/company') || pathname.startsWith('/employer')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (normalizedRole !== 'COMPANY' && normalizedRole !== 'ADMIN') {
      const properDashboard = getDefaultDashboard(normalizedRole);
      return NextResponse.redirect(new URL(properDashboard, req.url));
    }
  }

  // 3. Mentor Route Protection: /mentor/* (Note: /mentors is the public directory)
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

  // 4. Professional / Freelancer Route Protection: /professional/* or /freelancer/*
  if (pathname.startsWith('/professional') || pathname.startsWith('/freelancer')) {
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

  // 5. Onboarding Protection
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
    '/student/:path*',
    '/company/:path*',
    '/employer/:path*',
    '/mentor/:path*',
    '/professional/:path*',
    '/freelancer/:path*',
    '/onboarding/:path*',
  ],
};
