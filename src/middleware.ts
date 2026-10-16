import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

function getMiddlewareAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) {
    return new TextEncoder().encode('__UNCONFIGURED_AUTH_SECRET_FAIL_CLOSED_NO_SESSIONS_VALID__');
  }
  return new TextEncoder().encode(secret);
}

const AUTH_COOKIE_NAME = 'groearn_session';
const LEGACY_COOKIE_NAME = 'growearn_auth_token';
const LEGACY_UFP_COOKIE_NAME = 'ufp_auth_token';

type CanonicalRole = 'LEARNER' | 'FREELANCER' | 'MENTOR' | 'COMPANY' | 'ADMIN';

function getNormalizedRole(rawRole?: string): CanonicalRole | 'UNKNOWN' {
  if (!rawRole) return 'UNKNOWN';
  const role = rawRole.toUpperCase();
  if (role === 'LEARNER' || role === 'STUDENT') return 'LEARNER';
  if (role === 'COMPANY' || role === 'EMPLOYER') return 'COMPANY';
  if (role === 'MENTOR') return 'MENTOR';
  if (role === 'FREELANCER' || role === 'PROFESSIONAL') return 'FREELANCER';
  if (role === 'ADMIN') return 'ADMIN';
  return 'UNKNOWN';
}

function getDefaultDashboard(role: CanonicalRole | 'UNKNOWN'): string {
  switch (role) {
    case 'LEARNER':
      return '/learner/dashboard';
    case 'FREELANCER':
      return '/freelancer/dashboard';
    case 'MENTOR':
      return '/mentor/dashboard';
    case 'COMPANY':
      return '/company/dashboard';
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

  if (pathname.startsWith('/employer/')) {
    const canonicalPath = pathname.replace('/employer/', '/company/');
    return NextResponse.redirect(new URL(canonicalPath, req.url));
  }
  if (pathname === '/employer') {
    return NextResponse.redirect(new URL('/company/dashboard', req.url));
  }

  if (pathname.startsWith('/professional/')) {
    const canonicalPath = pathname.replace('/professional/', '/freelancer/');
    return NextResponse.redirect(new URL(canonicalPath, req.url));
  }
  if (pathname === '/professional') {
    return NextResponse.redirect(new URL('/freelancer/dashboard', req.url));
  }

  // Extract session token from modern HTTP-only session cookie
  const sessionToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  let userPayload: { userId: string; email: string; role: string; name: string } | null = null;

  if (sessionToken) {
    try {
      const { payload } = await jwtVerify(sessionToken, getMiddlewareAuthSecret(), { algorithms: ['HS256'] });
      userPayload = payload as unknown as { userId: string; email: string; role: string; name: string };
    } catch {
      userPayload = null;
    }
  }

  const normalizedRole = getNormalizedRole(userPayload?.role);
  const isAuthenticated = Boolean(userPayload);

  // Helper response that clears obsolete legacy tokens if present
  const cleanupObsoleteCookies = (res: NextResponse) => {
    if (req.cookies.has(LEGACY_COOKIE_NAME)) {
      res.cookies.set(LEGACY_COOKIE_NAME, '', { path: '/', maxAge: 0 });
    }
    if (req.cookies.has(LEGACY_UFP_COOKIE_NAME)) {
      res.cookies.set(LEGACY_UFP_COOKIE_NAME, '', { path: '/', maxAge: 0 });
    }
    return res;
  };

  // If already authenticated and visiting auth entry points (/login, /signup, /auth/role-select),
  // immediately route them to their database-authoritative role dashboard.
  if (isAuthenticated && (pathname === '/login' || pathname === '/signup' || pathname === '/auth/role-select')) {
    const properDashboard = getDefaultDashboard(normalizedRole);
    return cleanupObsoleteCookies(NextResponse.redirect(new URL(properDashboard, req.url)));
  }

  // Admin Area Protection (Admin ONLY)
  if (pathname.startsWith('/admin')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return cleanupObsoleteCookies(NextResponse.redirect(loginUrl));
    }
    if (normalizedRole !== 'ADMIN') {
      const properDashboard = getDefaultDashboard(normalizedRole);
      return cleanupObsoleteCookies(NextResponse.redirect(new URL(properDashboard, req.url)));
    }
  }

  // Learner Area Protection (Learner and Admin ONLY; other roles strictly blocked)
  if (pathname.startsWith('/learner')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return cleanupObsoleteCookies(NextResponse.redirect(loginUrl));
    }
    if (normalizedRole !== 'LEARNER' && normalizedRole !== 'ADMIN') {
      const properDashboard = getDefaultDashboard(normalizedRole);
      return cleanupObsoleteCookies(NextResponse.redirect(new URL(properDashboard, req.url)));
    }
  }

  // Company Area Protection (Company and Admin ONLY; other roles strictly blocked)
  if (pathname.startsWith('/company')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return cleanupObsoleteCookies(NextResponse.redirect(loginUrl));
    }
    if (normalizedRole !== 'COMPANY' && normalizedRole !== 'ADMIN') {
      const properDashboard = getDefaultDashboard(normalizedRole);
      return cleanupObsoleteCookies(NextResponse.redirect(new URL(properDashboard, req.url)));
    }
  }

  // Mentor Area Protection (Mentor and Admin ONLY; other roles strictly blocked)
  if (pathname.startsWith('/mentor') && !pathname.startsWith('/mentors')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return cleanupObsoleteCookies(NextResponse.redirect(loginUrl));
    }
    if (normalizedRole !== 'MENTOR' && normalizedRole !== 'ADMIN') {
      const properDashboard = getDefaultDashboard(normalizedRole);
      return cleanupObsoleteCookies(NextResponse.redirect(new URL(properDashboard, req.url)));
    }
  }

  // Freelancer Area Protection (Freelancer and Admin ONLY; other roles strictly blocked)
  if (pathname.startsWith('/freelancer')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return cleanupObsoleteCookies(NextResponse.redirect(loginUrl));
    }
    if (normalizedRole !== 'FREELANCER' && normalizedRole !== 'ADMIN') {
      const properDashboard = getDefaultDashboard(normalizedRole);
      return cleanupObsoleteCookies(NextResponse.redirect(new URL(properDashboard, req.url)));
    }
  }

  // Onboarding Protection (Learner only; other roles directed to their dashboards)
  if (pathname.startsWith('/onboarding')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return cleanupObsoleteCookies(NextResponse.redirect(loginUrl));
    }
    if (normalizedRole !== 'LEARNER' && normalizedRole !== 'ADMIN') {
      const properDashboard = getDefaultDashboard(normalizedRole);
      return cleanupObsoleteCookies(NextResponse.redirect(new URL(properDashboard, req.url)));
    }
  }

  const response = NextResponse.next();
  return cleanupObsoleteCookies(response);
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
    '/login',
    '/signup',
    '/auth/role-select',
  ],
};
