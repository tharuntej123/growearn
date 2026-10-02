import { NextRequest } from 'next/server';
import { CourseController } from '@/controllers/course.controller';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return CourseController.enroll(req, context);
}
