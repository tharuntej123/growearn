import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PaymentService } from '@/services/payment/payment.service';
import { apiSuccess, apiError } from '@/lib/utils';
import { z } from 'zod';

const verifyPaymentSchema = z.object({
  orderId: z.string().optional(),
  order_id: z.string().optional(),
  paymentId: z.string().optional(),
  signature: z.string().optional(),
}).refine(
  (data) => Boolean(data.orderId || data.order_id),
  { message: 'orderId or order_id is required for payment verification' }
);

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError('Authentication required to verify payment', 'UNAUTHORIZED', 401);
    }

    const body = await req.json();
    const parsed = verifyPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message || 'Invalid verification parameters', 'VALIDATION_ERROR', 400);
    }

    const orderId = (parsed.data.orderId || parsed.data.order_id)!.trim();
    const paymentId = parsed.data.paymentId?.trim();
    const signature = parsed.data.signature?.trim();

    const result = await PaymentService.verifyAndProcessPayment(user.userId, {
      orderId,
      paymentId,
      signature,
    });

    return apiSuccess(result);
 } catch (_e) { const error = _e as Error; const err = _e as Error; 
    logger.error('[PaymentVerify:Error]', error);
    return apiError(err.message || 'Payment verification failed', 'VERIFICATION_FAILED', 400);
  }
}
