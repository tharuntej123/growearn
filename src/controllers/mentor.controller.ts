import { NextRequest } from 'next/server';
import { getCurrentUser, isRoleAllowed } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { MentorRepository } from '@/repositories/mentor.repository';
import { MessagingRepository } from '@/repositories/messaging.repository';
import { enforceRateLimit } from '@/lib/rate-limiter';
import { z } from 'zod';

const requestMentorshipSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  preferredTime: z.string().optional(),
});

export class MentorController {
  static async getMentors(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || searchParams.get('query') || undefined;
      const skill = searchParams.get('skill') || undefined;
      const maxRate = searchParams.get('maxRate') ? parseFloat(searchParams.get('maxRate')!) : undefined;
      const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined;
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const offset = parseInt(searchParams.get('offset') || '0', 10);
      const excludeIdsParam = searchParams.get('excludeIds');
      const excludeIds = excludeIdsParam ? excludeIdsParam.split(',').filter(Boolean) : [];

      const where: any = { isAvailable: true };
      if (excludeIds.length > 0) {
        where.id = { notIn: excludeIds };
      }
      if (search) {
        where.OR = [
          { bio: { contains: search, mode: 'insensitive' } },
          { expertise: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { headline: { contains: search, mode: 'insensitive' } } },
        ];
      }
      if (skill) {
        where.expertise = { contains: skill, mode: 'insensitive' };
      }
      if (maxRate) {
        where.hourlyRate = { lte: maxRate };
      }
      if (minRating) {
        where.rating = { gte: minRating };
      }

      const [mentors, total] = await Promise.all([
        prisma.mentorProfile.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                headline: true,
                location: true,
                bio: true,
              },
            },
            _count: {
              select: { bookings: true, requests: true },
            },
          },
          orderBy: { rating: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.mentorProfile.count({ where }),
      ]);

      return apiSuccess({
        mentors,
        total,
        limit,
        offset,
      });
    } catch (error: any) {
      return apiError(error.message || 'Failed to fetch mentors', 'INTERNAL_ERROR', 500);
    }
  }

  static async getMentorDetail(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await params;
      const mentor = await prisma.mentorProfile.findFirst({
        where: {
          OR: [{ id }, { userId: id }],
        },
        include: {
          user: {
            include: {
              profile: true,
              skills: { include: { skill: true } },
              experiences: { orderBy: { startDate: 'desc' } },
              educations: true,
              certifications: true,
              projects: true,
              instructedCourses: { where: { isPublished: true } },
              receivedReviews: {
                where: { reviewType: 'MENTOR' },
                include: {
                  author: {
                    select: { id: true, name: true, avatarUrl: true },
                  },
                },
                orderBy: { createdAt: 'desc' },
              },
            },
          },
        },
      });

      if (!mentor) {
        return apiError('Mentor not found', 'NOT_FOUND', 404);
      }

      return apiSuccess({ mentor });
    } catch (error: any) {
      return apiError(error.message || 'Failed to fetch mentor details', 'INTERNAL_ERROR', 500);
    }
  }

  static async requestMentorship(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const authUser = await getCurrentUser(req);
      if (!authUser) {
        return apiError('Unauthorized: Please log in to request mentorship', 'UNAUTHORIZED', 401);
      }

      // Rate limit: 10 mentorship requests / minute
      const rateLimitResponse = await enforceRateLimit(req, 'mentorship:request', 10, 60, authUser.id);
      if (rateLimitResponse) return rateLimitResponse;

      const { id } = await params;
      const mentor = await prisma.mentorProfile.findFirst({
        where: {
          OR: [{ id }, { userId: id }],
        },
        include: { user: true },
      });

      if (!mentor) {
        return apiError('Mentor not found', 'NOT_FOUND', 404);
      }

      if (mentor.userId === authUser.id) {
        return apiError('Cannot request mentorship from yourself', 'BAD_REQUEST', 400);
      }

      const body = await req.json();
      const validated = requestMentorshipSchema.safeParse(body);
      if (!validated.success) {
        return apiError(validated.error.errors[0]?.message || 'Validation failed', 'VALIDATION_ERROR', 400);
      }

      // Check for existing pending request
      const existingRequest = await prisma.mentorshipRequest.findFirst({
        where: {
          studentId: authUser.id,
          mentorId: mentor.id,
          status: 'PENDING',
        },
      });

      if (existingRequest) {
        return apiError('You already have a pending mentorship request with this mentor', 'CONFLICT', 409);
      }

      const request = await prisma.mentorshipRequest.create({
        data: {
          studentId: authUser.id,
          mentorId: mentor.id,
          topic: validated.data.topic,
          message: validated.data.message,
          preferredTime: validated.data.preferredTime || null,
          status: 'PENDING',
        },
      });

      // Send persistent notification to the mentor
      await prisma.notification.create({
        data: {
          userId: mentor.userId,
          title: 'New Mentorship Request',
          message: `${authUser.name} has requested 1-on-1 mentorship on "${validated.data.topic}".`,
          link: '/mentor/dashboard',
          notificationType: 'MENTORSHIP_REQUEST',
        },
      }).catch(() => {});

      return apiSuccess(
        {
          message: 'Mentorship request submitted successfully',
          request,
        },
        201
      );
    } catch (error: any) {
      return apiError(error.message || 'Failed to submit mentorship request', 'INTERNAL_ERROR', 500);
    }
  }

  static async getMentorRequests(req: NextRequest) {
    try {
      const authUser = await getCurrentUser(req);
      if (!authUser) {
        return apiError('Unauthorized', 'UNAUTHORIZED', 401);
      }

      const mentorProfile = await prisma.mentorProfile.findUnique({
        where: { userId: authUser.id },
      });

      if (!mentorProfile) {
        return apiError('Mentor profile not found', 'NOT_FOUND', 404);
      }

      const requests = await prisma.mentorshipRequest.findMany({
        where: { mentorId: mentorProfile.id },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              avatarUrl: true,
              headline: true,
              profile: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return apiSuccess({ requests });
    } catch (error: any) {
      return apiError(error.message || 'Failed to fetch mentor requests', 'INTERNAL_ERROR', 500);
    }
  }

  static async updateRequestStatus(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const authUser = await getCurrentUser(req);
      if (!authUser) {
        return apiError('Unauthorized', 'UNAUTHORIZED', 401);
      }

      const { id: requestId } = await params;
      const { status } = await req.json();

      if (!['ACCEPTED', 'REJECTED', 'COMPLETED'].includes(status)) {
        return apiError('Invalid status. Allowed: ACCEPTED, REJECTED, COMPLETED', 'BAD_REQUEST', 400);
      }

      const mentorshipRequest = await prisma.mentorshipRequest.findUnique({
        where: { id: requestId },
        include: {
          mentor: true,
          student: true,
        },
      });

      if (!mentorshipRequest) {
        return apiError('Mentorship request not found', 'NOT_FOUND', 404);
      }

      if (mentorshipRequest.mentor.userId !== authUser.id && authUser.role !== 'ADMIN') {
        return apiError('Forbidden: You can only manage requests sent to your mentor profile', 'FORBIDDEN', 403);
      }

      const updated = await prisma.mentorshipRequest.update({
        where: { id: requestId },
        data: { status },
      });

      if (status === 'ACCEPTED') {
        // Create conversation between student and mentor if not existing
        await MessagingRepository.getOrCreateDirectConversation(
          mentorshipRequest.studentId,
          mentorshipRequest.mentor.userId
        );

        // Notify student
        await prisma.notification.create({
          data: {
            userId: mentorshipRequest.studentId,
            title: 'Mentorship Request Accepted! 🎉',
            message: `${authUser.name} accepted your mentorship request on "${mentorshipRequest.topic}". You can now start messaging.`,
            link: '/messages',
            notificationType: 'MENTORSHIP_REQUEST',
          },
        }).catch(() => {});
      }

      return apiSuccess({
        message: `Request status updated to ${status}`,
        request: updated,
      });
    } catch (error: any) {
      return apiError(error.message || 'Failed to update request status', 'INTERNAL_ERROR', 500);
    }
  }
}
