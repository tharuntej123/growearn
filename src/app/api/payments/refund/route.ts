import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PaymentService } from '@/services/payment/payment.service';
import { apiSuccess, apiError } from '@/lib/utils';
import { z } from 'zod';

const refundSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  amount: z.number().positive().optional(),
  reason: z.string().max(500).optional(),
});

// Payment Refund Request Endpoint.
// Authenticated refund processing via provider API with audit logging.
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError('Authentication required to request a refund', 'UNAUTHORIZED', 401);
    }

    const body = await req.json();
    const parsed = refundSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message || 'Invalid refund parameters', 'VALIDATION_ERROR', 400);
    }

    const result = await PaymentService.processRefund({
      paymentId: parsed.data.paymentId,
      amount: parsed.data.amount,
      reason: parsed.data.reason,
      requestingUserId: user.userId,
      requestingUserRole: user.role,
    });

    return apiSuccess(result);
  } catch (error: any) {
    console.error('[PaymentRefund:Error]', error);
    if (error.message?.includes('Forbidden')) {
      return apiError(error.message, 'FORBIDDEN', 403);
    }
    if (error.message?.includes('not found')) {
      return apiError(error.message, 'NOT_FOUND', 404);
    }
    return apiError(error.message || 'Refund processing failed', 'REFUND_FAILED', 400);
  }
}
