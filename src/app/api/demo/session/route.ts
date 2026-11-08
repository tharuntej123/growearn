import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createDatabaseSession, CanonicalRole, AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  // Strictly disabled in production
  if (process.env.APP_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const role = (body.role || 'LEARNER').toUpperCase();

    // Find demo user for role
    const demoUser = await prisma.user.findFirst({
      where: { role: role as CanonicalRole },
    });

    if (!demoUser) {
      return NextResponse.json({ error: `No user found for role ${role}` }, { status: 404 });
    }

    const sessionResult = await createDatabaseSession({
      id: demoUser.id,
      email: demoUser.email,
      name: demoUser.name,
      role: demoUser.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: demoUser.id,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, sessionResult.cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day
    });

    return response;
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  if (process.env.APP_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }
  return NextResponse.json({ demoEnabled: true, env: process.env.APP_ENV || 'development' });
}
