import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { PaymentProviderFactory } from './payment-provider.factory';

export class PaymentWebhookService {
  // Real Cashfree Webhook Verification & Idempotent Event Processing.
  public static async processWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<{ status: string; eventId: string; processed: boolean; error?: string }> {
    const provider = PaymentProviderFactory.getCashfreeProvider();

    // 1. Cryptographic validation via Cashfree provider
    const webhookResult = await provider.verifyWebhook(rawBody, headers);
    if (!webhookResult.verified) {
      throw new Error('Invalid Cashfree webhook cryptographic signature');
    }

    const { eventId, eventType, providerOrderId, providerPaymentId, status, rawEvent, failureReason, refundAmount, amount } = webhookResult;

    // 2. Strict idempotency check: check if event was already processed
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent && existingEvent.status === 'PROCESSED') {
      return { status: 'ALREADY_PROCESSED', eventId, processed: true };
    }

    try {
      await prisma.$transaction(async (tx) => {
        // Record incoming event
        await tx.webhookEvent.upsert({
          where: { eventId },
          update: {
            eventType,
            payload: rawEvent as Prisma.InputJsonValue,
            status: 'PROCESSED',
            processedAt: new Date(),
          },
          create: {
            eventId,
            eventType,
            payload: rawEvent as Prisma.InputJsonValue,
            status: 'PROCESSED',
          },
        });

        if (status === 'CAPTURED' && providerOrderId) {
          const order = await tx.paymentOrder.findUnique({
            where: { providerOrderId },
          });

          if (order) {
            // Validate amount matches persisted order amount
            if (amount !== undefined && Math.abs(Number(order.amount) - amount) > 0.01) {
              throw new Error(`Webhook amount mismatch: order expects ₹${order.amount}, received ₹${amount}`);
            }

            await tx.paymentOrder.update({
              where: { id: order.id },
              data: { status: 'PAID' },
            });

            const payment = await tx.payment.upsert({
              where: { providerOrderId },
              update: {
                status: 'CAPTURED',
                providerPaymentId: providerPaymentId || undefined,
                provider: 'CASHFREE',
                webhookEventId: eventId,
              },
              create: {
                orderId: order.id,
                userId: order.userId,
                providerOrderId,
                providerPaymentId: providerPaymentId || null,
                amount: order.amount,
                amountInPaise: order.amountInPaise,
                currency: order.currency,
                status: 'CAPTURED',
                provider: 'CASHFREE',
                itemType: order.itemType,
                itemId: order.itemId,
                courseId: order.itemType === 'COURSE' ? order.itemId : null,
                mentorProfileId: order.itemType === 'MENTORSHIP' ? order.itemId : null,
                webhookEventId: eventId,
              },
            });

            if (order.itemType === 'COURSE') {
              await tx.coursePurchase.upsert({
                where: { userId_courseId: { userId: order.userId, courseId: order.itemId } },
                update: { paymentId: payment.id, orderId: order.id, amountPaid: order.amount },
                create: {
                  userId: order.userId,
                  courseId: order.itemId,
                  paymentId: payment.id,
                  orderId: order.id,
                  amountPaid: order.amount,
                  currency: order.currency,
                },
              });

              await tx.enrollment.upsert({
                where: { studentId_courseId: { studentId: order.userId, courseId: order.itemId } },
                update: {},
                create: { studentId: order.userId, courseId: order.itemId, progressPercent: 0 },
              });
            }
          }
        } else if (status === 'FAILED' && providerOrderId) {
          await tx.paymentOrder.updateMany({
            where: { providerOrderId },
            data: { status: 'FAILED' },
          });

          await tx.payment.updateMany({
            where: { providerOrderId },
            data: {
              status: 'FAILED',
              failureReason: failureReason || 'Payment failed',
              webhookEventId: eventId,
              provider: 'CASHFREE',
            },
          });
        } else if (status === 'REFUNDED') {
          if (providerPaymentId) {
            await tx.payment.updateMany({
              where: { providerPaymentId },
              data: {
                status: 'REFUNDED',
                refundAmount: refundAmount || 0,
                refundStatus: 'COMPLETED',
                webhookEventId: eventId,
              },
            });
          }
        }
      }, { timeout: 25000, maxWait: 10000 });

      return { status: 'SUCCESS', eventId, processed: true };
    } catch (_e) {
      const err = _e as Error;
      await prisma.webhookEvent.upsert({
        where: { eventId },
        update: {
          status: 'FAILED',
          errorMessage: err.message,
        },
        create: {
          eventId,
          eventType,
          payload: rawEvent as Prisma.InputJsonValue,
          status: 'FAILED',
          errorMessage: err.message,
        },
      }).catch(() => {});

      return { status: 'FAILED', eventId, processed: false, error: err.message };
    }
  }
}
