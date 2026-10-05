import { NextRequest } from 'next/server';
import { getCurrentUser, isRoleAllowed } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { CourseRepository } from '@/repositories/course.repository';
import { z } from 'zod';

const createCourseSchema = z.object({
  title: z.string().min(3, 'Course title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().default('Development'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER'),
  price: z.number().min(0).default(0),
  durationHours: z.number().min(0.5).default(10),
  thumbnail: z.string().url().optional().or(z.literal('')),
  skillsCovered: z.string().optional(),
  modules: z
    .array(
      z.object({
        title: z.string().min(2),
        description: z.string().optional(),
        orderIndex: z.number().default(0),
        lessons: z
          .array(
            z.object({
              title: z.string().min(2),
              content: z.string().optional(),
              videoUrl: z.string().optional(),
              durationMinutes: z.number().default(15),
              orderIndex: z.number().default(0),
            })
          )
          .optional(),
      })
    )
    .optional(),
});

export class CourseController {
  static async getCourses(req: NextRequest) {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || searchParams.get('query') || undefined;
      const category = searchParams.get('category') || undefined;
      const level = searchParams.get('level') || undefined;
      const skill = searchParams.get('skill') || undefined;
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const offset = parseInt(searchParams.get('offset') || '0', 10);
      const excludeIdsParam = searchParams.get('excludeIds');
      const excludeIds = excludeIdsParam ? excludeIdsParam.split(',').filter(Boolean) : [];

      const where: any = { isPublished: true };
      if (excludeIds.length > 0) {
        where.id = { notIn: excludeIds };
      }
      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { skillsCovered: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (category && category !== 'All') {
        where.category = category;
      }
      if (level && level !== 'All') {
        where.level = level.toUpperCase();
      }
      if (skill) {
        where.skillsCovered = { contains: skill, mode: 'insensitive' };
      }

      const [courses, total] = await Promise.all([
        prisma.course.findMany({
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
              include: { lessons: true },
            },
            _count: {
              select: { enrollments: true, reviews: true },
            },
          },
          orderBy: { rating: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.course.count({ where }),
      ]);

      return apiSuccess({
        courses,
        total,
        limit,
        offset,
      });
    } catch (error: any) {
      return apiError(error.message || 'Failed to fetch courses', 'INTERNAL_ERROR', 500);
    }
  }

  static async getCourseDetail(req: NextRequest, { params }: { params: Promise<{ id?: string; slug?: string }> }) {
    try {
      const resolvedParams = await params;
      const identifier = resolvedParams.slug || resolvedParams.id;
      if (!identifier) {
        return apiError('Course identifier is required', 'BAD_REQUEST', 400);
      }

      const authUser = await getCurrentUser(req);

      const course = await prisma.course.findFirst({
        where: {
          OR: [{ id: identifier }, { slug: identifier }],
        },
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
                select: { id: true, name: true, avatarUrl: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: { enrollments: true, reviews: true },
          },
        },
      });

      if (!course) {
        return apiError('Course not found', 'NOT_FOUND', 404);
      }

      let enrollment = null;
      if (authUser) {
        enrollment = await prisma.enrollment.findUnique({
          where: {
            studentId_courseId: {
              studentId: authUser.id,
              courseId: course.id,
            },
          },
          include: {
            lessonProgress: true,
          },
        });
      }

      return apiSuccess({
        course,
        isEnrolled: Boolean(enrollment),
        enrollment,
      });
    } catch (error: any) {
      return apiError(error.message || 'Failed to fetch course details', 'INTERNAL_ERROR', 500);
    }
  }

  static async createCourse(req: NextRequest) {
    try {
      const authUser = await getCurrentUser(req);
      if (!authUser) {
        return apiError('Unauthorized', 'UNAUTHORIZED', 401);
      }

      if (!isRoleAllowed(authUser.role, ['MENTOR', 'ADMIN'])) {
        return apiError('Forbidden: Only Mentors and Admins can publish courses', 'FORBIDDEN', 403);
      }

      const body = await req.json();
      const validated = createCourseSchema.safeParse(body);
      if (!validated.success) {
        return apiError(validated.error.errors[0]?.message || 'Validation failed', 'VALIDATION_ERROR', 400);
      }

      const { modules, ...courseData } = validated.data;
      const slug = courseData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + `-${Date.now().toString().slice(-4)}`;

      const course = await prisma.course.create({
        data: {
          instructorId: authUser.id,
          title: courseData.title,
          slug,
          description: courseData.description,
          category: courseData.category,
          level: courseData.level,
          price: courseData.price,
          durationHours: courseData.durationHours,
          thumbnail: courseData.thumbnail || null,
          skillsCovered: courseData.skillsCovered || null,
          isPublished: true,
          modules: modules
            ? {
                create: modules.map((m, mIdx) => ({
                  title: m.title,
                  description: m.description || null,
                  orderIndex: m.orderIndex || mIdx,
                  lessons: m.lessons
                    ? {
                        create: m.lessons.map((l, lIdx) => ({
                          title: l.title,
                          content: l.content || null,
                          videoUrl: l.videoUrl || null,
                          durationMinutes: l.durationMinutes || 15,
                          orderIndex: l.orderIndex || lIdx,
                        })),
                      }
                    : undefined,
                })),
              }
            : undefined,
        },
        include: {
          modules: { include: { lessons: true } },
        },
      });

      return apiSuccess({ course }, 201);
    } catch (error: any) {
      return apiError(error.message || 'Failed to create course', 'INTERNAL_ERROR', 500);
    }
  }

  static async enroll(req: NextRequest, { params }: { params: Promise<{ id?: string; slug?: string }> }) {
    try {
      const authUser = await getCurrentUser(req);
      if (!authUser) {
        return apiError('Unauthorized: Please log in to enroll in this course', 'UNAUTHORIZED', 401);
      }

      const resolvedParams = await params;
      const identifier = resolvedParams.slug || resolvedParams.id;
      if (!identifier) {
        return apiError('Course identifier is required', 'BAD_REQUEST', 400);
      }

      const course = await prisma.course.findFirst({
        where: {
          OR: [{ id: identifier }, { slug: identifier }],
        },
      });

      if (!course) {
        return apiError('Course not found', 'NOT_FOUND', 404);
      }

      // Check if this is a paid course
      if (course.price > 0 && authUser.role !== 'ADMIN' && course.instructorId !== authUser.id) {
        const purchase = await prisma.coursePurchase.findUnique({
          where: {
            userId_courseId: {
              userId: authUser.id,
              courseId: course.id,
            },
          },
        });

        if (!purchase) {
          return apiError(
            `Payment required: "${course.title}" is a paid course (₹${course.price}). Please complete Razorpay payment checkout to gain access.`,
            'PAYMENT_REQUIRED',
            402
          );
        }
      }

      const enrollment = await CourseRepository.enrollStudent(authUser.id, course.id);

      // Create persistent notification for student
      await prisma.notification.create({
        data: {
          userId: authUser.id,
          title: 'Course Enrollment Confirmed',
          message: `You have successfully enrolled in "${course.title}". Start learning now!`,
          link: `/courses/${course.slug}`,
          notificationType: 'COURSE_UPDATE',
        },
      }).catch(() => {});

      return apiSuccess({
        message: `Successfully enrolled in ${course.title}`,
        enrollment,
      });
    } catch (error: any) {
      return apiError(error.message || 'Enrollment failed', 'INTERNAL_ERROR', 500);
    }
  }
}
