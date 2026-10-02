import { NextRequest } from 'next/server';
import { getCurrentUser, isRoleAllowed } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { AdminRepository } from '@/repositories/admin.repository';

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
    const { role } = await req.json();

    if (!role) {
      return apiError('Role is required', 'BAD_REQUEST', 400);
    }

    const updated = await AdminRepository.updateUserRole(authUser.id, targetUserId, role);
    return apiSuccess({ user: updated, message: `Role updated to ${role}` });
  } catch (error: any) {
    return apiError(error.message || 'Failed to update user role', 'INTERNAL_ERROR', 500);
  }
}
