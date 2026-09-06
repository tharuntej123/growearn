import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET(req: NextRequest) {
  const userPayload = getCurrentUserFromRequest(req);
  if (!userPayload) {
    return apiError('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: userPayload.userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  return apiSuccess({ notifications });
}

export async function PUT(req: NextRequest) {
  const userPayload = getCurrentUserFromRequest(req);
  if (!userPayload) {
    return apiError('Unauthorized', 'UNAUTHORIZED', 401);
  }

  await prisma.notification.updateMany({
    where: { userId: userPayload.userId, isRead: false },
    data: { isRead: true },
  });

  return apiSuccess({ message: 'All notifications marked as read' });
}
