import { NextResponse } from 'next/server';
import { env } from '@/lib/env';

export async function POST() {
  if (env.APP_ENV === 'production' || process.env.APP_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }

  if (env.APP_ENV !== 'demo') {
    return NextResponse.json({ error: 'Demo mode is disabled' }, { status: 404 });
  }

  return NextResponse.json({ error: 'Demo session endpoint disabled' }, { status: 404 });
}

export async function GET() {
  if (env.APP_ENV === 'production' || process.env.APP_ENV === 'production') {
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  }
  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
