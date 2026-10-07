// Official Cashfree Payment Provider Implementation (v2023-08-01).

import crypto from 'crypto';
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

export class CashfreePaymentProvider implements IPaymentProvider {
  readonly name: PaymentProviderName = 'CASHFREE';

  private clientId: string;
  private clientSecret: string;
  private environment: 'sandbox' | 'production';
  private apiVersion: string;
  private baseUrl: string;

  constructor() {
    this.clientId = (process.env.CASHFREE_CLIENT_ID || '').trim();
    this.clientSecret = (process.env.CASHFREE_CLIENT_SECRET || '').trim();
    const rawEnv = (process.env.CASHFREE_ENVIRONMENT || 'sandbox').toLowerCase().trim();
    this.environment = rawEnv === 'production' ? 'production' : 'sandbox';
    this.apiVersion = (process.env.CASHFREE_API_VERSION || '2023-08-01').trim();
    
    // Strict environment-to-endpoint resolution
    if (this.environment === 'production') {
      this.baseUrl = 'https://api.cashfree.com/pg';
    } else {
      this.baseUrl = 'https://sandbox.cashfree.com/pg';
    }

    // Critical Startup / Configuration Invariant Assertions
    if (this.environment === 'production' && !this.baseUrl.startsWith('https://api.cashfree.com')) {
      throw new Error(
        'FATAL CONFIGURATION ERROR: Cashfree production environment MUST use official production endpoint https://api.cashfree.com/pg'
      );
    }

    if (this.environment === 'sandbox' && !this.baseUrl.startsWith('https://sandbox.cashfree.com')) {
      throw new Error(
        'FATAL CONFIGURATION ERROR: Cashfree sandbox environment MUST use official sandbox endpoint https://sandbox.cashfree.com/pg'
      );
    }
  }

  public isConfigured(): boolean {
    const isDummy =
      this.clientId.includes('your_cashfree') ||
      this.clientSecret.includes('your_cashfree') ||
      this.clientId.length === 0 ||
      this.clientSecret.length === 0;
    return !isDummy;
  }

  public isProduction(): boolean {
    return this.environment === 'production';
  }

  public getEnvironment(): 'sandbox' | 'production' {
    return this.environment;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getApiVersion(): string {
    return this.apiVersion;
  }

  public getClientId(): string {
    return this.clientId;
  }

  // Validate configuration and enforce fail-closed production readiness.
  public validateConfiguration(): void {
    if (this.environment === 'production') {
      if (!this.isConfigured()) {
        throw new Error(
          'CASHFREE_PRODUCTION_BLOCKED: Cashfree production credentials (CASHFREE_CLIENT_ID / CASHFREE_CLIENT_SECRET) are missing or invalid for live production mode.'
        );
      }
    } else {
      if (!this.clientId || !this.clientSecret) {
        throw new Error(
          'CASHFREE_CREDENTIALS_MISSING: Cashfree credentials (CASHFREE_CLIENT_ID / CASHFREE_CLIENT_SECRET) are not configured.'
        );
      }
    }
  }

  private getHeaders(): Record<string, string> {
    this.validateConfiguration();
    return {
      'x-client-id': this.clientId,
      'x-client-secret': this.clientSecret,
      'x-api-version': this.apiVersion,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  // Create an authentic order on Cashfree Payments API.
  public async createOrder(params: CreateOrderParams): Promise<ProviderOrderResponse> {
    this.validateConfiguration();

    const customerPhone = (params.customer.phone || '9999999999').replace(/[^0-9]/g, '').slice(-10) || '9999999999';

    const orderPayload = {
      order_id: params.orderId,
      order_amount: Number(params.amount.toFixed(2)),
      order_currency: params.currency || 'INR',
      customer_details: {
        customer_id: params.customer.id,
        customer_name: params.customer.name || 'GroEarn Learner',
        customer_email: params.customer.email || 'learner@groearn.com',
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: params.returnUrl || `https://groearn.com/learner/dashboard?order_id={order_id}`,
        notify_url: params.notifyUrl || undefined,
      },
      order_note: `GroEarn: ${params.itemTitle}`,
      order_tags: {
        itemType: params.itemType,
        itemId: params.itemId,
        receipt: params.receipt,
      },
    };

    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(orderPayload),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = responseData.message || responseData.error || response.statusText;
      throw new Error(`Cashfree Order Creation Failed (HTTP ${response.status}): ${errMsg}`);
    }

    return {
      provider: 'CASHFREE',
      providerOrderId: responseData.order_id || params.orderId,
      amount: Number(responseData.order_amount || params.amount),
      amountInPaise: Math.round(Number(responseData.order_amount || params.amount) * 100),
      currency: responseData.order_currency || params.currency || 'INR',
      receipt: params.receipt,
      status: responseData.order_status || 'ACTIVE',
      paymentSessionId: responseData.payment_session_id,
      checkoutData: {
        cfOrderId: responseData.cf_order_id,
        paymentSessionId: responseData.payment_session_id,
        environment: this.environment,
      },
    };
  }

  // Verify an order and payment attempt server-side against Cashfree API.
  public async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    this.validateConfiguration();

    const orderStatus = await this.getOrderStatus(params.providerOrderId);

    if (orderStatus.status === 'PAID') {
      const successfulPayment = orderStatus.payments?.find((p) => p.status === 'SUCCESS');
      return {
        verified: true,
        providerOrderId: params.providerOrderId,
        providerPaymentId: successfulPayment?.paymentId || params.providerPaymentId,
        status: 'CAPTURED',
        amount: orderStatus.amount,
      };
    }

    if (orderStatus.status === 'EXPIRED' || orderStatus.status === 'TERMINATED' || orderStatus.status === 'FAILED') {
      return {
        verified: false,
        providerOrderId: params.providerOrderId,
        status: 'FAILED',
        amount: orderStatus.amount,
        failureReason: `Order status is ${orderStatus.status}`,
      };
    }

    return {
      verified: false,
      providerOrderId: params.providerOrderId,
      status: 'PENDING',
      amount: orderStatus.amount,
    };
  }

  // Cryptographically verify Cashfree Webhook Signature.
  // Cashfree computes signature as:
  // Base64( HMAC_SHA256( timestamp + raw_body, client_secret ) )
  public async verifyWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<VerifyWebhookResult> {
    const signature = (
      headers['x-webhook-signature'] ||
      headers['X-Webhook-Signature'] ||
      headers['x-cashfree-signature']
    ) as string | undefined;

    const timestamp = (
      headers['x-webhook-timestamp'] ||
      headers['X-Webhook-Timestamp']
    ) as string | undefined;

    if (!this.clientSecret || this.clientSecret.length === 0) {
      throw new Error('CASHFREE_CLIENT_SECRET is not configured in the environment.');
    }

    if (!signature || !timestamp) {
      throw new Error('Missing Cashfree webhook verification headers (x-webhook-signature or x-webhook-timestamp)');
    }

    // Verify timestamp to prevent replay attacks (strict 5-minute tolerance)
    const timestampMs = parseInt(timestamp, 10) * (timestamp.length === 10 ? 1000 : 1);
    if (!isNaN(timestampMs)) {
      const now = Date.now();
      const diffMs = Math.abs(now - timestampMs);
      if (diffMs > 5 * 60 * 1000) {
        throw new Error('Cashfree webhook timestamp expired or drifted (5-minute replay tolerance)');
      }
    }

    const payloadToSign = `${timestamp}${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', this.clientSecret)
      .update(payloadToSign)
      .digest('base64');

    let isValid = false;
    try {
      isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch {
      isValid = false;
    }

    if (!isValid) {
      throw new Error('Invalid Cashfree webhook cryptographic signature');
    }

    const parsedEvent = JSON.parse(rawBody);
    const eventType = parsedEvent.type || parsedEvent.event || 'UNKNOWN';
    const eventId = parsedEvent.event_id || parsedEvent.id || `cf_evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const data = parsedEvent.data || {};

    let status: 'CAPTURED' | 'FAILED' | 'REFUNDED' | 'UNKNOWN' = 'UNKNOWN';
    const providerOrderId = data.order?.order_id || data.order_id;
    const providerPaymentId = String(data.payment?.cf_payment_id || data.payment?.payment_id || '');
    const amount = data.payment?.payment_amount || data.order?.order_amount;
    const refundAmount = data.refund?.refund_amount;
    let failureReason: string | undefined;

    if (
      eventType === 'PAYMENT_SUCCESS_WEBHOOK' ||
      eventType === 'ORDER_PAID' ||
      data.payment?.payment_status === 'SUCCESS'
    ) {
      status = 'CAPTURED';
    } else if (
      eventType === 'PAYMENT_FAILED_WEBHOOK' ||
      eventType === 'PAYMENT_USER_DROPPED_WEBHOOK' ||
      data.payment?.payment_status === 'FAILED'
    ) {
      status = 'FAILED';
      failureReason = data.payment?.payment_message || data.error_details?.error_description || 'Payment failed';
    } else if (eventType === 'REFUND_STATUS_WEBHOOK' || data.refund?.refund_status === 'SUCCESS') {
      status = 'REFUNDED';
    }

    return {
      verified: true,
      eventType,
      eventId,
      providerOrderId,
      providerPaymentId,
      status,
      amount,
      refundAmount,
      failureReason,
      rawEvent: parsedEvent,
    };
  }

  // Process refund via Cashfree Refund API.
  public async refundPayment(params: RefundParams): Promise<RefundResult> {
    this.validateConfiguration();

    const refundPayload = {
      refund_amount: Number(params.refundAmount.toFixed(2)),
      refund_id: params.refundId,
      refund_note: params.refundNote || 'GroEarn Course/Mentorship Refund',
      refund_speed: 'STANDARD',
    };

    const response = await fetch(`${this.baseUrl}/orders/${params.providerOrderId}/refunds`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(refundPayload),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errMsg = responseData.message || responseData.error || response.statusText;
      throw new Error(`Cashfree Refund Failed (HTTP ${response.status}): ${errMsg}`);
    }

    return {
      success: true,
      refundId: params.refundId,
      providerRefundId: responseData.cf_refund_id || String(responseData.refund_id || ''),
      status: responseData.refund_status || 'PENDING',
      amount: params.refundAmount,
    };
  }

  // Fetch current order status and payment history from Cashfree API.
  public async getOrderStatus(providerOrderId: string): Promise<PaymentStatusResult> {
    this.validateConfiguration();

    const [orderRes, paymentsRes] = await Promise.all([
      fetch(`${this.baseUrl}/orders/${providerOrderId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      }),
      fetch(`${this.baseUrl}/orders/${providerOrderId}/payments`, {
        method: 'GET',
        headers: this.getHeaders(),
      }).catch(() => null),
    ]);

    if (!orderRes.ok) {
      const errText = await orderRes.text().catch(() => '');
      throw new Error(`Failed to fetch Cashfree order ${providerOrderId} (HTTP ${orderRes.status}): ${errText}`);
    }

    const orderData = await orderRes.json();
    let paymentsList: any[] = [];
    if (paymentsRes && paymentsRes.ok) {
      paymentsList = await paymentsRes.json().catch(() => []);
    }

    const normalizedStatus: PaymentStatusResult['status'] =
      orderData.order_status === 'PAID'
        ? 'PAID'
        : orderData.order_status === 'ACTIVE'
        ? 'ACTIVE'
        : orderData.order_status === 'EXPIRED'
        ? 'EXPIRED'
        : orderData.order_status === 'TERMINATED'
        ? 'TERMINATED'
        : 'UNKNOWN';

    return {
      providerOrderId: orderData.order_id,
      status: normalizedStatus,
      amount: Number(orderData.order_amount || 0),
      currency: orderData.order_currency || 'INR',
      payments: Array.isArray(paymentsList)
        ? paymentsList.map((p) => ({
            paymentId: String(p.cf_payment_id || p.payment_id || ''),
            status: p.payment_status || 'UNKNOWN',
            amount: Number(p.payment_amount || 0),
            paymentTime: p.payment_time,
          }))
        : [],
    };
  }
}

