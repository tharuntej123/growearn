import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class CourseRepository {
  static async getAllCourses(params?: {
    search?: string;
    category?: string;
    level?: string;
    skill?: string;
  }) {
    const where: Prisma.CourseWhereInput = {
      isPublished: true,
    };

    if (params?.search) {
      where.OR = [
        { title: { contains: params.search } },
        { description: { contains: params.search } },
        { skillsCovered: { contains: params.search } },
      ];
    }

    if (params?.category) {
      where.category = params.category;
    }

    if (params?.level) {
      where.level = params.level;
    }

    if (params?.skill) {
      where.skillsCovered = { contains: params.skill };
    }

    return prisma.course.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            headline: true,
          },
        },
        modules: {
          include: {
            lessons: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
      orderBy: { rating: 'desc' },
    });
  }

  static async getCourseById(id: string) {
    return prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            headline: true,
            bio: true,
          },
        },
        modules: {
          orderBy: { orderIndex: 'asc' },
          include: {
            lessons: {
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        reviews: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });
  }

  static async enrollStudent(studentId: string, courseId: string) {
    return prisma.enrollment.upsert({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
      update: {},
      create: {
        studentId,
        courseId,
        progressPercent: 0,
      },
    });
  }

  static async updateLessonProgress(enrollmentId: string, lessonId: string, isCompleted: boolean) {
    const progress = await prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId,
          lessonId,
        },
      },
      update: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
      create: {
        enrollmentId,
        lessonId,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    });

    // Calculate total progress
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            modules: {
              include: { lessons: true },
            },
          },
        },
        lessonProgress: true,
      },
    });

    if (enrollment) {
      const allLessons = enrollment.course.modules.flatMap((m) => m.lessons);
      const totalCount = allLessons.length || 1;
      const completedCount = enrollment.lessonProgress.filter((p) => p.isCompleted).length;
      const percent = Math.round((completedCount / totalCount) * 100);

      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          progressPercent: percent,
          isCompleted: percent >= 100,
          completedAt: percent >= 100 ? new Date() : null,
        },
      });

      // If completed, issue certificate
      if (percent >= 100) {
        const certNumber = `CERT-${enrollment.courseId.slice(-6).toUpperCase()}-${enrollment.studentId.slice(-6).toUpperCase()}`;
        await prisma.certificate.upsert({
          where: {
            userId_courseId: {
              userId: enrollment.studentId,
              courseId: enrollment.courseId,
            },
          },
          update: {},
          create: {
            userId: enrollment.studentId,
            courseId: enrollment.courseId,
            certificateNumber: certNumber,
          },
        });
      }
    }

    return progress;
  }

  static async getStudentEnrollments(studentId: string) {
    return prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        lessonProgress: true,
      },
      orderBy: { enrolledAt: 'desc' },
    });
  }
}
