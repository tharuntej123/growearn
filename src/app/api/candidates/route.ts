import { NextRequest } from 'next/server';
import { UserRepository } from '@/repositories/user.repository';
import { apiSuccess } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get('search') || undefined;
  const skill = searchParams.get('skill') || undefined;
  const location = searchParams.get('location') || undefined;

  const candidates = await UserRepository.getAllCandidates({
    search,
    skill,
    location,
  });

  return apiSuccess({ candidates });
}
