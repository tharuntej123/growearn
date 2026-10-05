# Security Architecture & Policies

## 1. Authentication & JWT Security

### Fail-Closed Secret Enforcement
GroEarn enforces strict runtime secret validation without insecure fallbacks:
- `JWT_SECRET` is required in all environments.
- Missing `JWT_SECRET` or secret length $< 32$ characters throws a fatal startup exception (`FATAL SECURITY ERROR`).
- Client-side bundles never contain `JWT_SECRET`.

### Cookie Policy
- **HttpOnly**: `true` (Prevents XSS token exfiltration).
- **Secure**: `true` in production (`NODE_ENV === 'production'`).
- **SameSite**: `lax` (Guards against CSRF while allowing seamless cross-site navigation).
- **Expiration**: Standard 7-day token lifespan with automatic validation on each request.

---

## 2. Role-Based Access Control (RBAC) & IDOR Protection

### Ecosystem Roles
1. **LEARNER / STUDENT**: Career roadmaps, technical courses, mentorship booking, personal dashboard.
2. **PROFESSIONAL / FREELANCER**: Verified portfolio, job recommendations, proposal submissions, applications.
3. **MENTOR**: Course authoring, 1-on-1 session requests, earnings analytics.
4. **EMPLOYER / COMPANY**: Job postings, applicant pipeline management, candidate matching.
5. **ADMIN**: Platform oversight, moderation, analytics.

### In-Depth IDOR Checks in Handlers
All controllers verify resource ownership explicitly:
- `MentorController.updateRequestStatus`: Verifies `mentorshipRequest.mentor.userId === authUser.id`.
- `JobController.getJobApplications`: Verifies `job.companyId === authUser.id`.
- `JobController.updateApplicationStatus`: Verifies `application.job.companyId === authUser.id`.
- `PaymentService.getPaymentById`: Verifies `payment.userId === authUser.id` (or mentor/admin ownership).
- `CourseController.enroll`: Blocks direct access to paid courses unless an approved `CoursePurchase` exists.

---

## 3. Storage Security & Zero Silent Fallback

- Storage uploads utilize pre-signed URLs or S3/R2/GCS cloud backends.
- In production (`NODE_ENV === 'production'`), if cloud storage credentials fail, the operation throws an explicit error rather than silently writing sensitive documents to local disk.

---

## 4. Rate Limiting & Abuse Prevention
- Critical endpoints (`/api/auth/login`, `/api/auth/register`, `/api/payments/orders`, `/api/mentor/requests`) enforce sliding-window rate limiting backed by PostgreSQL `RateLimit` storage.
- High-volume brute-force attacks are throttled with HTTP 429 Too Many Requests.
