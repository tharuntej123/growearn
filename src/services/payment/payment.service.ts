// Production Cashfree Marketplace Payment Orchestration Service.

import { prisma } from '@/lib/prisma';
import { PaymentProviderName } from './provider.interface';
import { PaymentProviderFactory } from './payment-provider.factory';
import { PaymentRefundService } from './payment-refund.service';
import { PaymentReconciliationService } from './payment-reconciliation.service';
import { PaymentOrderService } from './payment-order.service';
import { PaymentWebhookService } from './payment-webhook.service';
import { PaymentVerificationService } from './payment-verification.service';

export interface CreateOrderResult {
  orderId: string;
  provider: PaymentProviderName;
  providerOrderId: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  paymentSessionId?: string;
  checkoutData?: Record<string, unknown>;
  itemType: 'COURSE' | 'MENTORSHIP';
  itemId: string;
  itemTitle: string;
  receipt: string;
}

export interface VerifyPaymentInput {
  orderId: string;
  paymentId?: string;
  signature?: string;
  rawBody?: string;
  timestamp?: string;
}

export interface MentorEarningsSummary {
  mentorProfileId: string;
  grossRevenue: number;
  platformFee: number;
  gatewayFee: number;
  commissionPercent: number;
  netEarnings: number;
  currency: string;
  totalSalesCount: number;
  courseSalesCount: number;
  mentorshipSessionCount: number;
  settlementStatus: 'CALCULATED_UNSETTLED' | 'SETTLEMENT_PENDING' | 'SETTLED' | 'SETTLEMENT_FAILED';
  settledAmount: number;
  unsettledAmount: number;
  successfulPayments: Array<{
    id: string;
    provider: string;
    providerPaymentId: string | null;
    amount: number;
    currency: string;
    itemType: string;
    itemTitle: string;
    payerName: string;
    payerEmail: string;
    createdAt: Date;
    status: string;
    settlementStatus: 'CALCULATED' | 'SETTLED';
  }>;
}

export interface ReconciliationItem {
  orderId: string;
  providerOrderId: string;
  provider: string;
  internalStatus: string;
  providerStatus: string;
  internalAmount: number;
  providerAmount?: number;
  internalCurrency: string;
  providerCurrency?: string;
  matched: boolean;
  discrepancies: string[];
}

export interface PaymentReconciliationReport {
  timestamp: string;
  totalChecked: number;
  matchedCount: number;
  mismatchCount: number;
  items: ReconciliationItem[];
}

export interface PaymentHealthResult {
  provider: PaymentProviderName;
  environment: 'sandbox' | 'production';
  apiConfigured: boolean;
  webhookConfigured: boolean;
  productionReady: boolean;
  liveStatus: 'CASHFREE_PRODUCTION_PASS' | 'CASHFREE_PRODUCTION_BLOCKED';
  blockReason?: string;
  endpoint: string;
  apiVersion: string;
  platformCommissionPercent: number;
}

export class PaymentService {
  // Get configured platform commission rate (defaults to 10%).
  public static getPlatformCommissionPercent(): number {
    const raw = process.env.PLATFORM_COMMISSION_PERCENT;
    if (raw && !isNaN(Number(raw))) {
      return Math.max(0, Math.min(100, Number(raw)));
    }
    return 10;
  }

    // Create an order for a paid course purchase.
  // Authoritative price is queried strictly from PostgreSQL.
  public static async createCoursePaymentOrder(
    userId: string,
    courseId: string,
    idempotencyKey?: string
  ): Promise<CreateOrderResult> {
    return PaymentOrderService.createCoursePaymentOrder(userId, courseId, idempotencyKey);
  }

  // Create an order for a paid 1-on-1 mentorship session.
  // Hourly rate is queried strictly from MentorProfile in PostgreSQL.
  public static async createMentorshipPaymentOrder(
    userId: string,
    mentorProfileId: string,
    params: {
      topic: string;
      message: string;
      scheduledAt: Date | string;
      durationMinutes?: number;
      idempotencyKey?: string;
    }
  ): Promise<CreateOrderResult> {
    return PaymentOrderService.createMentorshipPaymentOrder(userId, mentorProfileId, params);
  }

  // Cryptographically verify payment status with Cashfree server API and deliver CoursePurchase / Mentorship entitlements.
  public static async verifyPayment(
    userId: string,
    input: VerifyPaymentInput
  ) {
    return PaymentVerificationService.verifyAndProcessPayment(userId, input);
  }

  // Cryptographically verify payment status with Cashfree server API and execute transaction.
  public static async verifyAndProcessPayment(
    userId: string,
    input: VerifyPaymentInput
  ): Promise<{
    success: boolean;
    paymentId: string;
    itemType: string;
    itemId: string;
    entitlementId: string;
  }> {
    return PaymentVerificationService.verifyAndProcessPayment(userId, input);
  }

  // Real Cashfree Webhook Verification & Idempotent Event Processing with idempotencyKey and ALREADY_PROCESSED guard.
  public static async processWebhook(
    rawBody: string,
    headers: Record<string, string | string[] | undefined>
  ): Promise<{ status: string; eventId: string; processed: boolean; error?: string }> {
    return PaymentWebhookService.processWebhook(rawBody, headers);
  }

  // Aggregate authentic mentor revenue and payments from PostgreSQL records.
  public static async getMentorEarnings(mentorUserId: string): Promise<MentorEarningsSummary> {
    const mentorProfile = await prisma.mentorProfile.findUnique({
      where: { userId: mentorUserId },
    });

    if (!mentorProfile) {
      throw new Error('Mentor profile not found for user');
    }

    const instructedCourses = await prisma.course.findMany({
      where: { instructorId: mentorUserId },
      select: { id: true, title: true },
    });
    const courseIds = instructedCourses.map((c) => c.id);

    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          { mentorProfileId: mentorProfile.id, status: 'CAPTURED' },
          { courseId: { in: courseIds }, status: 'CAPTURED' },
        ],
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const commissionPercent = this.getPlatformCommissionPercent();
    const grossRevenuePaise = payments.reduce(
      (acc, p) => acc + (p.amountInPaise || Math.round(Number(p.amount) * 100)),
      0
    );
    const platformFeePaise = Math.round((grossRevenuePaise * commissionPercent) / 100);
    const gatewayFeePaise = 0;
    const netEarningsPaise = grossRevenuePaise - platformFeePaise;

    const grossRevenue = grossRevenuePaise / 100;
    const platformFee = platformFeePaise / 100;
    const gatewayFee = gatewayFeePaise / 100;
    const netEarnings = netEarningsPaise / 100;

    const courseSalesCount = payments.filter((p) => p.itemType === 'COURSE').length;
    const mentorshipSessionCount = payments.filter((p) => p.itemType === 'MENTORSHIP').length;

    const settledPayments = payments.filter((p) => (p.metadata as Record<string, unknown>)?.settled === true);
    const settledAmountPaise = settledPayments.reduce((acc, p) => {
      const itemPaise = p.amountInPaise || Math.round(Number(p.amount) * 100);
      const itemFeePaise = Math.round((itemPaise * commissionPercent) / 100);
      return acc + (itemPaise - itemFeePaise);
    }, 0);
    const settledAmount = settledAmountPaise / 100;
    const unsettledAmount = (netEarningsPaise - settledAmountPaise) / 100;
    const settlementStatus: MentorEarningsSummary['settlementStatus'] =
      settledPayments.length === payments.length && payments.length > 0
        ? 'SETTLED'
        : settledPayments.length > 0
        ? 'SETTLEMENT_PENDING'
        : 'CALCULATED_UNSETTLED';

    return {
      mentorProfileId: mentorProfile.id,
      grossRevenue: Number(grossRevenue.toFixed(2)),
      platformFee,
      gatewayFee,
      commissionPercent,
      netEarnings,
      currency: 'INR',
      totalSalesCount: payments.length,
      courseSalesCount,
      mentorshipSessionCount,
      settlementStatus,
      settledAmount: Number(settledAmount.toFixed(2)),
      unsettledAmount: Number(unsettledAmount.toFixed(2)),
      successfulPayments: payments.map((p) => ({
        id: p.id,
        provider: p.provider,
        providerPaymentId: p.providerPaymentId,
        amount: Number(p.amount),
        currency: p.currency,
        itemType: p.itemType,
        itemTitle: p.course?.title || (p.itemType === 'MENTORSHIP' ? '1-on-1 Mentorship Session' : 'Platform Item'),
        payerName: p.user.name,
        payerEmail: p.user.email,
        createdAt: p.createdAt,
        status: p.status,
        settlementStatus: (p.metadata as Record<string, unknown>)?.settled ? 'SETTLED' : 'CALCULATED',
      })),
    };
  }

  // Secure payment record lookup with strict IDOR verification.
  public static async getPaymentById(
    paymentId: string,
    requestingUserId: string,
    requestingUserRole: string
  ) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        course: { select: { id: true, title: true, instructorId: true } },
        mentorProfile: { select: { id: true, userId: true } },
        order: true,
      },
    });

    if (!payment) {
      throw new Error('Payment record not found');
    }

    if (requestingUserRole === 'ADMIN') {
      return payment;
    }

    const isBuyer = payment.userId === requestingUserId;
    const isInstructor = payment.course?.instructorId === requestingUserId;
    const isMentor = payment.mentorProfile?.userId === requestingUserId;

    if (!isBuyer && !isInstructor && !isMentor) {
      throw new Error('Forbidden: You do not have permission to access this payment record');
    }

    return payment;
  }

  // Production-safe Refund Processing delegated to PaymentRefundService.
  public static async processRefund(params: {
    paymentId: string;
    amount?: number;
    reason?: string;
    requestingUserId: string;
    requestingUserRole: string;
  }) {
    return PaymentRefundService.processRefund(params);
  }

  // Admin-safe Payment Reconciliation delegated to PaymentReconciliationService.
  public static async reconcilePayment(
    orderIdOrPaymentId: string,
    requestingUserId: string,
    requestingUserRole: string
  ) {
    return PaymentReconciliationService.reconcilePayment(orderIdOrPaymentId, requestingUserId, requestingUserRole);
  }

  // Admin-safe Batch Reconciliation for recent payments delegated to PaymentReconciliationService.
  public static async reconcileAllRecentPayments(
    limit: number = 20,
    requestingUserId: string,
    requestingUserRole: string
  ) {
    return PaymentReconciliationService.reconcileAllRecentPayments(limit, requestingUserId, requestingUserRole);
  }

  // Payment System Configuration & Health Check.
  // Reports Cashfree environment, API, and webhook readiness WITHOUT exposing secrets.
  public static getPaymentHealth(): PaymentHealthResult {
    const cf = PaymentProviderFactory.getCashfreeProvider();
    const environment = cf.getEnvironment();
    const apiConfigured = cf.isConfigured();
    const webhookConfigured = Boolean(
      process.env.CASHFREE_CLIENT_SECRET && process.env.CASHFREE_CLIENT_SECRET.trim().length > 0
    );
    const platformCommissionPercent = this.getPlatformCommissionPercent();

    let liveStatus: PaymentHealthResult['liveStatus'] = 'CASHFREE_PRODUCTION_BLOCKED';
    let blockReason: string | undefined = undefined;

    if (environment === 'production') {
      if (!apiConfigured || !webhookConfigured) {
        liveStatus = 'CASHFREE_PRODUCTION_BLOCKED';
        blockReason =
          'Cashfree production credentials (CASHFREE_CLIENT_ID / CASHFREE_CLIENT_SECRET) and live merchant onboarding are pending.';
      } else {
        liveStatus = 'CASHFREE_PRODUCTION_BLOCKED';
        blockReason =
          'Awaiting live production transaction verification and owner authorization on official merchant account.';
      }
    } else {
      liveStatus = 'CASHFREE_PRODUCTION_BLOCKED';
      blockReason =
        'System running in SANDBOX mode. Live production mode requires CASHFREE_ENVIRONMENT=production and live merchant credentials.';
    }

    return {
      provider: 'CASHFREE',
      environment,
      apiConfigured,
      webhookConfigured,
      productionReady: Boolean(apiConfigured && webhookConfigured),
      liveStatus,
      blockReason,
      endpoint: cf.getBaseUrl(),
      apiVersion: cf.getApiVersion(),
      platformCommissionPercent,
    };
  }
}
