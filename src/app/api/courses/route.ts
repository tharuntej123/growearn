import { NextRequest } from 'next/server';
import { CourseController } from '@/controllers/course.controller';

export async function GET(req: NextRequest) {
  return CourseController.getCourses(req);
}

export async function POST(req: NextRequest) {
  return CourseController.createCourse(req);
}
