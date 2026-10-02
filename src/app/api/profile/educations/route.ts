import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const educationSchema = z.object({
  school: z.string().min(2, 'School name is required'),
  degree: z.string().min(2, 'Degree is required'),
  fieldOfStudy: z.string().min(2, 'Field of study is required'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  grade: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const body = await req.json();
    const validated = educationSchema.safeParse(body);
    if (!validated.success) {
      return apiError(validated.error.errors[0]?.message || 'Validation error', 'VALIDATION_ERROR', 400);
    }

    const education = await prisma.education.create({
      data: {
        userId: authUser.id,
        school: validated.data.school,
        degree: validated.data.degree,
        fieldOfStudy: validated.data.fieldOfStudy,
        startDate: validated.data.startDate ? new Date(validated.data.startDate) : new Date('2022-01-01'),
        endDate: validated.data.endDate ? new Date(validated.data.endDate) : null,
        grade: validated.data.grade || null,
      },
    });

    return apiSuccess({ education }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Failed to add education', 'INTERNAL_ERROR', 500);
  }
}
