import { NextRequest } from 'next/server';
import { getCurrentUser, isRoleAllowed } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { AdminRepository } from '@/repositories/admin.repository';

import { z } from 'zod';

const moderateJobSchema = z.object({
  status: z.enum(['OPEN', 'CLOSED', 'DRAFT', 'ARCHIVED']),
});

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser || !isRoleAllowed(authUser.role, ['ADMIN'])) {
      return apiError('Forbidden: Administrator access required', 'FORBIDDEN', 403);
    }

    const { id: jobId } = await context.params;
    if (!jobId || jobId.trim().length === 0) {
      return apiError('Job ID is required', 'BAD_REQUEST', 400);
    }

    const body = await req.json().catch(() => ({}));
    const validated = moderateJobSchema.safeParse(body);
    if (!validated.success) {
      return apiError(
        validated.error.errors[0]?.message || 'Invalid status. Must be one of: OPEN, CLOSED, DRAFT, ARCHIVED',
        'VALIDATION_ERROR',
        400
      );
    }

    const updated = await AdminRepository.moderateJob(authUser.id, jobId, validated.data.status);
    return apiSuccess({ job: updated, message: `Job status updated to ${validated.data.status}` });
  } catch (error: any) {
    if (error.message?.includes('not found')) {
      return apiError(error.message, 'NOT_FOUND', 404);
    }
    return apiError(error.message || 'Failed to moderate job', 'INTERNAL_ERROR', 500);
  }
}
