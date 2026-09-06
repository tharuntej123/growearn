import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class MentorRepository {
  static async getAllMentors(params?: {
    search?: string;
    skill?: string;
    maxRate?: number;
    minRating?: number;
  }) {
    const where: Prisma.MentorProfileWhereInput = {
      isAvailable: true,
    };

    if (params?.search) {
      where.OR = [
        { bio: { contains: params.search } },
        { expertise: { contains: params.search } },
        { user: { name: { contains: params.search } } },
        { user: { headline: { contains: params.search } } },
      ];
    }

    if (params?.skill) {
      where.expertise = { contains: params.skill };
    }

    if (params?.maxRate) {
      where.hourlyRate = { lte: params.maxRate };
    }

    if (params?.minRating) {
      where.rating = { gte: params.minRating };
    }

    return prisma.mentorProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            headline: true,
            location: true,
            skills: { include: { skill: true } },
          },
        },
        _count: {
          select: {
            bookings: true,
            requests: true,
          },
        },
      },
      orderBy: { rating: 'desc' },
    });
  }

  static async getMentorById(mentorProfileId: string) {
    return prisma.mentorProfile.findUnique({
      where: { id: mentorProfileId },
      include: {
        user: {
          include: {
            profile: true,
            skills: { include: { skill: true } },
            experiences: true,
            educations: true,
            certifications: true,
            projects: true,
            instructedCourses: true,
            receivedReviews: {
              where: { reviewType: 'MENTOR' },
              include: {
                author: {
                  select: { id: true, name: true, avatarUrl: true },
                },
              },
            },
          },
        },
        bookings: {
          include: {
            student: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
        requests: {
          include: {
            student: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  static async createRequest(studentId: string, mentorProfileId: string, data: {
    topic: string;
    message: string;
    preferredTime?: string;
  }) {
    return prisma.mentorshipRequest.create({
      data: {
        studentId,
        mentorId: mentorProfileId,
        topic: data.topic,
        message: data.message,
        preferredTime: data.preferredTime,
        status: 'PENDING',
      },
    });
  }

  static async updateRequestStatus(requestId: string, status: string) {
    return prisma.mentorshipRequest.update({
      where: { id: requestId },
      data: { status },
    });
  }

  static async createBooking(data: {
    requestId?: string;
    studentId: string;
    mentorId: string;
    scheduledAt: Date;
    durationMinutes: number;
    price: number;
    meetingUrl?: string;
  }) {
    return prisma.mentorshipBooking.create({
      data: {
        requestId: data.requestId,
        studentId: data.studentId,
        mentorId: data.mentorId,
        scheduledAt: data.scheduledAt,
        durationMinutes: data.durationMinutes,
        price: data.price,
        meetingUrl: data.meetingUrl || 'https://meet.jit.si/ufp-mentorship-session',
        status: 'SCHEDULED',
      },
    });
  }
}
