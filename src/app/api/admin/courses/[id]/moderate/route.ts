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

    const { id: courseId } = await context.params;
    const { isPublished } = await req.json();

    const updated = await AdminRepository.moderateCourse(authUser.id, courseId, Boolean(isPublished));
    return apiSuccess({ course: updated, message: `Course moderation updated` });
  } catch (error: any) {
    return apiError(error.message || 'Failed to moderate course', 'INTERNAL_ERROR', 500);
  }
}
