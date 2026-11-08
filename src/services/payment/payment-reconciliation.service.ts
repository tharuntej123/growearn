import { prisma } from '@/lib/prisma';
import { PaymentProviderFactory } from './payment-provider.factory';
import { ReconciliationItem, PaymentReconciliationReport } from './payment.service';

export class PaymentReconciliationService {
  // Admin-safe Payment Reconciliation.
  // Compares internal PostgreSQL state against official Cashfree API order & payment data.
  public static async reconcilePayment(
    orderIdOrPaymentId: string,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<ReconciliationItem> {
    if (requestingUserRole !== 'ADMIN') {
      throw new Error('Forbidden: Only administrators can execute payment reconciliation');
    }

    const order = await prisma.paymentOrder.findFirst({
      where: {
        OR: [{ id: orderIdOrPaymentId }, { providerOrderId: orderIdOrPaymentId }],
      },
      include: { payment: true },
    });

    if (!order) {
      throw new Error(`Payment order not found for identifier ${orderIdOrPaymentId}`);
    }

    const provider = PaymentProviderFactory.getCashfreeProvider();
    const discrepancies: string[] = [];
    let providerStatus = 'UNKNOWN';
    let providerAmount: number | undefined;
    let providerCurrency: string | undefined;

    try {
      const statusRes = await provider.getOrderStatus(order.providerOrderId);
      providerStatus = statusRes.status;
      providerAmount = statusRes.amount;
      providerCurrency = statusRes.currency;

      if (order.status === 'PAID' && statusRes.status !== 'PAID') {
        discrepancies.push(`Status mismatch: DB has ${order.status} but Cashfree reports ${statusRes.status}`);
      } else if (order.status === 'CREATED' && statusRes.status === 'PAID') {
        discrepancies.push(`Status mismatch: DB has CREATED but Cashfree reports PAID (Reconciliation healing required)`);

        // Automatically heal desynchronized state
        await prisma.$transaction(async (tx) => {
          await tx.paymentOrder.update({
            where: { id: order.id },
            data: { status: 'PAID' },
          });
          const successfulPayment = statusRes.payments?.find((p) => p.status === 'SUCCESS');
          await tx.payment.upsert({
            where: { providerOrderId: order.providerOrderId },
            update: {
              status: 'CAPTURED',
              providerPaymentId: successfulPayment?.paymentId || undefined,
            },
            create: {
              orderId: order.id,
              userId: order.userId,
              providerOrderId: order.providerOrderId,
              providerPaymentId: successfulPayment?.paymentId || null,
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
          if (order.itemType === 'COURSE') {
            await tx.enrollment.upsert({
              where: { studentId_courseId: { studentId: order.userId, courseId: order.itemId } },
              update: {},
              create: { studentId: order.userId, courseId: order.itemId, progressPercent: 0 },
            });
          }
        });
      }

      if (Math.abs(Number(order.amount) - statusRes.amount) > 0.01) {
        discrepancies.push(`Amount mismatch: DB has ₹${order.amount} but Cashfree has ₹${statusRes.amount}`);
      }

      if (order.currency !== statusRes.currency) {
        discrepancies.push(`Currency mismatch: DB has ${order.currency} but Cashfree has ${statusRes.currency}`);
      }
    } catch (_e) {
      const err = _e as Error;
      discrepancies.push(`Cashfree status query error: ${err.message}`);
    }

    const matched = discrepancies.length === 0;

    // Record audit log
    await prisma.auditLog.create({
      data: {
        userId: requestingUserId,
        action: 'PAYMENT_RECONCILED',
        resource: `order:${order.id}`,
        details: {
          orderId: order.id,
          providerOrderId: order.providerOrderId,
          internalStatus: order.status,
          providerStatus,
          matched,
          discrepancies,
        },
      },
    }).catch(() => {});

    return {
      orderId: order.id,
      providerOrderId: order.providerOrderId,
      provider: 'CASHFREE',
      internalStatus: order.status,
      providerStatus,
      internalAmount: Number(order.amount),
      providerAmount,
      internalCurrency: order.currency,
      providerCurrency,
      matched,
      discrepancies,
    };
  }

  // Admin-safe Batch Reconciliation for recent payments.
  public static async reconcileAllRecentPayments(
    limit: number = 20,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<PaymentReconciliationReport> {
    if (requestingUserRole !== 'ADMIN') {
      throw new Error('Forbidden: Only administrators can execute batch reconciliation');
    }

    const recentOrders = await prisma.paymentOrder.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { payment: true },
    });

    const items: ReconciliationItem[] = [];
    for (const order of recentOrders) {
      try {
        const item = await this.reconcilePayment(order.id, requestingUserId, requestingUserRole);
        items.push(item);
      } catch (_e) {
        const err = _e as Error;
        items.push({
          orderId: order.id,
          providerOrderId: order.providerOrderId,
          provider: 'CASHFREE',
          internalStatus: order.status,
          providerStatus: 'ERROR',
          internalAmount: Number(order.amount),
          internalCurrency: order.currency,
          matched: false,
          discrepancies: [err.message],
        });
      }
    }

    const matchedCount = items.filter((i) => i.matched).length;
    const mismatchCount = items.length - matchedCount;

    return {
      timestamp: new Date().toISOString(),
      totalChecked: items.length,
      matchedCount,
      mismatchCount,
      items,
    };
  }
}
