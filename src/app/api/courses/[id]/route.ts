import { NextRequest } from 'next/server';
import { CourseRepository } from '@/repositories/course.repository';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const course = await CourseRepository.getCourseById(id);
  if (!course) {
    return apiError('Course not found', 'NOT_FOUND', 404);
  }

  const userPayload = getCurrentUserFromRequest(req);
  let enrollment = null;
  if (userPayload) {
    enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId: userPayload.userId,
          courseId: course.id,
        },
      },
      include: {
        lessonProgress: true,
      },
    });
  }

  return apiSuccess({ course, enrollment });
}
