import { NextRequest } from 'next/server';
import { getCurrentUser, isRoleAllowed } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { AdminRepository } from '@/repositories/admin.repository';

import { z } from 'zod';

const updateRoleSchema = z.object({
  role: z.enum(['LEARNER', 'FREELANCER', 'MENTOR', 'COMPANY', 'ADMIN']),
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

    const { id: targetUserId } = await context.params;
    if (!targetUserId || targetUserId.trim().length === 0) {
      return apiError('Target user ID is required', 'BAD_REQUEST', 400);
    }

    const body = await req.json().catch(() => ({}));
    const validated = updateRoleSchema.safeParse(body);
    if (!validated.success) {
      return apiError(
        validated.error.errors[0]?.message || 'Invalid role. Must be one of: LEARNER, FREELANCER, MENTOR, COMPANY, ADMIN',
        'VALIDATION_ERROR',
        400
      );
    }

    const updated = await AdminRepository.updateUserRole(authUser.id, targetUserId, validated.data.role);
    return apiSuccess({ user: updated, message: `Role updated to ${validated.data.role}` });
  } catch (error: any) {
    if (error.message?.includes('Forbidden') || error.message?.includes('prohibited')) {
      return apiError(error.message, 'FORBIDDEN', 403);
    }
    if (error.message?.includes('not found')) {
      return apiError(error.message, 'NOT_FOUND', 404);
    }
    return apiError(error.message || 'Failed to update user role', 'INTERNAL_ERROR', 500);
  }
}
