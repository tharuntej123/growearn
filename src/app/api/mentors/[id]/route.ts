import { NextRequest } from 'next/server';
import { MentorController } from '@/controllers/mentor.controller';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return MentorController.getMentorDetail(req, context);
}
