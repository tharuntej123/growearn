import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL('/api/auth/callback/google', req.url);
  url.search = req.nextUrl.search;
  return NextResponse.redirect(url, 308);
}

export async function POST(req: NextRequest) {
  const url = new URL('/api/auth/callback/google', req.url);
  url.search = req.nextUrl.search;
  return NextResponse.redirect(url, 308);
}
