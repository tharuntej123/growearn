# Cashfree Marketplace Payment Architecture

## 1. Overview

GroEarn uses **Cashfree Payments (PG API v2023-08-01)** as its sole, production-grade payment gateway. All active legacy Razorpay integrations, packages, and code branches have been completely removed.

### Core Payment Principles:
- **Server-Authoritative Pricing**: The client never specifies the price or currency. Prices are resolved from PostgreSQL (`Course.price` or `MentorProfile.hourlyRate`).
- **Cryptographic Webhook Verification**: All webhook callbacks are validated using HMAC-SHA256 signatures with `x-webhook-signature` and `x-webhook-timestamp` headers, combined with a 5-minute replay attack tolerance window and constant-time string comparison (`crypto.timingSafeEqual`).
- **Idempotent State Reconciliation**: Every webhook delivery and client callback is idempotently processed. Entitlements (`CoursePurchase`, `Enrollment`, `MentorshipBooking`) are unlocked within atomic database transactions with uniqueness constraints to prevent duplicate charges or double enrollments.
- **Genuine Cashfree Refunds**: Refunds are executed directly against Cashfree's `/orders/{order_id}/refunds` endpoint by authorized administrators or instructors only.

---

## 2. Payment Models & State Machine

### Prisma Database Models:
- `PaymentOrder`: Server-initiated order record storing `providerOrderId`, `amount`, `amountInPaise`, `currency`, `idempotencyKey`, and `status`.
- `Payment`: Authoritative transaction record storing `providerOrderId`, `providerPaymentId`, `providerSignature`, `status`, and `refundStatus`.
- `WebhookEvent`: Deduplication ledger storing incoming webhook `eventId` to guarantee exactly-once processing.
- `CoursePurchase`: Immutable record of course purchase associated with the learner and payment.
- `MentorshipBooking`: Booking record linking learner, mentor, and payment.

### Transaction Lifecycle:
```text
[CREATED] (Server generates Cashfree order with trusted DB price)
    │
    ▼
[PENDING] (User interacts with Cashfree Hosted / Web SDK Checkout)
    │
    ├──► [CAPTURED / PAID] (HMAC Webhook or Server API Verification -> Entitlements Unlocked)
    ├──► [FAILED] (Declined or checkout session expired -> Zero access granted)
    └──► [REFUNDED] (Admin/Instructor executes genuine Cashfree refund -> Refund status tracked)
```

---

## 3. Checkout & Payment Flow

1. **User Action**: The learner clicks "Enroll Now" on a paid course or books a mentorship session.
2. **Order Creation (`POST /api/payments/orders`)**:
   - Authenticates session cookie.
   - Retrieves authoritative price from database.
   - Enforces INR currency and positive amount.
   - Pre-persists `PaymentOrder` in PostgreSQL with status `CREATED`.
   - Generates Cashfree order via `https://sandbox.cashfree.com/pg/orders` (or `api.cashfree.com/pg/orders` in production).
   - Receives `payment_session_id` and returns it to the client.
3. **Checkout Execution**:
   - Frontend dynamically loads Cashfree Web JS SDK v3 (`https://sdk.cashfree.com/js/v3/cashfree.js`).
   - Opens official Cashfree checkout modal or redirects to Cashfree hosted checkout.
4. **Authoritative Reconciliation**:
   - Cashfree sends webhook callback to `POST /api/payments/webhook`.
   - In parallel, client redirect returns to `/payments/callback?order_id=...` which triggers `POST /api/payments/verify`.
   - Both pathways resolve through the central, idempotent `PaymentService.verifyAndProcessPayment` / `PaymentService.processWebhook` logic.
   - Entitlements (`CoursePurchase`, `Enrollment`) are granted inside a Prisma transaction if and only if Cashfree confirms the payment is successful.

---

## 4. Cryptographic Webhook Security

Cashfree signs webhook payloads with HMAC-SHA256:
- **Signature Formula**: `Base64(HMAC-SHA256(x-webhook-timestamp + raw_body, CASHFREE_CLIENT_SECRET))`
- **Replay Protection**: The `x-webhook-timestamp` must be within 300 seconds (5 minutes) of server time. Requests with expired timestamps are rejected with HTTP 400.
- **Timing Safe Comparison**: Signatures are compared using `crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature))` to prevent timing side-channel leaks.

---

## 5. Refunds & Revenue Settlement

- **Platform Commission (10%)**: Deducted for platform maintenance and hosting.
- **Mentor Settlement (90%)**: Credited to the mentor's revenue telemetry.
- **Refund Endpoint (`POST /api/payments/refund`)**:
  - Strictly restricted to `ADMIN` users or the course instructor. Learner/buyer self-refunds are forbidden.
  - Submits refund request to Cashfree API (`POST /orders/{order_id}/refunds`).
  - Cashfree returns `PENDING` or `SUCCESS`; the internal payment record updates `refundAmount` and `refundStatus`.

---

## 6. Environment Variables

| Variable | Description | Production Requirement |
| :--- | :--- | :--- |
| `CASHFREE_CLIENT_ID` | Cashfree App ID | Required (e.g. `CF...`) |
| `CASHFREE_CLIENT_SECRET` | Cashfree Secret Key | Required (Never expose to browser) |
| `CASHFREE_ENVIRONMENT` | Gateway Mode | `sandbox` or `production` (Explicit) |
| `CASHFREE_API_VERSION` | Cashfree PG API Version | `2023-08-01` |
| `NEXT_PUBLIC_APP_URL` | Application Public URL | Must be HTTPS in production |
| `PLATFORM_COMMISSION_PERCENT` | Platform Fee % | `10` |

---

## 7. Database Migration & Safety Note

The repository contains an earlier historical migration `prisma/migrations/20261004000000_razorpay_payments`. Per database safety protocols:
- Historical migrations are preserved for schema continuity and migration engine tracking.
- The forward-only migration `prisma/migrations/20261012000000_cashfree_payments_transition` safely renames columns from `razorpayOrderId`, `razorpayPaymentId`, and `razorpaySignature` to `providerOrderId`, `providerPaymentId`, and `providerSignature` using PostgreSQL `DO $$ BEGIN ... ALTER TABLE ... RENAME COLUMN ... END $$;` blocks without dropping any table or losing historical payment records.
