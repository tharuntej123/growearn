import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/services/payment/payment.service';

// Official Cashfree Payments Webhook Endpoint (v2023-08-01)
// Cryptographic HMAC-SHA256 signature verification & idempotent event processing
export async function POST(req: NextRequest) {
  const headersObj: Record<string, string | string[] | undefined> = {};
  req.headers.forEach((val, key) => {
    headersObj[key.toLowerCase()] = val;
  });

  const signature = headersObj['x-webhook-signature'] || headersObj['x-cashfree-signature'];
  const timestamp = headersObj['x-webhook-timestamp'];

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing Cashfree webhook signature header (x-webhook-signature)' },
      { status: 400 }
    );
  }

  if (!timestamp) {
    return NextResponse.json(
      { error: 'Missing Cashfree webhook timestamp header (x-webhook-timestamp)' },
      { status: 400 }
    );
  }

  // Fail-closed checks for Cashfree client secret configuration
  if (!process.env.CASHFREE_CLIENT_SECRET || process.env.CASHFREE_CLIENT_SECRET.trim().length === 0) {
    return NextResponse.json(
      {
        error: 'LIVE PAYMENT VERIFICATION BLOCKED — CASHFREE_CLIENT_SECRET NOT CONFIGURED',
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

    const result = await PaymentService.processWebhook(rawBody, headersObj);
    return NextResponse.json({ received: true, ...result }, { status: 200 });
  } catch (error: any) {
    console.error('[PaymentWebhook:Error]', error.message);
    if (
      error.message?.includes('Invalid') &&
      error.message?.includes('signature')
    ) {
      return NextResponse.json({ error: 'Invalid Cashfree webhook signature' }, { status: 401 });
    }
    if (error.message?.includes('expired') || error.message?.includes('drifted')) {
      return NextResponse.json({ error: 'Cashfree webhook timestamp expired or drifted' }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || 'Cashfree webhook processing failed' },
      { status: 500 }
    );
  }
}
