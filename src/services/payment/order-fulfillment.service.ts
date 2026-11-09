import { Prisma, PaymentOrder } from '@prisma/client';

export class OrderFulfillmentService {
  /**
   * Unified, idempotent fulfillment engine for both COURSE and MENTORSHIP orders.
   * Executed within a transactional client to ensure atomic state transitions.
   */
  public static async fulfillOrder(
    tx: Prisma.TransactionClient,
    order: PaymentOrder,
    paymentId: string
  ): Promise<{ entitlementId: string }> {
    let entitlementId = '';
    const userId = order.userId;
    const orderNotes = (order.notes as Record<string, unknown>) || {};

    if (order.itemType === 'COURSE') {
      await tx.coursePurchase.upsert({
        where: { userId_courseId: { userId, courseId: order.itemId } },
        update: {
          paymentId,
          orderId: order.id,
          amountPaid: order.amount,
        },
        create: {
          userId,
          courseId: order.itemId,
          paymentId,
          orderId: order.id,
          amountPaid: order.amount,
          currency: order.currency,
        },
      });

      const enrollment = await tx.enrollment.upsert({
        where: { studentId_courseId: { studentId: userId, courseId: order.itemId } },
        update: {
          progressPercent: 0,
        },
        create: {
          studentId: userId,
          courseId: order.itemId,
          progressPercent: 0,
        },
      });
      entitlementId = enrollment.id;

      await tx.notification.create({
        data: {
          userId,
          title: 'Course Enrollment Activated! 🎓',
          message: `Your payment of ₹${order.amount} was confirmed. You now have full access.`,
          link: `/courses/${order.itemId}`,
          notificationType: 'COURSE_UPDATE',
        },
      }).catch(() => {});
    } else if (order.itemType === 'MENTORSHIP') {
      const scheduledAt =
        typeof orderNotes.scheduledAt === 'string'
          ? new Date(orderNotes.scheduledAt)
          : new Date(Date.now() + 86400000);
      const durationMinutes =
        typeof orderNotes.durationMinutes === 'number' ? orderNotes.durationMinutes : 60;

      // Idempotency: check if booking already exists for this payment
      let booking = await tx.mentorshipBooking.findFirst({
        where: { paymentId },
      });

      if (!booking) {
        booking = await tx.mentorshipBooking.create({
          data: {
            studentId: userId,
            mentorId: order.itemId,
            scheduledAt,
            durationMinutes,
            price: order.amount,
            status: 'SCHEDULED',
            paymentId,
          },
        });
      }
      entitlementId = booking.id;

      await tx.payment.update({
        where: { id: paymentId },
        data: { bookingId: booking.id },
      });

      await tx.notification.create({
        data: {
          userId,
          title: 'Mentorship Booking Confirmed! 🤝',
          message: `Your mentorship session has been scheduled. Payment of ₹${order.amount} was captured.`,
          link: '/mentors',
          notificationType: 'GENERAL',
        },
      }).catch(() => {});
    }

    return { entitlementId };
  }
}
