import { NextRequest } from 'next/server';
import { CourseController } from '@/controllers/course.controller';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return CourseController.getCourseDetail(req, context);
}
