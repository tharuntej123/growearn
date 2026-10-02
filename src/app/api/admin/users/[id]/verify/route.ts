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
    const { isVerified } = await req.json();

    const updated = await AdminRepository.verifyUser(authUser.id, targetUserId, Boolean(isVerified));
    return apiSuccess({ user: updated, message: `Verification status updated to ${isVerified}` });
  } catch (error: any) {
    return apiError(error.message || 'Failed to update user verification', 'INTERNAL_ERROR', 500);
  }
}
