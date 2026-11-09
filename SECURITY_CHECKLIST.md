# GrowEarn Security & Hardening Checklist

## Phase R: Runtime Reliability & Honest Pipeline
- [ ] **R1:** Reproduce & document all runtime page/console/network errors in `RUNTIME_ERRORS.md`.
- [ ] **R2:** Build typed API client (`src/lib/api-client.ts`), check `res.ok`, add `not-found.tsx`, `global-error.tsx`, and route-level `error.tsx`.
- [ ] **R3:** Implement shared Zod schema contracts (`src/contracts/`) for all API routes.
- [ ] **R4:** Graceful degradation of external dependencies (Ollama, Groq, Tavily, Agents, Cashfree, Redis).
- [ ] **R5:** Honest E2E test suite (real authentication journeys, clean-state & seeded accounts, fail on console errors/5xx).
- [ ] **R6:** Remove `x-mock-user-id` test bypass from production code (`src/lib/auth.ts`).
- [ ] **R7:** Strict ESLint rules (react-hooks, exhaustive-deps error, no any, forbid raw fetch in components).
- [ ] **R8:** Healthcheck ready probe (`/api/health/ready`) and error monitoring.
- [ ] **R9:** Update `CONTRIBUTING.md` with strict definition of done.

## Phase 1: Critical Security Vulnerabilities
- [ ] **C1:** Strip `passwordHash` by default in Prisma client extension; use explicit select allowlists; add regression test against password leakage.
- [ ] **C2:** Restrict/remove demo login route from production; block `ADMIN` role generation without credentials.
- [ ] **C3:** Fix Google OAuth callback route wiring (`/api/auth/google/callback`); implement audited one-time admin bootstrap.
- [ ] **C4:** Upgrade vulnerable dependencies (`next`, `zod`, `sharp`, etc.) to patched versions.
- [ ] **C5:** Implement unified `fulfillOrder(tx, order)` for both course and mentorship purchases; return 5xx on webhook failure.
- [ ] **C6:** Implement signed single-use email verification; enforce `email_verified` on Google accounts; single-use account linking tokens.
- [ ] **C7:** Enforce strict constant-time cryptographic check between OAuth state parameter and HttpOnly state cookie.
- [ ] **C8:** Enforce mandatory `X-Internal-Secret` in Python agents microservice; eliminate hardcoded default secrets in `src/lib/env.ts`.

## Phase 2: High Priority Hardening
- [ ] **H1:** Universal rate-limiting wrapper across all mutating & anonymous endpoints; trusted proxy IP extraction.
- [ ] **H2:** Cap password length at 128 chars; dummy password hash for non-existent users; generic login/register errors.
- [ ] **H3:** Require admin-verified company status before candidate directory access and resume chunk queries.
- [ ] **H4:** Gate lesson bodies and video URLs to enrolled learners, instructors, and admins.
- [ ] **H5:** Enforce role constraints on mentor profile creation; validate job application deadlines; add PATCH/DELETE for jobs & courses.
- [ ] **H6:** Validate conversation participants; remove emails from messaging payloads; cap message lengths at 4000 chars.
- [ ] **H7:** Enforce Zod schemas on all route params/queries/bodies; add shared pagination helper (max 100).
- [ ] **H8:** Enforce upload body size caps before buffering; validate DOCX internal ZIP structures; private bucket signed URLs.
- [ ] **H9:** Modernize CSP in `next.config.ts` (remove `unsafe-inline`/`unsafe-eval`); add Origin checks on mutating routes.
- [ ] **H10:** Central error handler returning sanitized generic messages + request ID; serialize Error objects in logger.
- [ ] **H11:** Hardened `docker-compose.yml` (`${VAR:?}` fatal checks, non-root user, healthcheck).
- [ ] **H12:** Payment refund row-locking / atomic status transitions; prevent mentor slot double-booking.
- [ ] **H13:** Default course/mentor ratings to `null` ("New"); eliminate fabricated agent traces in fallback mode.
- [ ] **H14:** Require authentication for all AI routes; per-user token budgets; treat retrieved chunks as untrusted data.

## Phase 3: Scale to 10,000 Users
- [ ] **M1:** Session tokens hashed in database; short-lived access with rotation; cleanup expired sessions.
- [ ] **M2:** Prisma connection pooling limits, statement timeouts, and short transactions.
- [ ] **M3:** Cache public catalogs with CDN `s-maxage` and `stale-while-revalidate`.
- [ ] **M4:** Summary DTOs for list endpoints; cursor-based pagination.
- [ ] **M5:** Database composite indexes for frequent queries.
- [ ] **M6:** Atomic bulk operations (`createMany`, `$transaction`) to eliminate N+1 queries.
- [ ] **M7:** Job queue integration with `embedding-outbox.ts`.
- [ ] **M8:** Atomic counter increments for post likes and comments.
- [ ] **M9:** Stateless container architecture for horizontal scaling.
- [ ] **M10:** Concurrency limits on CrewAI microservice.

## Phase 4: Quality, Ops, Compliance
- [ ] **M11:** Observability, structured telemetry, request IDs, and incident runbooks.
- [ ] **M12:** Automated dependency auditing & secret scanning in CI.
- [ ] **M13:** Accurate, truthful documentation in `docs/security.md` and `README.md`.
- [ ] **M14:** Compliance endpoints: account deletion, data export, privacy policy, and terms of service.
- [ ] **M15:** Admin account suspension workflow and serialized last-admin check.

## Phase 5: Final Verification & Reporting
- [ ] **V1:** Full automated test suite passes.
- [ ] **V2:** Production build succeeds (`npm run build`).
- [ ] **V3:** Comprehensive verification harness passes (`npm run verify:all`).
- [ ] **V4:** Compile final audit report in `FINAL_REPORT.md`.

