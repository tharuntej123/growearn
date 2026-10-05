# Razorpay Payment Architecture & Integration

## 1. Overview
GroEarn implements a robust, server-side verified payment processing system designed for Indian Rupee (INR) transactions via Razorpay. It handles paid technical courses and 1-on-1 mentorship bookings with strict transactional entitlements, cryptographic signature verification, idempotent webhook handling, and deterministic mentor revenue allocation.

---

## 2. Payment Models & State Transitions

### Database Schema Models
- `PaymentOrder`: Represents the server-initiated order tied to a user and target entity (Course or MentorProfile).
- `Payment`: Represents the verified captured or failed transaction.
- `WebhookEvent`: Stores incoming Razorpay webhook event IDs for idempotency deduplication.
- `CoursePurchase`: Grants permanent entitlement to a paid course.
- `MentorshipBooking`: Grants confirmed booking and unlocks direct chat between student and mentor.

### State Machine
```text
[CREATED] (Order created with server-computed price)
    │
    ▼
[PENDING] (Awaiting Razorpay checkout response)
    ├──► [CAPTURED / COMPLETED] (Signature or Webhook verified -> Transactional Entitlement)
    ├──► [FAILED] (Declined or checkout expired)
    └──► [REFUNDED] (Refund processed by admin/mentor)
```

---

## 3. Server-Authoritative Order Creation
The client never controls product pricing or payment amount.
- **Endpoint**: `POST /api/payments/orders`
- **Payload**:
  ```json
  {
    "type": "COURSE" | "MENTORSHIP",
    "courseId": "string (optional)",
    "mentorProfileId": "string (optional)",
    "topic": "string (optional)",
    "sessionDate": "string (optional)",
    "sessionDuration": 60
  }
  ```
- **Server Execution**:
  1. Authenticates requesting user from JWT session.
  2. Queries PostgreSQL database for authoritative price (e.g. `course.price` or `mentorProfile.hourlyRate`).
  3. Validates that course or mentor offering is active.
  4. Generates internal order (`ORD_...`) and calls Razorpay Orders API with amount in paise (`price * 100`).
  5. Returns only public key ID, order ID, amount, and currency to client.

---

## 4. Cryptographic Signature Verification
Both checkout return callbacks and webhook events are validated using HMAC-SHA256:

### Checkout Verification:
```ts
const generatedSignature = crypto
  .createHmac('sha256', razorpayKeySecret)
  .update(`${razorpayOrderId}|${razorpayPaymentId}`)
  .digest('hex');

const isValid = crypto.timingSafeEqual(
  Buffer.from(generatedSignature, 'utf-8'),
  Buffer.from(razorpaySignature, 'utf-8')
);
```

### Webhook Verification:
- Verifies `x-razorpay-signature` against raw request payload and `RAZORPAY_WEBHOOK_SECRET`.
- Non-matching signatures return `400 Invalid signature` immediately.

---

## 5. Idempotent Webhook Processing
- **Endpoint**: `POST /api/payments/webhook`
- Webhook events (`order.paid`, `payment.captured`, `payment.failed`) carry unique `event.id`.
- Duplicate event IDs are recorded in `WebhookEvent` table with unique constraint.
- If an event is received multiple times, the transaction returns `{ success: true, duplicate: true }` without re-executing entitlement logic.

---

## 6. Mentor Revenue Calculation
Platform fees are calculated deterministically on the server:
- **Gross Amount**: Amount paid by student.
- **Platform Fee (10%)**: Deducted for infrastructure, payment processing, and hosting.
- **Net Mentor Earning (90%)**: Credited to mentor's available balance upon successful capture.
- **Mentor Analytics Endpoint**: `GET /api/payments/mentor/earnings` (Protected, requires MENTOR role).

---

## 7. Configuration & Environment Variables
```env
# Razorpay Credentials
RAZORPAY_KEY_ID="rzp_test_..."
RAZORPAY_KEY_SECRET="your_razorpay_secret"
RAZORPAY_WEBHOOK_SECRET="your_webhook_secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_..."
```
If credentials are not configured, test runners and live endpoints fail gracefully with explicit blocked status rather than fabricating success.
