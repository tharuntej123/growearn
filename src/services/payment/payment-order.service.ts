import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { PaymentProviderFactory } from './payment-provider.factory';
import { CreateOrderResult } from './payment.service';

export class PaymentOrderService {
  // Create an order for a paid course purchase.
  // Authoritative price is queried strictly from PostgreSQL.
  public static async createCoursePaymentOrder(
    userId: string,
    courseId: string,
    idempotencyKey?: string
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

    const price = Number(course.price);
    if (price <= 0) {
      throw new Error('Free courses do not require payment order creation. Use direct enrollment.');
    }

    const provider = PaymentProviderFactory.getCashfreeProvider();

    // Idempotency check: if existing pending order with same key exists for user
    if (idempotencyKey) {
      const existingOrder = await prisma.paymentOrder.findUnique({
        where: { idempotencyKey },
      });
      if (existingOrder && existingOrder.userId === userId && existingOrder.status === 'CREATED') {
        const orderNotes = (existingOrder.notes as Record<string, unknown>) || {};
        return {
          orderId: existingOrder.id,
          provider: 'CASHFREE',
          providerOrderId: existingOrder.providerOrderId,
          amount: Number(existingOrder.amount),
          amountInPaise: existingOrder.amountInPaise,
          currency: existingOrder.currency,
          paymentSessionId: typeof orderNotes.paymentSessionId === 'string' ? orderNotes.paymentSessionId : undefined,
          checkoutData: (orderNotes.checkoutData as Record<string, unknown>) || undefined,
          itemType: 'COURSE',
          itemId: course.id,
          itemTitle: course.title,
          receipt: existingOrder.receipt,
        };
      }
    }

    const amountInPaise = Math.round(price * 100);
    const receipt = `rcpt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const internalOrderId = `ord_c_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    // 1. Persist initial order record in database with status CREATED
    const internalOrder = await prisma.paymentOrder.create({
      data: {
        userId,
        providerOrderId: internalOrderId,
        amount: price,
        amountInPaise,
        currency: 'INR',
        status: 'CREATED',
        itemType: 'COURSE',
        itemId: course.id,
        idempotencyKey: idempotencyKey || null,
        receipt,
        notes: {
          courseId: course.id,
          instructorId: course.instructorId,
          courseTitle: course.title,
          provider: 'CASHFREE',
        },
      },
    });

    try {
      // 2. Call Cashfree Orders API to create real PG order session
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
          phone: (user as { phone?: string }).phone || undefined,
        },
        itemType: 'COURSE',
        itemId: course.id,
        itemTitle: course.title,
        notes: {
          userId,
          courseId: course.id,
          instructorId: course.instructorId,
          provider: 'CASHFREE',
        },
      });

      // 3. Update order notes with payment session id and checkout payload
      await prisma.paymentOrder.update({
        where: { id: internalOrder.id },
        data: {
          notes: {
            courseId: course.id,
            instructorId: course.instructorId,
            courseTitle: course.title,
            provider: 'CASHFREE',
            paymentSessionId: providerOrder.paymentSessionId,
            checkoutData: providerOrder.checkoutData,
          },
        },
      });

      return {
        orderId: internalOrder.id,
        provider: 'CASHFREE',
        providerOrderId: providerOrder.providerOrderId,
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
    } catch (_e) {
      const err = _e as Error;
      // If Cashfree API fails, update status to FAILED with failure reason
      await prisma.paymentOrder.update({
        where: { id: internalOrder.id },
        data: {
          status: 'FAILED',
          notes: {
            ...((internalOrder.notes as Record<string, unknown>) || {}),
            failureReason: err.message,
          },
        },
      }).catch(() => {});
      throw err;
    }
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
    const hourlyRatePaise = Math.round((Number(mentorProfile.hourlyRate) || 50) * 100);
    const amountInPaise = Math.round((hourlyRatePaise * durationMinutes) / 60);
    const price = amountInPaise / 100;
    const receipt = `rcpt_m_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const internalOrderId = `ord_m_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;

    const provider = PaymentProviderFactory.getCashfreeProvider();

    if (params.idempotencyKey) {
      const existingOrder = await prisma.paymentOrder.findUnique({
        where: { idempotencyKey: params.idempotencyKey },
      });
      if (existingOrder && existingOrder.userId === userId && existingOrder.status === 'CREATED') {
        const orderNotes = (existingOrder.notes as Record<string, unknown>) || {};
        return {
          orderId: existingOrder.id,
          provider: 'CASHFREE',
          providerOrderId: existingOrder.providerOrderId,
          amount: Number(existingOrder.amount),
          amountInPaise: existingOrder.amountInPaise,
          currency: existingOrder.currency,
          paymentSessionId: typeof orderNotes.paymentSessionId === 'string' ? orderNotes.paymentSessionId : undefined,
          checkoutData: (orderNotes.checkoutData as Record<string, unknown>) || undefined,
          itemType: 'MENTORSHIP',
          itemId: mentorProfile.id,
          itemTitle: `Mentorship: ${mentorProfile.user.name}`,
          receipt: existingOrder.receipt,
        };
      }
    }

    // 1. Persist initial order record
    const internalOrder = await prisma.paymentOrder.create({
      data: {
        userId,
        providerOrderId: internalOrderId,
        amount: price,
        amountInPaise,
        currency: 'INR',
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
          provider: 'CASHFREE',
        },
      },
    });

    try {
      // 2. Call Cashfree
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
          phone: (user as { phone?: string }).phone || undefined,
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
          provider: 'CASHFREE',
        },
      });

      // 3. Update order notes with session ID
      await prisma.paymentOrder.update({
        where: { id: internalOrder.id },
        data: {
          notes: {
            topic: params.topic,
            message: params.message,
            scheduledAt: new Date(params.scheduledAt).toISOString(),
            durationMinutes,
            mentorUserId: mentorProfile.userId,
            provider: 'CASHFREE',
            paymentSessionId: providerOrder.paymentSessionId,
            checkoutData: providerOrder.checkoutData,
          },
        },
      });

      return {
        orderId: internalOrder.id,
        provider: 'CASHFREE',
        providerOrderId: providerOrder.providerOrderId,
        amount: price,
        amountInPaise,
        currency: providerOrder.currency || 'INR',
        paymentSessionId: providerOrder.paymentSessionId,
        checkoutData: providerOrder.checkoutData,
        itemType: 'MENTORSHIP',
        itemId: mentorProfile.id,
        itemTitle: `Mentorship: ${mentorProfile.user.name}`,
        receipt,
      };
    } catch (_e) {
      const err = _e as Error;
      await prisma.paymentOrder.update({
        where: { id: internalOrder.id },
        data: {
          status: 'FAILED',
          notes: {
            ...((internalOrder.notes as Record<string, unknown>) || {}),
            failureReason: err.message,
          },
        },
      }).catch(() => {});
      throw err;
    }
  }
}
