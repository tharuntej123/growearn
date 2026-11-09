# Architectural & Security Decisions Log

## Decision 1: Candidate PII & Discoverability (Approved)
- Profiles default `isDiscoverable: false` (opt-in only).
- Candidate search and resume downloads require admin-verified `COMPANY` or `ADMIN` roles.
- All candidate queries are recorded in `AuditLog`.

## Decision 2: Agent Service Internal Authentication (Approved)
- The Python CrewAI FastAPI service requires `X-Internal-Secret` matching `INTERNAL_SERVICE_KEY`.
- Constant-time string comparison (`hmac.compare_digest`) prevents timing attacks.
- Minimum 32 random characters required; missing key fails startup.

## Decision 3: Rate Limiting Failure Mode (Approved)
- High-risk and cost targets (auth, payments, AI routes) fail-closed (HTTP 503/429) if database/cache is unreachable.
- Low-risk read routes fail-open with in-memory degradation.
- Circuit breaker trips after consecutive failures to protect database connection pools.

## Decision 4: Safe Defaults for Demo Mode
- Production builds (`NODE_ENV === 'production'`) completely disable `/api/demo/session` and demo role switchers.
- In non-production, `ENABLE_DEMO=true` is required and strictly refuses to execute if connected to a production or cloud database.
- `ADMIN` role is blocked from demo session generation.

## Decision 5: Prisma Password Hash Stripping
- A Prisma client `$extends` result transform strips `passwordHash` by default from all user queries unless explicitly selected for password authentication verification.
