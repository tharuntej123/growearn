import { prisma } from '@/lib/prisma';

export class NotificationRepository {
  // Get user notifications with unread count.
  static async getUserNotifications(userId: string, limit = 20, offset = 0) {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { notifications, unreadCount };
  }

  // Create a new persistent notification.
  static async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    link?: string;
    notificationType?: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        link: data.link || null,
        notificationType: data.notificationType || 'INFO',
      },
    });
  }

  // Mark a notification as read.
  static async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  // Mark all notifications as read for a user.
  static async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
