# GrowEarn Production Audit Baseline

**Date:** November 8, 2026  
**Auditor:** Senior Full-Stack & Applied-AI Engineer  
**Branch:** `hardening/production`  
**Base Commit:** `2240f7bc93d3efba201bbe848d4dc3ba014df332`  

---

## 1. Static & Runtime Baseline Metrics

| Verification Check | Command | Exit Code | Result | Notes |
| :--- | :--- | :---: | :---: | :--- |
| **Strict Typecheck** | `npm run typecheck` | 0 | **PASS** | 0 TypeScript compilation errors |
| **ESLint Check** | `npm run lint` | 0 | **PASS** | 0 errors, 0 warnings (`--max-warnings 0`) |
| **Master Integration Suite** | `npm test` | 0 | **PASS** | 76/76 unit & security integration tests passed |
| **CrewAI Python Tests** | `pytest agents/tests -v` | 0 | **PASS** | 7/7 tests passed in 4.78s |
| **Agentic Roadmap Tests** | `npm run test:agentic` | 0 | **PASS** | 14/14 tests passed |
| **LangChain RAG Tests** | `npm run test:langchain` | 0 | **PASS** | 14/14 tests passed |
| **Hybrid Search & RRF Tests** | `npm run test:hybrid` | 0 | **PASS** | 7/7 tests passed |
| **AI Rate-Limiting Tests** | `npm run test:rate-limit` | 0 | **PASS** | 5/5 tests passed |
| **Production Build** | `npm run build` | 0 | **PASS** | 81/81 pages prerendered with standalone bundle |
| **Audit Harness** | `npm run verify:all` | 0 | **PASS** | 96 PASS / 0 FAIL / 1 UNVERIFIED |
| **Security Dependency Audit** | `npm audit` | 1 | **FAIL** | 16 vulnerabilities (8 moderate, 7 high, 1 critical) |

---

## 2. Identified Vulnerabilities & Deficiencies

### Critical Vulnerabilities (C1 – C8)
- **C1: Password Hash & Email Leakage:** Unfiltered Prisma includes (`company: { include: { profile: true } }`, `user: { include: { ... } }`) in `job.controller.ts` (lines 104-117) and `mentor.controller.ts` (lines 90-116) return entire `User` database rows including `passwordHash`.
- **C2: Demo Login Privilege Escalation:** `src/app/api/demo/session/route.ts` creates valid sessions for any role (including `ADMIN`) when `APP_ENV !== 'production'`.
- **C3: Google OAuth Broken Callback & Admin Bootstrap:** Redirect URI defaults to non-existent `/api/auth/callback/google` while `/api/auth/google/callback` 308-redirects to it; `AuthController.googleCallback` is unwired. Seeded admin lacks password, precluding admin login.
- **C4: Vulnerable Dependencies:** `next` 16.3.4 (Critical CVE in ImageResponse/OG), `zod`, `sharp`, `source-map-js`, `brace-expansion`, `deepmerge-ts` / `prisma`.
- **C5: Payment Entitlement Asymmetry:** Webhook only fulfills `COURSE` purchases; `MENTORSHIP` orders are marked `PAID` without booking creation. Webhook returns HTTP 200 on internal failure, preventing gateway retries.
- **C6: Email Trust & Pre-Hijack:** Accounts start with `isVerified: true` without verification; unverified email linking allows account takeover.
- **C7: OAuth State CSRF:** `oauth.service.ts` validates state token against itself without comparing the HttpOnly state cookie.
- **C8: Unauthenticated Agents Microservice & Secret Defaults:** Python microservice runs without `X-Internal-Secret` in non-prod; `env.ts` plants default secrets.

### High Priority Security & Architectural Items (H1 – H14)
- **H1:** Rate limiting missing on 62 of 73 routes; client IP fallback to `127.0.0.1`; audit log stores raw `x-forwarded-for`.
- **H2:** Uncapped password lengths (DoS risk on `scrypt`); timing leakage on user existence; lack of admin TOTP MFA.
- **H3:** Candidate directory and resume chunks accessible to self-registered `COMPANY` without admin verification.
- **H4:** Unenrolled users can access full lesson bodies and video URLs.
- **H5:** Missing role boundaries on mentor creation, applications to closed jobs, lack of job/course PATCH/DELETE.
- **H6:** Unrestricted messaging genesis, email leaks in conversation list, unbounded message length.
- **H7:** Missing input validation (pagination `limit`/`offset` unbounded, free-text skills creation).
- **H8:** File upload buffering memory DoS, lack of magic byte checking on DOCX, raw storage keys exposed in headers.
- **H9:** CSP with `unsafe-inline` and `unsafe-eval`; missing `Origin` verification on mutating routes.
- **H10:** Error leakage (`err.message` returned to client); unhandled serialization of `Error` objects in logger.
- **H11:** Hardcoded fallback DB passwords in `docker-compose.yml`; missing Docker HEALTHCHECK.
- **H12:** Race conditions in refunds; out-of-order webhook events; mentor slot double-booking.
- **H13:** Default ratings defaulted to 4.8 / 4.9 instead of `null` ("New"); fabricated agent traces in fallback mode.
- **H14:** Anonymous AI chat access; prompt injection defense limited to regex deny-list.

### Reliability & Resilience Deficiencies (Phase R)
- Raw `fetch` calls in client components lack error handling (`res.ok`), causing unhandled runtime exceptions.
- Missing `not-found.tsx`, `global-error.tsx`, and route-level `error.tsx` error boundaries.
- Tight coupling between API outputs and frontend consumption without shared Zod schema contracts (`src/contracts/`).

