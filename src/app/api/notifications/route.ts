import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { NotificationRepository } from '@/repositories/notification.repository';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const { notifications, unreadCount } = await NotificationRepository.getUserNotifications(
      authUser.id,
      limit,
      offset
    );

    return apiSuccess({ notifications, unreadCount });
  } catch (error: any) {
    return apiError(error.message || 'Failed to fetch notifications', 'INTERNAL_ERROR', 500);
  }
}
