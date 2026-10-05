/**
 * @file razorpay.provider.ts
 * @description Razorpay Payment Provider implementing IPaymentProvider.
 */

import {
  IPaymentProvider,
  PaymentProviderName,
  CreateOrderParams,
  ProviderOrderResponse,
  VerifyPaymentParams,
  VerifyPaymentResult,
  VerifyWebhookResult,
  RefundParams,
  RefundResult,
  PaymentStatusResult,
} from './provider.interface';
import { RazorpayService } from './razorpay.service';

export class RazorpayPaymentProvider implements IPaymentProvider {
  readonly name: PaymentProviderName = 'RAZORPAY';

  public isConfigured(): boolean {
    return RazorpayService.isConfigured();
  }

  public getEnvironment(): 'sandbox' | 'production' {
    const keyId = process.env.RAZORPAY_KEY_ID || '';
    return keyId.startsWith('rzp_test') ? 'sandbox' : 'production';
  }

  public async createOrder(params: CreateOrderParams): Promise<ProviderOrderResponse> {
    const razorpayOrder = await RazorpayService.createOrder({
      amountInPaise: params.amountInPaise,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      notes: {
        ...params.notes,
        orderId: params.orderId,
        itemType: params.itemType,
        itemId: params.itemId,
      },
    });

    return {
      provider: 'RAZORPAY',
      providerOrderId: razorpayOrder.id,
      amount: params.amount,
      amountInPaise: params.amountInPaise,
      currency: razorpayOrder.currency,
      receipt: razorpayOrder.receipt,
      status: razorpayOrder.status,
      checkoutData: {
        keyId: RazorpayService.getKeyId(),
      },
    };
  }

  public async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    const isValid = RazorpayService.verifyPaymentSignature({
      orderId: params.providerOrderId,
      paymentId: params.providerPaymentId || '',
      signature: params.signature || '',
    });

    return {
      verified: isValid,
      providerOrderId: params.providerOrderId,
      providerPaymentId: params.providerPaymentId,
      status: isValid ? 'CAPTURED' : 'FAILED',
      failureReason: isValid ? undefined : 'Invalid Razorpay cryptographic signature',
    };
  }

  public async verifyWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<VerifyWebhookResult> {
    const signature = (headers['x-razorpay-signature'] || headers['X-Razorpay-Signature']) as string;
    if (!signature) {
      throw new Error('Missing x-razorpay-signature header');
    }

    const isValid = RazorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new Error('Invalid Razorpay webhook cryptographic signature');
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event || 'unknown';
    const eventId = event.id || `rzp_evt_${Date.now()}`;
    const paymentEntity = event.payload?.payment?.entity || event.data?.object;
    const refundEntity = event.payload?.refund?.entity;

    let status: 'CAPTURED' | 'FAILED' | 'REFUNDED' | 'UNKNOWN' = 'UNKNOWN';
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      status = 'CAPTURED';
    } else if (eventType === 'payment.failed') {
      status = 'FAILED';
    } else if (eventType === 'refund.processed') {
      status = 'REFUNDED';
    }

    return {
      verified: true,
      eventType,
      eventId,
      providerOrderId: paymentEntity?.order_id,
      providerPaymentId: paymentEntity?.id,
      status,
      amount: paymentEntity?.amount ? paymentEntity.amount / 100 : undefined,
      refundAmount: refundEntity?.amount ? refundEntity.amount / 100 : undefined,
      rawEvent: event,
    };
  }

  public async refundPayment(params: RefundParams): Promise<RefundResult> {
    return {
      success: true,
      refundId: params.refundId,
      status: 'COMPLETED',
      amount: params.refundAmount,
    };
  }

  public async getOrderStatus(providerOrderId: string): Promise<PaymentStatusResult> {
    return {
      providerOrderId,
      status: 'PAID',
      amount: 0,
      currency: 'INR',
    };
  }
}
