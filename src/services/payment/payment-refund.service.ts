import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { PaymentProviderFactory } from './payment-provider.factory';

export class PaymentRefundService {
  // Production-safe Refund Processing via Cashfree Refund API.
  // Requires ADMIN or INSTRUCTOR/MENTOR role. Disallows arbitrary buyers from self-issuing refunds.
  public static async processRefund(params: {
    paymentId: string;
    amount?: number;
    reason?: string;
    requestingUserId: string;
    requestingUserRole: string;
  }): Promise<{
    success: boolean;
    refundId: string;
    paymentId: string;
    amount: number;
    status: string;
  }> {
    const payment = await prisma.payment.findUnique({
      where: { id: params.paymentId },
      include: {
        order: true,
        course: true,
        mentorProfile: true,
      },
    });

    if (!payment) {
      throw new Error('Payment record not found');
    }

    // RBAC / Authorization check: Only ADMIN or the course instructor / mentor offering the service can process refunds
    const isAdmin = params.requestingUserRole === 'ADMIN';
    const isInstructor = payment.course?.instructorId === params.requestingUserId;
    const isMentor = payment.mentorProfile?.userId === params.requestingUserId;

    if (!isAdmin && !isInstructor && !isMentor) {
      throw new Error('Forbidden: Only administrators or course instructors are authorized to approve and process refunds');
    }

    if (payment.status !== 'CAPTURED') {
      throw new Error(`Refund cannot be initiated for payment with status ${payment.status}`);
    }

    if (payment.refundStatus === 'COMPLETED' || payment.refundStatus === 'SUCCESS') {
      return {
        success: true,
        refundId: String((payment.metadata as Record<string, unknown>)?.refundId || `rfnd_${payment.id}`),
        paymentId: payment.id,
        amount: Number(payment.refundAmount || payment.amount),
        status: 'ALREADY_REFUNDED',
      };
    }

    const numericPaymentAmount = Number(payment.amount);
    const refundAmount =
      params.amount && params.amount > 0 && params.amount <= numericPaymentAmount
        ? params.amount
        : numericPaymentAmount;

    const refundId = `rfnd_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const provider = PaymentProviderFactory.getCashfreeProvider();

    // Call authentic Cashfree refund API
    const refundResult = await provider.refundPayment({
      providerOrderId: payment.providerOrderId,
      refundAmount,
      refundId,
      refundNote: params.reason || 'Customer requested refund / Admin approved',
    });

    // Record refund state in database atomically
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          refundAmount,
          refundStatus: refundResult.status || 'PENDING',
          metadata: {
            ...((payment.metadata as Record<string, unknown>) || {}),
            refundId,
            providerRefundId: refundResult.providerRefundId,
            refundReason: params.reason || 'Refund processed',
            refundedAt: new Date().toISOString(),
          },
        },
      });

      // Revoke course enrollment if full refund
      if (payment.courseId && refundAmount >= Number(payment.amount)) {
        await tx.enrollment.deleteMany({
          where: {
            studentId: payment.userId,
            courseId: payment.courseId,
          },
        }).catch(() => {});
      }

      // Cancel mentorship booking if refunded
      if (payment.bookingId) {
        await tx.mentorshipBooking.update({
          where: { id: payment.bookingId },
          data: { status: 'CANCELLED' },
        }).catch(() => {});
      }

      // Record immutable audit log
      await tx.auditLog.create({
        data: {
          userId: params.requestingUserId,
          action: 'PAYMENT_REFUNDED',
          resource: `payment:${payment.id}`,
          details: {
            paymentId: payment.id,
            providerOrderId: payment.providerOrderId,
            refundAmount,
            refundId,
            providerRefundId: refundResult.providerRefundId,
            reason: params.reason,
            refundStatus: refundResult.status,
          },
        },
      }).catch(() => {});
    });

    return {
      success: true,
      refundId,
      paymentId: payment.id,
      amount: refundAmount,
      status: refundResult.status || 'PENDING',
    };
  }
}
