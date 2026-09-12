import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { CourseRepository } from '@/repositories/course.repository';
import { apiSuccess, apiError } from '@/lib/utils';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;
  const userPayload = getCurrentUserFromRequest(req);
  if (!userPayload) {
    return apiError('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return apiError('Course not found', 'NOT_FOUND', 404);
  }

  try {
    const enrollment = await CourseRepository.enrollStudent(userPayload.userId, courseId);

    if (course.price > 0) {
      await prisma.payment.create({
        data: {
          userId: userPayload.userId,
          amount: course.price,
          currency: 'USD',
          status: 'SUCCESS',
          provider: 'MOCK',
          transactionRef: `TXN-COURSE-${Date.now()}-${userPayload.userId.slice(-4)}`,
          itemType: 'COURSE',
          itemId: courseId,
        },
      });
    }

    await prisma.notification.create({
      data: {
        userId: userPayload.userId,
        title: 'Course Enrollment Confirmed',
        message: `You are successfully enrolled in "${course.title}". Start learning now!`,
        link: `/courses/${courseId}`,
        notificationType: 'COURSE_UPDATE',
      },
    });

    return apiSuccess({ enrollment }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Enrollment failed';
    return apiError(message, 'ENROLLMENT_ERROR', 400);
  }
}
