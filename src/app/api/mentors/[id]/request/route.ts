import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { MentorRepository } from '@/repositories/mentor.repository';
import { mentorshipRequestSchema } from '@/validators/course.schema';
import { apiSuccess, apiError } from '@/lib/utils';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mentorProfileId } = await params;
  const userPayload = getCurrentUserFromRequest(req);
  if (!userPayload) {
    return apiError('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const mentor = await prisma.mentorProfile.findUnique({
    where: { id: mentorProfileId },
    include: { user: true },
  });
  if (!mentor) {
    return apiError('Mentor profile not found', 'NOT_FOUND', 404);
  }

  try {
    const body = await req.json();
    const validated = mentorshipRequestSchema.safeParse(body);
    if (!validated.success) {
      return apiError('Invalid request data', 'VALIDATION_ERROR', 400);
    }

    const request = await MentorRepository.createRequest(
      userPayload.userId,
      mentorProfileId,
      validated.data
    );

    await prisma.notification.create({
      data: {
        userId: mentor.userId,
        title: 'New Mentorship Request Received',
        message: `${userPayload.name} requested a 1-on-1 session regarding "${validated.data.topic}".`,
        link: '/mentor/dashboard',
        notificationType: 'MENTORSHIP_REQUEST',
      },
    });

    return apiSuccess({ request }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to request mentorship';
    return apiError(message, 'MENTOR_REQUEST_ERROR', 400);
  }
}
