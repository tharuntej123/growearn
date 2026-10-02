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

    const { id: jobId } = await context.params;
    const { status } = await req.json();

    const updated = await AdminRepository.moderateJob(authUser.id, jobId, status || 'CLOSED');
    return apiSuccess({ job: updated, message: `Job status updated to ${status}` });
  } catch (error: any) {
    return apiError(error.message || 'Failed to moderate job', 'INTERNAL_ERROR', 500);
  }
}
