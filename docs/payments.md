# Multi-Provider Payment Architecture

## 1. Overview

GroEarn implements a pluggable multi-provider payment architecture via the `IPaymentProvider` interface and `PaymentProviderFactory`.

Supported Gateways:
- **Cashfree Payments (Primary Marketplace Provider)**: Official PG API (v2023-08-01) with sandbox and production environments.
- **Razorpay SDK (Alternate Gateway)**: Server-side order creation and HMAC-SHA256 signature verification.

---

## 2. Payment Models & State Machine

### Prisma Database Models
- `PaymentOrder`: Server-initiated order record tied to a user and target entity (`Course` or `MentorProfile`).
- `Payment`: Verified captured or failed transaction.
- `WebhookEvent`: Recorded incoming webhook event IDs for idempotent deduplication.
- `CoursePurchase`: Grants permanent entitlement to a paid technical course.
- `MentorshipBooking`: Grants confirmed booking and unlocks real-time 1-on-1 direct messaging.

### Transaction Lifecycle
```text
[CREATED] (Order created with server-computed price)
    │
    ▼
[PENDING] (Awaiting user checkout completion)
    ├──► [CAPTURED] (Signature or Webhook verified -> Transactional Entitlement Unlocked)
    ├──► [FAILED] (Declined or checkout expired)
    └──► [REFUNDED] (Refund processed via /api/payments/refund)
```

---

## 3. Server-Authoritative Order Creation

The client never provides or controls the monetary price:
- **Endpoint**: `POST /api/payments/orders`
- **Server Execution**:
  1. Authenticates requesting user from session cookie.
  2. Queries PostgreSQL database for authoritative price (`course.price` or `mentorProfile.hourlyRate`).
  3. Creates internal `PaymentOrder` record.
  4. Calls Cashfree / Razorpay to generate `payment_session_id` or provider order ID.
  5. Returns session credentials to frontend for checkout initialization.

---

## 4. Cryptographic Verification & Replay Protection

### Cashfree Webhook Verification:
- Validates `x-webhook-signature` (HMAC-SHA256 base64) against raw request body and `CASHFREE_CLIENT_SECRET`.
- **Replay Attack Window**: Rejects webhooks with timestamps older than 5 minutes ($300\text{s}$).
- **Constant-Time Comparison**: Employs `crypto.timingSafeEqual` to eliminate timing side-channel attacks.

### Razorpay Verification:
- Validates `x-razorpay-signature` against raw payload and `RAZORPAY_WEBHOOK_SECRET`.

---

## 5. Idempotent Webhook Processing

- Duplicate webhook events are detected via unique database constraints on `WebhookEvent.eventId`.
- If an event is re-delivered, the handler returns immediately without re-granting duplicate entitlements or re-crediting balances.

---

## 6. Mentor Revenue Calculation & Refunds

- **Platform Commission (10%)**: Deducted for platform maintenance and hosting.
- **Mentor Settlement (90%)**: Credited to the instructor or mentor's net earnings ledger.
- **Mentor Earnings Endpoint**: `GET /api/payments/mentor/earnings` (Protected, requires `MENTOR` role).
- **Refunds Endpoint**: `POST /api/payments/refund` (Protected, supports full or partial refunds with role validation and audit logs).
- **Health Check Endpoint**: `GET /api/health/payment` (Reports gateway configuration readiness without exposing credentials).
