import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { NotificationRepository } from '@/repositories/notification.repository';

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401);
    }

    await NotificationRepository.markAllAsRead(authUser.id);

    return apiSuccess({ message: 'All notifications marked as read' });
 } catch (_e) { const err = _e as Error; 
    return apiError(err.message || 'Failed to update notifications', 'INTERNAL_ERROR', 500);
  }
}
