import { NextRequest } from 'next/server';
import { MentorController } from '@/controllers/mentor.controller';

export async function GET(req: NextRequest) {
  return MentorController.getMentors(req);
}
