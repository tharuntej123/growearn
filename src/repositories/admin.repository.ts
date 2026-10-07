import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class AdminRepository {
  // Get real-time platform metrics.
  static async getPlatformStats() {
    const totalUsers = await prisma.user.count();
    const learnersCount = await prisma.user.count({ where: { role: { in: ['LEARNER', 'STUDENT'] } } });
    const mentorsCount = await prisma.user.count({ where: { role: 'MENTOR' } });
    const professionalsCount = await prisma.user.count({ where: { role: { in: ['PROFESSIONAL', 'FREELANCER'] } } });
    const employersCount = await prisma.user.count({ where: { role: { in: ['EMPLOYER', 'COMPANY'] } } });
    const totalCourses = await prisma.course.count();
    const totalEnrollments = await prisma.enrollment.count();
    const totalJobs = await prisma.job.count();
    const totalApplications = await prisma.application.count();
    const totalMessages = await prisma.message.count();
    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return {
      totalUsers,
      roleDistribution: {
        learners: learnersCount,
        mentors: mentorsCount,
        professionals: professionalsCount,
        employers: employersCount,
      },
      contentMetrics: {
        courses: totalCourses,
        enrollments: totalEnrollments,
        jobs: totalJobs,
        applications: totalApplications,
        messages: totalMessages,
      },
      recentAuditLogs,
    };
  }

  // List users with pagination and search.
  static async listUsers(params: {
    query?: string;
    role?: string;
    isVerified?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const where: Prisma.UserWhereInput = {};

    if (params.query) {
      where.OR = [
        { name: { contains: params.query, mode: 'insensitive' } },
        { email: { contains: params.query, mode: 'insensitive' } },
      ];
    }

    if (params.role) {
      where.role = params.role.toUpperCase();
    }

    if (params.isVerified !== undefined) {
      where.isVerified = params.isVerified;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isVerified: true,
          avatarUrl: true,
          headline: true,
          createdAt: true,
          _count: {
            select: {
              instructedCourses: true,
              enrollments: true,
              jobPostings: true,
              applications: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: params.limit || 20,
        skip: params.offset || 0,
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  // Update user role by administrator.
  static async updateUserRole(adminUserId: string, targetUserId: string, newRole: string) {
    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole.toUpperCase() },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'ADMIN_ROLE_CHANGE',
        resource: 'User',
        details: { targetUserId, newRole: newRole.toUpperCase() },
      },
    });

    return user;
  }

  // Verify or unverify user by administrator.
  static async verifyUser(adminUserId: string, targetUserId: string, isVerified: boolean) {
    const user = await prisma.user.update({
      where: { id: targetUserId },
      data: { isVerified },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: isVerified ? 'ADMIN_VERIFY_USER' : 'ADMIN_UNVERIFY_USER',
        resource: 'User',
        details: { targetUserId, isVerified },
      },
    });

    return user;
  }

  // Moderate course (publish / unpublish / delete).
  static async moderateCourse(adminUserId: string, courseId: string, isPublished: boolean) {
    const course = await prisma.course.update({
      where: { id: courseId },
      data: { isPublished },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: isPublished ? 'ADMIN_PUBLISH_COURSE' : 'ADMIN_UNPUBLISH_COURSE',
        resource: 'Course',
        details: { courseId, isPublished },
      },
    });

    return course;
  }

  // Moderate job posting.
  static async moderateJob(adminUserId: string, jobId: string, status: string) {
    const job = await prisma.job.update({
      where: { id: jobId },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        userId: adminUserId,
        action: 'ADMIN_MODERATE_JOB',
        resource: 'Job',
        details: { jobId, status },
      },
    });

    return job;
  }

  // Retrieve platform audit logs.
  static async getAuditLogs(params: { limit?: number; offset?: number; action?: string }) {
    const where: Prisma.AuditLogWhereInput = {};
    if (params.action) {
      where.action = params.action;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        take: params.limit || 50,
        skip: params.offset || 0,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }

  // Enforce AuditLog immutability: UPDATE is strictly forbidden.
  static async updateAuditLog(): Promise<never> {
    throw new Error('Audit logs are strictly immutable and append-only. UPDATE operations are forbidden.');
  }

  // Enforce AuditLog immutability: DELETE is strictly forbidden.
  static async deleteAuditLog(): Promise<never> {
    throw new Error('Audit logs are strictly immutable and append-only. DELETE operations are forbidden.');
  }
}
