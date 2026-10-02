import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { NotificationRepository } from '@/repositories/notification.repository';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const { id } = await context.params;
    await NotificationRepository.markAsRead(id, authUser.id);

    return apiSuccess({ message: 'Notification marked as read' });
  } catch (error: any) {
    return apiError(error.message || 'Failed to update notification', 'INTERNAL_ERROR', 500);
  }
}
