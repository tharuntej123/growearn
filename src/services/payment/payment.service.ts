// Production Marketplace Payment Orchestration Service.

import { prisma } from '@/lib/prisma';
import { MessagingRepository } from '@/repositories/messaging.repository';
import { PaymentProviderName } from './provider.interface';
import { PaymentProviderFactory } from './payment-provider.factory';

export interface CreateOrderResult {
  orderId: string;
  provider: PaymentProviderName;
  providerOrderId: string;
  razorpayOrderId: string; // Backward compatibility alias
  amount: number;
  amountInPaise: number;
  currency: string;
  keyId?: string;
  paymentSessionId?: string;
  checkoutData?: Record<string, any>;
  itemType: 'COURSE' | 'MENTORSHIP';
  itemId: string;
  itemTitle: string;
  receipt: string;
}

export interface VerifyPaymentInput {
  orderId?: string;
  paymentId?: string;
  signature?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  provider?: PaymentProviderName;
  rawBody?: string;
  timestamp?: string;
}

export interface MentorEarningsSummary {
  mentorProfileId: string;
  grossRevenue: number;
  platformFee: number;
  gatewayFee: number;
  commissionPercent: number;
  netEarnings: number;
  currency: string;
  totalSalesCount: number;
  courseSalesCount: number;
  mentorshipSessionCount: number;
  settlementStatus: 'CALCULATED_UNSETTLED' | 'SETTLEMENT_PENDING' | 'SETTLED' | 'SETTLEMENT_FAILED';
  settledAmount: number;
  unsettledAmount: number;
  successfulPayments: Array<{
    id: string;
    provider: string;
    providerPaymentId: string | null;
    razorpayPaymentId: string | null; // Compatibility alias
    amount: number;
    currency: string;
    itemType: string;
    itemTitle: string;
    payerName: string;
    payerEmail: string;
    createdAt: Date;
    status: string;
    settlementStatus: 'CALCULATED' | 'SETTLED';
  }>;
}

export interface ReconciliationItem {
  orderId: string;
  providerOrderId: string;
  provider: string;
  internalStatus: string;
  providerStatus: string;
  internalAmount: number;
  providerAmount?: number;
  internalCurrency: string;
  providerCurrency?: string;
  matched: boolean;
  discrepancies: string[];
}

export interface PaymentReconciliationReport {
  timestamp: string;
  totalChecked: number;
  matchedCount: number;
  mismatchCount: number;
  items: ReconciliationItem[];
}

export interface PaymentHealthResult {
  provider: PaymentProviderName;
  environment: 'sandbox' | 'production';
  apiConfigured: boolean;
  webhookConfigured: boolean;
  productionReady: boolean;
  liveStatus: 'CASHFREE_PRODUCTION_PASS' | 'CASHFREE_PRODUCTION_BLOCKED';
  blockReason?: string;
  endpoint: string;
  apiVersion: string;
  platformCommissionPercent: number;
}


export class PaymentService {
  // Get configured platform commission rate (defaults to 10%).
  public static getPlatformCommissionPercent(): number {
    const raw = process.env.PLATFORM_COMMISSION_PERCENT;
    if (raw && !isNaN(Number(raw))) {
      return Math.max(0, Math.min(100, Number(raw)));
    }
    return 10;
  }

  // Create an order for a paid course purchase.
  // Authoritative price is queried strictly from PostgreSQL.
  public static async createCoursePaymentOrder(
    userId: string,
    courseId: string,
    idempotencyKey?: string,
    providerName?: PaymentProviderName
  ): Promise<CreateOrderResult> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found or unauthenticated');
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { instructor: { select: { id: true, name: true } } },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    if (!course.isPublished) {
      throw new Error('This course is not currently published for purchase');
    }

    // Check if user already owns or is enrolled in the course
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: userId, courseId } },
    });

    if (existingEnrollment) {
      throw new Error('You are already enrolled in this course');
    }

    const price = course.price;
    if (price <= 0) {
      throw new Error('Free courses do not require payment order creation. Use direct enrollment.');
    }

    const provider = PaymentProviderFactory.getProvider(providerName);

    // Idempotency check: if existing pending order with same key exists for user
    if (idempotencyKey) {
      const existingOrder = await prisma.paymentOrder.findUnique({
        where: { idempotencyKey },
      });
      if (existingOrder && existingOrder.userId === userId && existingOrder.status === 'CREATED') {
        const orderNotes = (existingOrder.notes as any) || {};
        return {
          orderId: existingOrder.id,
          provider: (orderNotes.provider as PaymentProviderName) || provider.name,
          providerOrderId: existingOrder.razorpayOrderId,
          razorpayOrderId: existingOrder.razorpayOrderId,
          amount: existingOrder.amount,
          amountInPaise: existingOrder.amountInPaise,
          currency: existingOrder.currency,
          keyId: orderNotes.keyId,
          paymentSessionId: orderNotes.paymentSessionId,
          checkoutData: orderNotes.checkoutData,
          itemType: 'COURSE',
          itemId: course.id,
          itemTitle: course.title,
          receipt: existingOrder.receipt,
        };
      }
    }

    const amountInPaise = Math.round(price * 100);
    const receipt = `rcpt_c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const internalOrderId = `ord_c_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Create authentic order via the configured provider
    const providerOrder = await provider.createOrder({
      orderId: internalOrderId,
      amount: price,
      amountInPaise,
      currency: 'INR',
      receipt,
      customer: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: (user as any).phone || undefined,
      },
      itemType: 'COURSE',
      itemId: course.id,
      itemTitle: course.title,
      notes: {
        userId,
        courseId,
        courseTitle: course.title,
        instructorId: course.instructorId,
        provider: provider.name,
      },
    });

    // Store authoritative internal PaymentOrder record
    const internalOrder = await prisma.paymentOrder.create({
      data: {
        userId,
        razorpayOrderId: providerOrder.providerOrderId,
        amount: price,
        amountInPaise,
        currency: providerOrder.currency || 'INR',
        status: 'CREATED',
        itemType: 'COURSE',
        itemId: courseId,
        idempotencyKey: idempotencyKey || null,
        receipt,
        notes: {
          courseTitle: course.title,
          instructorId: course.instructorId,
          provider: provider.name,
          paymentSessionId: providerOrder.paymentSessionId,
          checkoutData: providerOrder.checkoutData,
        },
      },
    });

    return {
      orderId: internalOrder.id,
      provider: provider.name,
      providerOrderId: providerOrder.providerOrderId,
      razorpayOrderId: providerOrder.providerOrderId,
      amount: price,
      amountInPaise,
      currency: providerOrder.currency || 'INR',
      paymentSessionId: providerOrder.paymentSessionId,
      checkoutData: providerOrder.checkoutData,
      itemType: 'COURSE',
      itemId: course.id,
      itemTitle: course.title,
      receipt,
    };
  }

  // Create an order for a paid 1-on-1 mentorship session.
  // Hourly rate is queried strictly from MentorProfile in PostgreSQL.
  public static async createMentorshipPaymentOrder(
    userId: string,
    mentorProfileId: string,
    params: {
      topic: string;
      message: string;
      scheduledAt: Date | string;
      durationMinutes?: number;
      idempotencyKey?: string;
      providerName?: PaymentProviderName;
    }
  ): Promise<CreateOrderResult> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found or unauthenticated');
    }

    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { id: mentorProfileId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!mentorProfile) {
      throw new Error('Mentor profile not found');
    }

    if (!mentorProfile.isAvailable) {
      throw new Error('This mentor is currently unavailable for new bookings');
    }

    if (mentorProfile.userId === userId) {
      throw new Error('You cannot book a mentorship session with yourself');
    }

    const durationMinutes = params.durationMinutes || 60;
    const hourlyRate = mentorProfile.hourlyRate || 50;
    const price = Number(((hourlyRate * durationMinutes) / 60).toFixed(2));
    const amountInPaise = Math.round(price * 100);
    const receipt = `rcpt_m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const internalOrderId = `ord_m_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const provider = PaymentProviderFactory.getProvider(params.providerName);

    if (params.idempotencyKey) {
      const existingOrder = await prisma.paymentOrder.findUnique({
        where: { idempotencyKey: params.idempotencyKey },
      });
      if (existingOrder && existingOrder.userId === userId && existingOrder.status === 'CREATED') {
        const orderNotes = (existingOrder.notes as any) || {};
        return {
          orderId: existingOrder.id,
          provider: (orderNotes.provider as PaymentProviderName) || provider.name,
          providerOrderId: existingOrder.razorpayOrderId,
          razorpayOrderId: existingOrder.razorpayOrderId,
          amount: existingOrder.amount,
          amountInPaise: existingOrder.amountInPaise,
          currency: existingOrder.currency,
          paymentSessionId: orderNotes.paymentSessionId,
          checkoutData: orderNotes.checkoutData,
          itemType: 'MENTORSHIP',
          itemId: mentorProfile.id,
          itemTitle: `Mentorship: ${mentorProfile.user.name}`,
          receipt: existingOrder.receipt,
        };
      }
    }

    const providerOrder = await provider.createOrder({
      orderId: internalOrderId,
      amount: price,
      amountInPaise,
      currency: 'INR',
      receipt,
      customer: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: (user as any).phone || undefined,
      },
      itemType: 'MENTORSHIP',
      itemId: mentorProfile.id,
      itemTitle: `1-on-1 Mentorship with ${mentorProfile.user.name}`,
      notes: {
        userId,
        mentorProfileId,
        mentorUserId: mentorProfile.userId,
        topic: params.topic,
        scheduledAt: new Date(params.scheduledAt).toISOString(),
        provider: provider.name,
      },
    });

    const internalOrder = await prisma.paymentOrder.create({
      data: {
        userId,
        razorpayOrderId: providerOrder.providerOrderId,
        amount: price,
        amountInPaise,
        currency: providerOrder.currency || 'INR',
        status: 'CREATED',
        itemType: 'MENTORSHIP',
        itemId: mentorProfileId,
        idempotencyKey: params.idempotencyKey || null,
        receipt,
        notes: {
          topic: params.topic,
          message: params.message,
          scheduledAt: new Date(params.scheduledAt).toISOString(),
          durationMinutes,
          mentorUserId: mentorProfile.userId,
          provider: provider.name,
          paymentSessionId: providerOrder.paymentSessionId,
          checkoutData: providerOrder.checkoutData,
        },
      },
    });

    return {
      orderId: internalOrder.id,
      provider: provider.name,
      providerOrderId: providerOrder.providerOrderId,
      razorpayOrderId: providerOrder.providerOrderId,
      amount: price,
      amountInPaise,
      currency: providerOrder.currency || 'INR',
      paymentSessionId: providerOrder.paymentSessionId,
      checkoutData: providerOrder.checkoutData,
      itemType: 'MENTORSHIP',
      itemId: mentorProfile.id,
      itemTitle: `1-on-1 Mentorship with ${mentorProfile.user.name}`,
      receipt,
    };
  }

  // Cryptographically verify payment signature and execute entitlement / booking transaction.
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
    const providerOrderId = input.orderId || input.razorpay_order_id;
    const providerPaymentId = input.paymentId || input.razorpay_payment_id;
    const signature = input.signature || input.razorpay_signature;

    if (!providerOrderId) {
      throw new Error('Order ID is required for payment verification');
    }

    // 1. Lookup existing PaymentOrder
    const order = await prisma.paymentOrder.findUnique({
      where: { razorpayOrderId: providerOrderId },
    });

    if (!order) {
      throw new Error(`Payment order not found for order ${providerOrderId}`);
    }

    if (order.userId !== userId) {
      throw new Error('Unauthorized: Payment order does not belong to the current authenticated user');
    }

    const orderNotes = (order.notes as any) || {};
    const providerName = (input.provider || orderNotes.provider || 'CASHFREE') as PaymentProviderName;
    const provider = PaymentProviderFactory.getProvider(providerName);

    // 2. Verify signature / payment state with provider
    const verification = await provider.verifyPayment({
      providerOrderId,
      providerPaymentId,
      signature,
      rawBody: input.rawBody,
      timestamp: input.timestamp,
    });

    if (!verification.verified || verification.status === 'FAILED') {
      await prisma.payment.upsert({
        where: { razorpayOrderId: providerOrderId },
        update: {
          status: 'FAILED',
          failureReason: verification.failureReason || 'Cryptographic signature / verification failed',
        },
        create: {
          userId,
          razorpayOrderId: providerOrderId,
          razorpayPaymentId: providerPaymentId || null,
          razorpaySignature: signature || null,
          amount: order.amount,
          amountInPaise: order.amountInPaise,
          currency: order.currency,
          status: 'FAILED',
          provider: provider.name,
          itemType: order.itemType,
          itemId: order.itemId,
          failureReason: verification.failureReason || 'Cryptographic signature / verification failed',
        },
      }).catch(() => {});

      throw new Error(`Payment verification failed: ${verification.failureReason || 'Invalid signature'}`);
    }

    // 3. Process Transactionally
    const transactionResult = await prisma.$transaction(async (tx) => {
      // Mark order as PAID
      await tx.paymentOrder.update({
        where: { id: order.id },
        data: { status: 'PAID' },
      });

      // Upsert Payment record
      const payment = await tx.payment.upsert({
        where: { razorpayOrderId: providerOrderId },
        update: {
          status: 'CAPTURED',
          razorpayPaymentId: providerPaymentId || undefined,
          razorpaySignature: signature || undefined,
          provider: provider.name,
        },
        create: {
          orderId: order.id,
          userId,
          razorpayOrderId: providerOrderId,
          razorpayPaymentId: providerPaymentId || null,
          razorpaySignature: signature || null,
          amount: order.amount,
          amountInPaise: order.amountInPaise,
          currency: order.currency,
          status: 'CAPTURED',
          provider: provider.name,
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
        const scheduledAt = orderNotes.scheduledAt ? new Date(orderNotes.scheduledAt) : new Date(Date.now() + 86400000);
        const durationMinutes = orderNotes.durationMinutes || 60;

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

        // Fetch mentor user ID for messaging & notification
        const mentor = await tx.mentorProfile.findUnique({
          where: { id: order.itemId },
          select: { userId: true, user: { select: { name: true } } },
        });

        if (mentor) {
          // Initialize direct conversation
          await MessagingRepository.getOrCreateDirectConversation(mentor.userId, userId).catch(() => {});

          // Notify student
          await tx.notification.create({
            data: {
              userId,
              title: 'Mentorship Session Confirmed! 🤝',
              message: `Your session with ${mentor.user.name} is booked for ${scheduledAt.toLocaleDateString()}.`,
              link: '/learner/dashboard',
              notificationType: 'MENTORSHIP_REQUEST',
            },
          }).catch(() => {});

          // Notify mentor
          await tx.notification.create({
            data: {
              userId: mentor.userId,
              title: 'New Paid Mentorship Booking! 💰',
              message: `A student booked a ${durationMinutes}-min session (₹${order.amount}).`,
              link: '/mentor/dashboard',
              notificationType: 'MENTORSHIP_REQUEST',
            },
          }).catch(() => {});
        }
      }

      return {
        success: true,
        paymentId: payment.id,
        itemType: order.itemType,
        itemId: order.itemId,
        entitlementId,
      };
    }, { timeout: 25000, maxWait: 10000 });

    return transactionResult;
  }

  // Process Provider Webhook Event with strict idempotency and cryptographic signature validation.
  public static async processWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined> | string,
    providerName?: PaymentProviderName
  ): Promise<{ status: string; eventId: string; processed: boolean; error?: string }> {
    // Normalize headers if string signature was passed
    const headersObj: Record<string, string | string[] | undefined> =
      typeof headers === 'string'
        ? { 'x-razorpay-signature': headers }
        : headers;

    // Detect provider from headers or payload
    let targetProviderName: PaymentProviderName = providerName || 'CASHFREE';
    if (headersObj['x-razorpay-signature'] || headersObj['X-Razorpay-Signature']) {
      targetProviderName = 'RAZORPAY';
    } else if (
      headersObj['x-webhook-signature'] ||
      headersObj['X-Webhook-Signature'] ||
      headersObj['x-cashfree-signature']
    ) {
      targetProviderName = 'CASHFREE';
    }

    const provider = PaymentProviderFactory.getProvider(targetProviderName);

    // 1. Cryptographic validation via provider
    const webhookResult = await provider.verifyWebhook(rawBody, headersObj);
    if (!webhookResult.verified) {
      throw new Error(`Invalid ${provider.name} webhook cryptographic signature`);
    }

    const { eventId, eventType, providerOrderId, providerPaymentId, status, rawEvent, failureReason, refundAmount } = webhookResult;

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
            payload: rawEvent,
            status: 'PROCESSED',
            processedAt: new Date(),
          },
          create: {
            eventId,
            eventType,
            payload: rawEvent,
            status: 'PROCESSED',
          },
        });

        if (status === 'CAPTURED' && providerOrderId) {
          const order = await tx.paymentOrder.findUnique({
            where: { razorpayOrderId: providerOrderId },
          });

          if (order) {
            await tx.paymentOrder.update({
              where: { id: order.id },
              data: { status: 'PAID' },
            });

            const payment = await tx.payment.upsert({
              where: { razorpayOrderId: providerOrderId },
              update: {
                status: 'CAPTURED',
                razorpayPaymentId: providerPaymentId || undefined,
                provider: provider.name,
                webhookEventId: eventId,
              },
              create: {
                orderId: order.id,
                userId: order.userId,
                razorpayOrderId: providerOrderId,
                razorpayPaymentId: providerPaymentId || null,
                amount: order.amount,
                amountInPaise: order.amountInPaise,
                currency: order.currency,
                status: 'CAPTURED',
                provider: provider.name,
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
            where: { razorpayOrderId: providerOrderId },
            data: { status: 'FAILED' },
          });

          await tx.payment.updateMany({
            where: { razorpayOrderId: providerOrderId },
            data: {
              status: 'FAILED',
              failureReason: failureReason || 'Payment failed',
              webhookEventId: eventId,
              provider: provider.name,
            },
          });
        } else if (status === 'REFUNDED') {
          if (providerPaymentId) {
            await tx.payment.updateMany({
              where: { razorpayPaymentId: providerPaymentId },
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
    } catch (err: any) {
      await prisma.webhookEvent.upsert({
        where: { eventId },
        update: { status: 'FAILED', errorMessage: err.message },
        create: { eventId, eventType, payload: rawEvent, status: 'FAILED', errorMessage: err.message },
      }).catch(() => {});

      throw err;
    }
  }

  // Aggregate authentic mentor revenue and payments from PostgreSQL records.
  // Calculates gross amount, configurable platform fee (default 10%), and net mentor earnings.
  public static async getMentorEarnings(mentorUserId: string): Promise<MentorEarningsSummary> {
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: mentorUserId },
    });

    if (!mentorProfile) {
      throw new Error('Mentor profile not found for user');
    }

    // 1. Fetch courses instructed by this mentor
    const instructedCourses = await prisma.course.findMany({
      where: { instructorId: mentorUserId },
      select: { id: true, title: true },
    });
    const courseIds = instructedCourses.map((c) => c.id);

    // 2. Query captured payments for mentor offerings (Mentorship bookings + Course purchases)
    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          { mentorProfileId: mentorProfile.id, status: 'CAPTURED' },
          { courseId: { in: courseIds }, status: 'CAPTURED' },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const commissionPercent = this.getPlatformCommissionPercent();
    const grossRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
    const platformFee = Number(((grossRevenue * commissionPercent) / 100).toFixed(2));
    const gatewayFee = 0; // Distinct provider fee, tracked as reported by gateway (independent from promotional assumptions)
    const netEarnings = Number((grossRevenue - platformFee).toFixed(2));

    const courseSalesCount = payments.filter((p) => p.itemType === 'COURSE').length;
    const mentorshipSessionCount = payments.filter((p) => p.itemType === 'MENTORSHIP').length;

    // Distinguish CALCULATED earnings from ACTUALLY_SETTLED transfers
    // Unless Cashfree Marketplace / Easy Split confirms payout, settlement is marked as CALCULATED_UNSETTLED
    const settledPayments = payments.filter((p) => (p.metadata as any)?.settled === true);
    const settledAmount = settledPayments.reduce(
      (acc, p) => acc + (p.amount - Number(((p.amount * commissionPercent) / 100).toFixed(2))),
      0
    );
    const unsettledAmount = netEarnings - settledAmount;
    const settlementStatus: MentorEarningsSummary['settlementStatus'] =
      settledPayments.length === payments.length && payments.length > 0
        ? 'SETTLED'
        : settledPayments.length > 0
        ? 'SETTLEMENT_PENDING'
        : 'CALCULATED_UNSETTLED';

    return {
      mentorProfileId: mentorProfile.id,
      grossRevenue: Number(grossRevenue.toFixed(2)),
      platformFee,
      gatewayFee,
      commissionPercent,
      netEarnings,
      currency: 'INR',
      totalSalesCount: payments.length,
      courseSalesCount,
      mentorshipSessionCount,
      settlementStatus,
      settledAmount: Number(settledAmount.toFixed(2)),
      unsettledAmount: Number(unsettledAmount.toFixed(2)),
      successfulPayments: payments.map((p) => ({
        id: p.id,
        provider: p.provider,
        providerPaymentId: p.razorpayPaymentId,
        razorpayPaymentId: p.razorpayPaymentId,
        amount: p.amount,
        currency: p.currency,
        itemType: p.itemType,
        itemTitle: p.course?.title || (p.itemType === 'MENTORSHIP' ? '1-on-1 Mentorship Session' : 'Platform Item'),
        payerName: p.user.name,
        payerEmail: p.user.email,
        createdAt: p.createdAt,
        status: p.status,
        settlementStatus: (p.metadata as any)?.settled ? 'SETTLED' : 'CALCULATED',
      })),
    };
  }

  // Secure payment record lookup with strict IDOR verification.
  public static async getPaymentById(
    paymentId: string,
    requestingUserId: string,
    requestingUserRole: string
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, instructorId: true } },
        mentorProfile: { select: { id: true, userId: true } },
        order: true,
      },
    });

    if (!payment) {
      throw new Error('Payment record not found');
    }

    if (requestingUserRole === 'ADMIN') {
      return payment;
    }

    // Only buyer or instructor/mentor recipient can view
    const isBuyer = payment.userId === requestingUserId;
    const isInstructor = payment.course?.instructorId === requestingUserId;
    const isMentor = payment.mentorProfile?.userId === requestingUserId;

    if (!isBuyer && !isInstructor && !isMentor) {
      throw new Error('Forbidden: You do not have permission to access this payment record');
    }

    return payment;
  }

  // Production-safe Refund Processing.
  // Executes refund request via Cashfree/Provider API and updates PostgreSQL state.
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

    // IDOR / RBAC Check: Only ADMIN, or the instructor/mentor, or buyer can initiate
    const isBuyer = payment.userId === params.requestingUserId;
    const isInstructor = payment.course?.instructorId === params.requestingUserId;
    const isMentor = payment.mentorProfile?.userId === params.requestingUserId;
    const isAdmin = params.requestingUserRole === 'ADMIN';

    if (!isAdmin && !isInstructor && !isMentor && !isBuyer) {
      throw new Error('Forbidden: Unauthorized to initiate refund for this payment');
    }

    if (payment.status !== 'CAPTURED') {
      throw new Error(`Refund cannot be initiated for payment with status ${payment.status}`);
    }

    if (payment.refundStatus === 'COMPLETED') {
      return {
        success: true,
        refundId: (payment.metadata as any)?.refundId || `rfnd_${payment.id}`,
        paymentId: payment.id,
        amount: payment.refundAmount || payment.amount,
        status: 'ALREADY_REFUNDED',
      };
    }

    const refundAmount =
      params.amount && params.amount > 0 && params.amount <= payment.amount
        ? params.amount
        : payment.amount;

    const refundId = `rfnd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const providerName = (payment.provider || 'CASHFREE') as PaymentProviderName;
    const provider = PaymentProviderFactory.getProvider(providerName);

    // Call provider refund endpoint
    const refundResult = await provider.refundPayment({
      providerOrderId: payment.razorpayOrderId,
      providerPaymentId: payment.razorpayPaymentId || undefined,
      refundAmount,
      refundId,
      refundNote: params.reason || 'GroEarn Course/Mentorship Refund Request',
    });

    // Transactionally update payment status & audit log
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          refundAmount,
          refundStatus: refundResult.status || 'COMPLETED',
          metadata: {
            ...((payment.metadata as any) || {}),
            refundId,
            providerRefundId: refundResult.providerRefundId,
            refundReason: params.reason || 'Refund requested and approved',
            refundedAt: new Date().toISOString(),
          },
        },
      });

      // Revoke or adjust course enrollment if full refund
      if (payment.itemType === 'COURSE' && payment.courseId) {
        await tx.coursePurchase.deleteMany({
          where: { userId: payment.userId, courseId: payment.courseId },
        }).catch(() => {});
        await tx.enrollment.deleteMany({
          where: { studentId: payment.userId, courseId: payment.courseId },
        }).catch(() => {});
      }

      // Record AuditLog
      await tx.auditLog.create({
        data: {
          userId: params.requestingUserId,
          action: 'PAYMENT_REFUNDED',
          resource: `payment:${payment.id}`,
          details: {
            paymentId: payment.id,
            providerOrderId: payment.razorpayOrderId,
            refundAmount,
            refundId,
            providerRefundId: refundResult.providerRefundId,
            reason: params.reason,
          },
        },
      }).catch(() => {});
    });

    return {
      success: true,
      refundId,
      paymentId: payment.id,
      amount: refundAmount,
      status: refundResult.status || 'COMPLETED',
    };
  }

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
        OR: [
          { id: orderIdOrPaymentId },
          { razorpayOrderId: orderIdOrPaymentId },
        ],
      },
      include: { payment: true },
    });

    if (!order) {
      throw new Error(`Payment order not found for identifier ${orderIdOrPaymentId}`);
    }

    const orderNotes = (order.notes as any) || {};
    const providerName = (orderNotes.provider || 'CASHFREE') as PaymentProviderName;
    const provider = PaymentProviderFactory.getProvider(providerName);

    const discrepancies: string[] = [];
    let providerStatus = 'UNKNOWN';
    let providerAmount: number | undefined;
    let providerCurrency: string | undefined;

    try {
      const statusRes = await provider.getOrderStatus(order.razorpayOrderId);
      providerStatus = statusRes.status;
      providerAmount = statusRes.amount;
      providerCurrency = statusRes.currency;

      if (order.status === 'PAID' && statusRes.status !== 'PAID') {
        discrepancies.push(`Status mismatch: DB has ${order.status} but provider reports ${statusRes.status}`);
      } else if (order.status === 'CREATED' && statusRes.status === 'PAID') {
        discrepancies.push(`Status mismatch: DB has CREATED but provider reports PAID`);
      }

      if (Math.abs(order.amount - statusRes.amount) > 0.01) {
        discrepancies.push(`Amount mismatch: DB has ${order.amount} but provider has ${statusRes.amount}`);
      }

      if (order.currency !== statusRes.currency) {
        discrepancies.push(`Currency mismatch: DB has ${order.currency} but provider has ${statusRes.currency}`);
      }
    } catch (err: any) {
      discrepancies.push(`Provider status query: ${err.message}`);
    }

    const matched = discrepancies.length === 0;

    // Audit reconciliation query
    await prisma.auditLog.create({
      data: {
        userId: requestingUserId,
        action: 'PAYMENT_RECONCILIATION_AUDIT',
        resource: `order:${order.id}`,
        details: {
          orderId: order.id,
          providerOrderId: order.razorpayOrderId,
          internalStatus: order.status,
          providerStatus,
          matched,
          discrepancies,
        },
      },
    }).catch(() => {});

    return {
      orderId: order.id,
      providerOrderId: order.razorpayOrderId,
      provider: providerName,
      internalStatus: order.status,
      providerStatus,
      internalAmount: order.amount,
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
      } catch (err: any) {
        items.push({
          orderId: order.id,
          providerOrderId: order.razorpayOrderId,
          provider: 'UNKNOWN',
          internalStatus: order.status,
          providerStatus: 'ERROR',
          internalAmount: order.amount,
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

  // Payment System Configuration & Health Check.
  // Reports provider, environment, API, and webhook readiness WITHOUT exposing secrets.
  public static getPaymentHealth(): PaymentHealthResult {
    const rawProvider = (process.env.PAYMENT_PROVIDER || 'CASHFREE').toUpperCase();
    const provider: PaymentProviderName = rawProvider === 'RAZORPAY' ? 'RAZORPAY' : 'CASHFREE';
    const cf = PaymentProviderFactory.getCashfreeProvider();
    const environment = cf.getEnvironment();
    const apiConfigured = cf.isConfigured();
    const webhookConfigured = Boolean(
      process.env.CASHFREE_CLIENT_SECRET && process.env.CASHFREE_CLIENT_SECRET.trim().length > 0
    );
    const platformCommissionPercent = this.getPlatformCommissionPercent();

    let liveStatus: PaymentHealthResult['liveStatus'] = 'CASHFREE_PRODUCTION_BLOCKED';
    let blockReason: string | undefined = undefined;

    if (environment === 'production') {
      if (!apiConfigured || !webhookConfigured) {
        liveStatus = 'CASHFREE_PRODUCTION_BLOCKED';
        blockReason =
          'Cashfree production credentials (CASHFREE_CLIENT_ID / CASHFREE_CLIENT_SECRET) and live merchant onboarding are pending.';
      } else {
        liveStatus = 'CASHFREE_PRODUCTION_BLOCKED';
        blockReason =
          'Awaiting live production low-value transaction verification on official merchant account.';
      }
    } else {
      liveStatus = 'CASHFREE_PRODUCTION_BLOCKED';
      blockReason =
        'System currently running in SANDBOX mode. Live production mode requires CASHFREE_ENVIRONMENT=production and live merchant credentials.';
    }

    return {
      provider,
      environment,
      apiConfigured,
      webhookConfigured,
      productionReady: Boolean(apiConfigured && webhookConfigured),
      liveStatus,
      blockReason,
      endpoint: cf.getBaseUrl(),
      apiVersion: cf.getApiVersion(),
      platformCommissionPercent,
    };
  }
}

