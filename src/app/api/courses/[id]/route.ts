import { NextRequest } from 'next/server';
import { CourseController } from '@/controllers/course.controller';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return CourseController.getCourseDetail(req, context);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return CourseController.updateCourse(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return CourseController.deleteCourse(req, context);
}
