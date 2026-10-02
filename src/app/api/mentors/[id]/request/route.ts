import { NextRequest } from 'next/server';
import { MentorController } from '@/controllers/mentor.controller';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return MentorController.requestMentorship(req, context);
}
