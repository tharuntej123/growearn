import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PaymentService } from '@/services/payment/payment.service';
import { apiSuccess, apiError } from '@/lib/utils';
import { z } from 'zod';

const createOrderSchema = z.object({
  itemType: z.enum(['COURSE', 'MENTORSHIP']),
  courseId: z.string().optional(),
  mentorProfileId: z.string().optional(),
  topic: z.string().optional(),
  message: z.string().optional(),
  scheduledAt: z.string().optional(),
  durationMinutes: z.number().int().min(15).max(180).optional(),
  idempotencyKey: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError('Authentication required to create a payment order', 'UNAUTHORIZED', 401);
    }

    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message || 'Invalid order parameters', 'VALIDATION_ERROR', 400);
    }

    const { itemType, courseId, mentorProfileId, topic, message, scheduledAt, durationMinutes, idempotencyKey } = parsed.data;

    if (itemType === 'COURSE') {
      if (!courseId) {
        return apiError('courseId is required for COURSE payment order', 'VALIDATION_ERROR', 400);
      }
      const order = await PaymentService.createCoursePaymentOrder(user.userId, courseId, idempotencyKey);
      return apiSuccess(order, 201);
    }

    if (itemType === 'MENTORSHIP') {
      if (!mentorProfileId || !topic || !scheduledAt) {
        return apiError('mentorProfileId, topic, and scheduledAt are required for MENTORSHIP order', 'VALIDATION_ERROR', 400);
      }
      const order = await PaymentService.createMentorshipPaymentOrder(user.userId, mentorProfileId, {
        topic,
        message: message || '',
        scheduledAt,
        durationMinutes: durationMinutes || 60,
        idempotencyKey,
      });
      return apiSuccess(order, 201);
    }

    return apiError('Unsupported itemType', 'INVALID_ITEM_TYPE', 400);
  } catch (error: any) {
    console.error('[PaymentOrder:Create:Error]', error);
    if (error.message?.includes('BLOCKED') || error.message?.includes('NOT CONFIGURED')) {
      return apiError(error.message, 'PAYMENT_GATEWAY_NOT_CONFIGURED', 503);
    }
    return apiError(error.message || 'Failed to create payment order', 'ORDER_CREATION_FAILED', 400);
  }
}
