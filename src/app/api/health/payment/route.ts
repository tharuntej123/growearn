import { NextResponse } from 'next/server';
import { PaymentService } from '@/services/payment/payment.service';

/**
 * Payment System Health Check Endpoint.
 * Reports environment, provider, and readiness telemetry WITHOUT exposing secrets.
 */
export async function GET() {
  try {
    const health = PaymentService.getPaymentHealth();
    return NextResponse.json(
      {
        status: health.productionReady ? 'HEALTHY' : 'CONFIGURATION_INCOMPLETE',
        health,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'UNHEALTHY',
        error: error.message || 'Payment health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
