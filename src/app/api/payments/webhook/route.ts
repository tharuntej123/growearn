import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

/**
 * Real Stripe Webhook Signature Verification Endpoint
 * 
 * Verifies Stripe cryptographic signature against STRIPE_WEBHOOK_SECRET
 * Handles: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed
 */
export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    return NextResponse.json(
      {
        error: 'Stripe webhook secret is not configured in the environment. Payments are in PARTIALLY IMPLEMENTED status.',
        status: 'PARTIALLY_IMPLEMENTED',
      },
      { status: 501 }
    );
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  try {
    const rawBody = await req.text();

    // Verify Stripe v1 signature: t=timestamp,v1=signature
    const parts = signature.split(',').reduce((acc: Record<string, string>, item) => {
      const [k, v] = item.split('=');
      if (k && v) acc[k.trim()] = v.trim();
      return acc;
    }, {});

    const timestamp = parts['t'];
    const expectedSig = parts['v1'];

    if (!timestamp || !expectedSig) {
      return NextResponse.json({ error: 'Invalid stripe-signature format' }, { status: 400 });
    }

    // Check for replay attacks (tolerance: 5 minutes)
    const timestampSec = parseInt(timestamp, 10);
    const nowSec = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSec - timestampSec) > 300) {
      return NextResponse.json({ error: 'Webhook timestamp outside tolerance window' }, { status: 400 });
    }

    // Compute expected HMAC SHA256 signature
    const signedPayload = `${timestamp}.${rawBody}`;
    const computedSig = crypto.createHmac('sha256', webhookSecret).update(signedPayload).digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSig, 'utf8'),
      Buffer.from(computedSig, 'utf8')
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // Process genuine verified Stripe events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.userId;
        const courseId = session.metadata?.courseId;

        if (userId && courseId) {
          await prisma.enrollment.upsert({
            where: {
              studentId_courseId: { studentId: userId, courseId },
            },
            update: {
              progressPercent: 0,
            },
            create: {
              studentId: userId,
              courseId,
              progressPercent: 0,
            },
          });

          await prisma.notification.create({
            data: {
              userId,
              title: 'Payment Successful! 🎉',
              message: 'Your course enrollment is now active. Start learning now!',
              link: `/courses/${courseId}`,
              notificationType: 'PAYMENT_SUCCESS',
            },
          }).catch(() => {});
        }
        break;
      }

      case 'payment_intent.succeeded': {
        // Handle payment intent succeeded
        break;
      }

      case 'payment_intent.payment_failed': {
        // Handle payment intent failed
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
