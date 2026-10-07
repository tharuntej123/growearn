# Security Architecture & Policies

## 1. Authentication & JWT Security

### Runtime Secret Validation
- `JWT_SECRET` is required for production operation.
- Minimum secret length of 32 characters is enforced during startup.
- Tokens are signed and verified using `jsonwebtoken` and `jose` (Edge runtime compatible).

### Cookie Configuration
- **HttpOnly**: `true` (Protects authentication tokens from client-side script access).
- **Secure**: `true` in production or HTTPS environments.
- **SameSite**: `lax` (Mitigates CSRF vulnerabilities while enabling navigation).
- **Expiration**: 7-day default validity period.

---

## 2. Role-Based Access Control (RBAC) & Authorization

### System Roles
1. **LEARNER / STUDENT**: Roadmaps, course enrollments, mentorship bookings.
2. **FREELANCER / PROFESSIONAL**: Job discovery, proposal builder, application tracker.
3. **MENTOR**: Course publishing, mentorship requests, revenue telemetry.
4. **COMPANY / EMPLOYER**: Job posting, ATS applicant pipeline, candidate search.
5. **ADMIN**: Platform analytics, user moderation, immutable audit log inspector.

### Server-Side Ownership & IDOR Verification
- **Jobs**: Only the creating company or an admin can edit, close, or view applicants for a job.
- **Applications**: Applicants can only view their own applications; companies can only view applications for their posted jobs.
- **Candidates**: The `/api/candidates` endpoint is restricted to authenticated `COMPANY` and `ADMIN` users.
- **Mentorship Requests**: Only the target mentor can accept or decline a mentorship booking request.
- **Messaging**: Users can only access conversation threads in which they are an active participant.
- **Payments**: Users can only inspect their own payment records; mentors can only view transactions relating to their offerings.

---

## 3. Data Exposure Prevention

- **Password Hashes**: `passwordHash` is never selected by repositories for public or candidate responses.
- **Explicit Prisma Selections**: All candidate, applicant, and user endpoints use explicit `select` blocks to prevent leaking private credentials or internal metadata.

---

## 4. Rate Limiting & Audit Logging

- **Distributed Database Rate Limiting**: Multi-instance rate limiter backed by the PostgreSQL `RateLimit` table (`DatabaseRateLimiter`).
- **Immutable Security Audit Log**: All authentication attempts, administrative mutations, and payment lifecycle events are written to the `AuditLog` table with append-only enforcement.
