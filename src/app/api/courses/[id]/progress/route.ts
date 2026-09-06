import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { CourseRepository } from '@/repositories/course.repository';
import { apiSuccess, apiError } from '@/lib/utils';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const progressSchema = z.object({
  lessonId: z.string().min(1),
  isCompleted: z.boolean(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: courseId } = await params;
  const userPayload = getCurrentUserFromRequest(req);
  if (!userPayload) {
    return apiError('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: userPayload.userId,
        courseId,
      },
    },
  });

  if (!enrollment) {
    return apiError('Not enrolled in this course', 'FORBIDDEN', 403);
  }

  try {
    const body = await req.json();
    const validated = progressSchema.safeParse(body);
    if (!validated.success) {
      return apiError('Invalid progress payload', 'VALIDATION_ERROR', 400);
    }

    const progress = await CourseRepository.updateLessonProgress(
      enrollment.id,
      validated.data.lessonId,
      validated.data.isCompleted
    );

    const updatedEnrollment = await prisma.enrollment.findUnique({
      where: { id: enrollment.id },
      include: { lessonProgress: true },
    });

    return apiSuccess({ progress, enrollment: updatedEnrollment });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update progress';
    return apiError(message, 'PROGRESS_ERROR', 400);
  }
}
