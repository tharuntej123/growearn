import { NextRequest } from 'next/server';
import { MentorController } from '@/controllers/mentor.controller';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return MentorController.updateRequestStatus(req, context);
}
