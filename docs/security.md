# Security Architecture & Policies

## 1. Authentication & Google OAuth Security

### Exclusive Google OAuth 2.0 / OpenID Connect Provider
- GroEarn operates exclusively with Google OAuth 2.0 with OpenID Connect. Legacy custom JWT issuing, password-based authentication, and email/password registration have been retired.
- Identity tokens (`id_token`) are verified cryptographically using Google's public JWKS certificates (`google-auth-library`), validating issuer (`accounts.google.com`), audience (`GOOGLE_CLIENT_ID`), expiration, and cryptographic signature.
- PKCE (Proof Key for Code Exchange with SHA-256) and cryptographically signed `state` parameters are enforced to prevent authorization code interception and CSRF attacks.

### Runtime Secret Validation
- `AUTH_SECRET` is required for production operation.
- Minimum secret length of 32 characters is strictly enforced during startup and token generation (fail-closed).
- Application-managed sessions are signed using `jose` with `HS256` and backed by the PostgreSQL `Session` table for instantaneous server-side revocation.

### Cookie Configuration
- **Cookie Name**: `groearn_session`
- **HttpOnly**: `true` (Protects session tokens from client-side script access and XSS theft).
- **Secure**: `true` in production or HTTPS environments.
- **SameSite**: `lax` (Mitigates CSRF vulnerabilities while enabling navigation).
- **Expiration**: 7-day default validity period.
- **No LocalStorage**: Tokens are never stored in browser local storage.

### Account Linking & Takeover Prevention
- Silent automatic account linking based solely on email matches is prohibited.
- When an existing GroEarn account matches a Google email that is not yet linked, the user is required to confirm account ownership via a cryptographically signed linking token before provider identity mapping is established in the `Account` table.

---

## 2. Role-Based Access Control (RBAC) & Authorization

### System Roles
1. **LEARNER**: Career roadmaps, course enrollments, mentorship bookings.
2. **FREELANCER**: Job discovery, proposal builder, application tracker.
3. **MENTOR**: Course publishing, mentorship requests, revenue telemetry.
4. **COMPANY**: Job posting, ATS applicant pipeline, candidate search.
5. **ADMIN**: Platform analytics, user moderation, immutable audit log inspector.

### Server-Side Ownership & IDOR Verification
- **Role Invariant**: Google OAuth logins strictly preserve existing database roles and never overwrite them with arbitrary client parameters.
- **Privilege Escalation Guard**: The `ADMIN` role cannot be self-selected via Google OAuth registration or role selection.
- **Jobs**: Only the creating company or an admin can edit, close, or view applicants for a job.
- **Applications**: Applicants can only view their own applications; companies can only view applications for their posted jobs.
- **Candidates**: The `/api/candidates` endpoint is restricted to authenticated `COMPANY` and `ADMIN` users.
- **Mentorship Requests**: Only the target mentor can accept or decline a mentorship booking request.
- **Messaging**: Users can only access conversation threads in which they are an active participant.
- **Payments**: Users can only inspect their own payment records; mentors can only view transactions relating to their offerings.

---

## 3. Data Exposure Prevention

- **Zero Password Storage**: New accounts authenticated via Google OAuth do not store or require passwords. Legacy password hashes are maintained read-only for migration compatibility without being exposed.
- **Explicit Prisma Selections**: All candidate, applicant, and user endpoints use explicit `select` blocks to prevent leaking private credentials or internal metadata.

---

## 4. Rate Limiting & Audit Logging

- **Distributed Database Rate Limiting**: Multi-instance rate limiter backed by the PostgreSQL `RateLimit` table (`DatabaseRateLimiter`).
- **Immutable Security Audit Log**: All authentication attempts, administrative mutations, and payment lifecycle events are written to the `AuditLog` table with append-only enforcement.
