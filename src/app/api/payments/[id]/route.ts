import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PaymentService } from '@/services/payment/payment.service';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError('Authentication required', 'UNAUTHORIZED', 401);
    }

    const { id } = await params;
    if (!id) {
      return apiError('Payment ID is required', 'VALIDATION_ERROR', 400);
    }

    const payment = await PaymentService.getPaymentById(id, user.userId, user.role);
    return apiSuccess(payment);
  } catch (error: any) {
    console.error('[PaymentDetail:Error]', error);
    if (error.message?.includes('Forbidden')) {
      return apiError(error.message, 'FORBIDDEN', 403);
    }
    if (error.message?.includes('not found')) {
      return apiError(error.message, 'NOT_FOUND', 404);
    }
    return apiError(error.message || 'Failed to fetch payment details', 'PAYMENT_FETCH_ERROR', 500);
  }
}
