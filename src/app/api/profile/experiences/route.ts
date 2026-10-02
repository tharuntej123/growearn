import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const experienceSchema = z.object({
  company: z.string().min(2, 'Company name is required'),
  title: z.string().min(2, 'Job title is required'),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const body = await req.json();
    const validated = experienceSchema.safeParse(body);
    if (!validated.success) {
      return apiError(validated.error.errors[0]?.message || 'Validation error', 'VALIDATION_ERROR', 400);
    }

    const experience = await prisma.experience.create({
      data: {
        userId: authUser.id,
        company: validated.data.company,
        title: validated.data.title,
        location: validated.data.location || null,
        startDate: validated.data.startDate ? new Date(validated.data.startDate) : new Date('2023-01-01'),
        endDate: validated.data.endDate ? new Date(validated.data.endDate) : null,
        isCurrent: validated.data.isCurrent || false,
        description: validated.data.description || null,
      },
    });

    return apiSuccess({ experience }, 201);
  } catch (error: any) {
    return apiError(error.message || 'Failed to add experience', 'INTERNAL_ERROR', 500);
  }
}
