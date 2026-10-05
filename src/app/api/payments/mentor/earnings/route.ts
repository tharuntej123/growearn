import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { PaymentService } from '@/services/payment/payment.service';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return apiError('Authentication required to view mentor earnings', 'UNAUTHORIZED', 401);
    }

    if (user.role !== 'MENTOR' && user.role !== 'ADMIN') {
      return apiError('Forbidden: Only mentors can access earnings telemetry', 'FORBIDDEN', 403);
    }

    const earnings = await PaymentService.getMentorEarnings(user.userId);
    return apiSuccess(earnings);
  } catch (error: any) {
    console.error('[MentorEarnings:Error]', error);
    return apiError(error.message || 'Failed to retrieve mentor earnings', 'EARNINGS_FETCH_ERROR', 500);
  }
}
