import { NextRequest } from 'next/server';
import { getCurrentUser, isRoleAllowed } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { AdminRepository } from '@/repositories/admin.repository';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401);
    }

    if (!isRoleAllowed(authUser.role, ['ADMIN'])) {
      return apiError('Forbidden: Administrator access required', 'FORBIDDEN', 403);
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query') || undefined;
    const role = searchParams.get('role') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const result = await AdminRepository.listUsers({ query, role, limit, offset });
    return apiSuccess({ ...result, limit, offset });
  } catch (error: any) {
    return apiError(error.message || 'Failed to list users', 'INTERNAL_ERROR', 500);
  }
}
