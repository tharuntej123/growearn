import { NextRequest } from 'next/server';
import { MentorRepository } from '@/repositories/mentor.repository';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const mentor = await MentorRepository.getMentorById(id);
  if (!mentor) {
    return apiError('Mentor profile not found', 'NOT_FOUND', 404);
  }

  return apiSuccess({ mentor });
}
