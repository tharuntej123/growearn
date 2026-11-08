import prisma from '@/lib/prisma';
import { PaymentProviderFactory } from './payment-provider.factory';

export interface VerifyPaymentInput {
  orderId: string;
  paymentId?: string;
  signature?: string;
  rawBody?: string;
  timestamp?: string;
}

export class PaymentVerificationService {
  // Cryptographically verify payment status with Cashfree server API and execute transaction.
  public static async verifyAndProcessPayment(
    userId: string,
    input: VerifyPaymentInput
  ): Promise<{
    success: boolean;
    paymentId: string;
    itemType: string;
    itemId: string;
    entitlementId: string;
  }> {
    const providerOrderId = input.orderId;

    if (!providerOrderId) {
      throw new Error('Order ID is required for payment verification');
    }

    // 1. Lookup existing PaymentOrder
    const order = await prisma.paymentOrder.findFirst({
      where: {
        OR: [{ id: providerOrderId }, { providerOrderId: providerOrderId }],
      },
      include: { payment: true },
    });

    if (!order) {
      throw new Error(`Payment order not found for order identifier ${providerOrderId}`);
    }

    if (order.userId !== userId) {
      throw new Error('Unauthorized: Payment order does not belong to the current authenticated user');
    }

    // Idempotency: If already marked PAID and payment captured, return existing entitlement
    if (order.status === 'PAID' && order.payment && order.payment.status === 'CAPTURED') {
      let entitlementId = '';
      if (order.itemType === 'COURSE') {
        const enrollment = await prisma.enrollment.findUnique({
          where: { studentId_courseId: { studentId: userId, courseId: order.itemId } },
        });
        entitlementId = enrollment?.id || '';
      } else if (order.itemType === 'MENTORSHIP') {
        const booking = await prisma.mentorshipBooking.findFirst({
          where: { studentId: userId, mentorId: order.itemId, status: 'SCHEDULED' },
        });
        entitlementId = booking?.id || '';
      }

      return {
        success: true,
        paymentId: order.payment.id,
        itemType: order.itemType,
        itemId: order.itemId,
        entitlementId,
      };
    }

    const provider = PaymentProviderFactory.getCashfreeProvider();

    // 2. Fetch authoritative payment status directly from Cashfree API
    const verification = await provider.verifyPayment({
      providerOrderId: order.providerOrderId,
      providerPaymentId: input.paymentId,
      signature: input.signature,
      rawBody: input.rawBody,
      timestamp: input.timestamp,
    });

    if (!verification.verified || verification.status === 'FAILED') {
      await prisma.payment.upsert({
        where: { providerOrderId: order.providerOrderId },
        update: {
          status: 'FAILED',
          failureReason: verification.failureReason || 'Verification failed with payment gateway',
        },
        create: {
          userId,
          providerOrderId: order.providerOrderId,
          providerPaymentId: verification.providerPaymentId || null,
          providerSignature: input.signature || null,
          amount: order.amount,
          amountInPaise: order.amountInPaise,
          currency: order.currency,
          status: 'FAILED',
          provider: 'CASHFREE',
          itemType: order.itemType,
          itemId: order.itemId,
          failureReason: verification.failureReason || 'Verification failed with payment gateway',
        },
      }).catch(() => {});

      throw new Error(`Payment verification failed: ${verification.failureReason || 'Order is not marked PAID on Cashfree'}`);
    }

    // Verify amount match
    if (verification.amount && Math.abs(Number(order.amount) - verification.amount) > 0.01) {
      throw new Error(`Payment verification amount mismatch: Expected ₹${order.amount}, received ₹${verification.amount}`);
    }

    const orderNotes = (order.notes as Record<string, unknown>) || {};

    // 3. Process Transactionally
    const transactionResult = await prisma.$transaction(async (tx) => {
      // Mark order as PAID
      await tx.paymentOrder.update({
        where: { id: order.id },
        data: { status: 'PAID' },
      });

      // Upsert Payment record
      const payment = await tx.payment.upsert({
        where: { providerOrderId: order.providerOrderId },
        update: {
          status: 'CAPTURED',
          providerPaymentId: verification.providerPaymentId || undefined,
          providerSignature: input.signature || undefined,
          provider: 'CASHFREE',
        },
        create: {
          orderId: order.id,
          userId,
          providerOrderId: order.providerOrderId,
          providerPaymentId: verification.providerPaymentId || null,
          providerSignature: input.signature || null,
          amount: order.amount,
          amountInPaise: order.amountInPaise,
          currency: order.currency,
          status: 'CAPTURED',
          provider: 'CASHFREE',
          itemType: order.itemType,
          itemId: order.itemId,
          courseId: order.itemType === 'COURSE' ? order.itemId : null,
          mentorProfileId: order.itemType === 'MENTORSHIP' ? order.itemId : null,
        },
      });

      let entitlementId = '';

      if (order.itemType === 'COURSE') {
        // Record CoursePurchase
        await tx.coursePurchase.upsert({
          where: { userId_courseId: { userId, courseId: order.itemId } },
          update: {
            paymentId: payment.id,
            orderId: order.id,
            amountPaid: order.amount,
          },
          create: {
            userId,
            courseId: order.itemId,
            paymentId: payment.id,
            orderId: order.id,
            amountPaid: order.amount,
            currency: order.currency,
          },
        });

        // Grant active Enrollment
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

        // Send confirmation notification
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
        const scheduledAt = typeof orderNotes.scheduledAt === 'string' ? new Date(orderNotes.scheduledAt) : new Date(Date.now() + 86400000);
        const durationMinutes = typeof orderNotes.durationMinutes === 'number' ? orderNotes.durationMinutes : 60;

        // Create confirmed MentorshipBooking
        const booking = await tx.mentorshipBooking.create({
          data: {
            studentId: userId,
            mentorId: order.itemId,
            scheduledAt,
            durationMinutes,
            price: order.amount,
            status: 'SCHEDULED',
            paymentId: payment.id,
          },
        });
        entitlementId = booking.id;

        // Link payment to booking
        await tx.payment.update({
          where: { id: payment.id },
          data: { bookingId: booking.id },
        });

        // Send notifications
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

      return {
        paymentId: payment.id,
        entitlementId,
      };
    }, { timeout: 25000, maxWait: 10000 });

    return {
      success: true,
      paymentId: transactionResult.paymentId,
      itemType: order.itemType,
      itemId: order.itemId,
      entitlementId: transactionResult.entitlementId,
    };
  }
}

