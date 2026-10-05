/**
 * @file provider.interface.ts
 * @description Standard PaymentProvider interface for GroEarn live marketplace payments.
 * 
 * Supports:
 * - Cashfree (Production / Sandbox Marketplace Provider)
 * - Razorpay (Alternate Gateway)
 */

export type PaymentProviderName = 'CASHFREE' | 'RAZORPAY';

export interface CreateOrderParams {
  orderId: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  receipt: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  itemType: 'COURSE' | 'MENTORSHIP';
  itemId: string;
  itemTitle: string;
  notes?: Record<string, string>;
  returnUrl?: string;
  notifyUrl?: string;
}

export interface ProviderOrderResponse {
  provider: PaymentProviderName;
  providerOrderId: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  receipt: string;
  status: string;
  paymentSessionId?: string;
  checkoutData?: Record<string, any>;
}

export interface VerifyPaymentParams {
  providerOrderId: string;
  providerPaymentId?: string;
  signature?: string;
  rawBody?: string;
  timestamp?: string;
}

export interface VerifyPaymentResult {
  verified: boolean;
  providerOrderId: string;
  providerPaymentId?: string;
  status: 'CAPTURED' | 'FAILED' | 'PENDING';
  amount?: number;
  failureReason?: string;
}

export interface VerifyWebhookResult {
  verified: boolean;
  eventType: string;
  eventId: string;
  providerOrderId?: string;
  providerPaymentId?: string;
  status: 'CAPTURED' | 'FAILED' | 'REFUNDED' | 'UNKNOWN';
  amount?: number;
  refundAmount?: number;
  failureReason?: string;
  rawEvent: any;
}

export interface RefundParams {
  providerOrderId: string;
  providerPaymentId?: string;
  refundAmount: number;
  refundId: string;
  refundNote?: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  providerRefundId?: string;
  status: string;
  amount: number;
}

export interface PaymentStatusResult {
  providerOrderId: string;
  status: 'PAID' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'FAILED' | 'UNKNOWN';
  amount: number;
  currency: string;
  payments?: Array<{
    paymentId: string;
    status: string;
    amount: number;
    paymentTime?: string;
  }>;
}

export interface IPaymentProvider {
  readonly name: PaymentProviderName;
  isConfigured(): boolean;
  getEnvironment(): 'sandbox' | 'production';
  createOrder(params: CreateOrderParams): Promise<ProviderOrderResponse>;
  verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult>;
  verifyWebhook(rawBody: string, headers: Record<string, string | string[] | undefined>): Promise<VerifyWebhookResult>;
  refundPayment(params: RefundParams): Promise<RefundResult>;
  getOrderStatus(providerOrderId: string): Promise<PaymentStatusResult>;
}
