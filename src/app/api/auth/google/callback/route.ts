import { NextRequest } from 'next/server';
import { AuthController } from '@/controllers/auth.controller';

export async function GET(req: NextRequest) {
  return AuthController.googleCallback(req);
}

export async function POST(req: NextRequest) {
  return AuthController.googleCallback(req);
}
