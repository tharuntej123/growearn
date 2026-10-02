import { NextRequest } from 'next/server';
import { getCurrentUser, isRoleAllowed } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { AdminRepository } from '@/repositories/admin.repository';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser || !isRoleAllowed(authUser.role, ['ADMIN'])) {
      return apiError('Forbidden: Administrator access required', 'FORBIDDEN', 403);
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await AdminRepository.getAuditLogs({ action, limit, offset });
    return apiSuccess({ ...result, limit, offset });
  } catch (error: any) {
    return apiError(error.message || 'Failed to fetch audit logs', 'INTERNAL_ERROR', 500);
  }
}
