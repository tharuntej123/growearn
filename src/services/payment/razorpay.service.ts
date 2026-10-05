import crypto from 'crypto';
import Razorpay from 'razorpay';

export interface CreateOrderParams {
  amountInPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export class RazorpayService {
  private static instance: Razorpay | null = null;

  public static isConfigured(): boolean {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    return Boolean(keyId && keySecret && keyId.trim().length > 0 && keySecret.trim().length > 0);
  }

  public static getKeyId(): string {
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId || keyId.trim().length === 0) {
      throw new Error('LIVE PAYMENT VERIFICATION BLOCKED — RAZORPAY TEST OR PRODUCTION CREDENTIALS NOT CONFIGURED');
    }
    return keyId;
  }

  private static getKeySecret(): string {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret || keySecret.trim().length === 0) {
      throw new Error('LIVE PAYMENT VERIFICATION BLOCKED — RAZORPAY TEST OR PRODUCTION CREDENTIALS NOT CONFIGURED');
    }
    return keySecret;
  }

  private static getClient(): Razorpay {
    if (!this.instance) {
      const key_id = this.getKeyId();
      const key_secret = this.getKeySecret();
      this.instance = new Razorpay({
        key_id,
        key_secret,
      });
    }
    return this.instance;
  }

  /**
   * Create an authentic Razorpay order via Razorpay API.
   */
  public static async createOrder(params: CreateOrderParams): Promise<RazorpayOrderResponse> {
    if (!this.isConfigured()) {
      throw new Error('LIVE PAYMENT VERIFICATION BLOCKED — RAZORPAY TEST OR PRODUCTION CREDENTIALS NOT CONFIGURED');
    }

    const client = this.getClient();
    const order = await client.orders.create({
      amount: params.amountInPaise,
      currency: params.currency || 'INR',
      receipt: params.receipt,
      notes: params.notes,
    });

    return {
      id: order.id,
      amount: Number(order.amount),
      currency: order.currency,
      receipt: order.receipt || params.receipt,
      status: order.status,
    };
  }

  /**
   * Cryptographically verify checkout response signature:
   * HMAC_SHA256(order_id + "|" + payment_id, secret) == signature
   */
  public static verifyPaymentSignature(params: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    if (!params.orderId || !params.paymentId || !params.signature) {
      return false;
    }

    try {
      const keySecret = this.getKeySecret();
      const payload = `${params.orderId}|${params.paymentId}`;
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(params.signature, 'utf8')
      );
    } catch {
      return false;
    }
  }

  /**
   * Cryptographically verify incoming Razorpay webhook signature header (X-Razorpay-Signature)
   * HMAC_SHA256(raw_request_body, webhook_secret) == signature
   */
  public static verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret.trim().length === 0) {
      throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured in the environment.');
    }

    if (!signature || signature.trim().length === 0) {
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch {
      return false;
    }
  }
}
