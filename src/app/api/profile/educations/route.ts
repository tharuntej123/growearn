import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const educationSchema = z.object({
  school: z.string().optional(),
  institution: z.string().optional(),
  degree: z.string().min(1, 'Degree is required'),
  fieldOfStudy: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  startYear: z.number().optional(),
  endYear: z.number().optional(),
  grade: z.string().optional(),
}).refine(data => data.school || data.institution, {
  message: 'School or institution name is required',
  path: ['school'],
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

    const schoolName = validated.data.school || validated.data.institution || 'Unknown Institution';
    const field = validated.data.fieldOfStudy || 'General';

    let startDate = new Date('2022-01-01');
    if (validated.data.startDate) {
      startDate = new Date(validated.data.startDate);
    } else if (validated.data.startYear) {
      startDate = new Date(`${validated.data.startYear}-01-01`);
    }

    let endDate: Date | null = null;
    if (validated.data.endDate) {
      endDate = new Date(validated.data.endDate);
    } else if (validated.data.endYear) {
      endDate = new Date(`${validated.data.endYear}-01-01`);
    }

    const education = await prisma.education.create({
      data: {
        userId: authUser.id,
        school: schoolName,
        degree: validated.data.degree,
        fieldOfStudy: field,
        startDate,
        endDate,
        grade: validated.data.grade || null,
      },
    });

    return apiSuccess({ education }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Failed to add education', 'INTERNAL_ERROR', 500);
  }
}
