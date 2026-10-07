import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/services/payment/payment.service';

// Real Multi-Provider Webhook Verification & Idempotent Event Processing
// Supports:
export async function POST(req: NextRequest) {
  const headersObj: Record<string, string | string[] | undefined> = {};
  req.headers.forEach((val, key) => {
    headersObj[key.toLowerCase()] = val;
  });

  const isCashfree = Boolean(
    headersObj['x-webhook-signature'] ||
    headersObj['x-cashfree-signature']
  );
  const isRazorpay = Boolean(headersObj['x-razorpay-signature']);

  if (!isCashfree && !isRazorpay) {
    return NextResponse.json(
      { error: 'Missing webhook signature header (x-webhook-signature or x-razorpay-signature)' },
      { status: 400 }
    );
  }

  // Fail-closed checks for webhook secret configuration
  if (isCashfree && (!process.env.CASHFREE_CLIENT_SECRET || process.env.CASHFREE_CLIENT_SECRET.trim().length === 0)) {
    return NextResponse.json(
      {
        error: 'LIVE PAYMENT VERIFICATION BLOCKED — CASHFREE_CLIENT_SECRET NOT CONFIGURED',
        status: 'BLOCKED',
      },
      { status: 503 }
    );
  }

  if (isRazorpay && (!process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET.trim().length === 0)) {
    return NextResponse.json(
      {
        error: 'LIVE PAYMENT VERIFICATION BLOCKED — RAZORPAY_WEBHOOK_SECRET NOT CONFIGURED',
        status: 'BLOCKED',
      },
      { status: 503 }
    );
  }

  try {
    const rawBody = await req.text();
    if (!rawBody || rawBody.trim().length === 0) {
      return NextResponse.json({ error: 'Empty webhook payload' }, { status: 400 });
    }

    const result = await PaymentService.processWebhook(
      rawBody,
      headersObj,
      isCashfree ? 'CASHFREE' : 'RAZORPAY'
    );
    return NextResponse.json({ received: true, ...result }, { status: 200 });
  } catch (error: any) {
    console.error('[PaymentWebhook:Error]', error.message);
    if (
      error.message?.includes('Invalid') &&
      error.message?.includes('signature')
    ) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
