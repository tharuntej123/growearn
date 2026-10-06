import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PaymentService } from '@/services/payment/payment.service';
import { apiSuccess, apiError } from '@/lib/utils';

/**
 * Admin Payment Reconciliation Endpoint.
 * Compares PostgreSQL database records with authoritative Cashfree provider API state.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError('Authentication required', 'UNAUTHORIZED', 401);
    }

    if (user.role !== 'ADMIN') {
      return apiError('Forbidden: Administrator access required for reconciliation', 'FORBIDDEN', 403);
    }

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));

    if (orderId) {
      const item = await PaymentService.reconcilePayment(orderId, user.userId, user.role);
      return apiSuccess(item);
    }

    const batchReport = await PaymentService.reconcileAllRecentPayments(limit, user.userId, user.role);
    return apiSuccess(batchReport);
  } catch (error: any) {
    console.error('[AdminPaymentReconciliation:Error]', error);
    if (error.message?.includes('Forbidden')) {
      return apiError(error.message, 'FORBIDDEN', 403);
    }
    return apiError(error.message || 'Payment reconciliation failed', 'RECONCILIATION_ERROR', 500);
  }
}
