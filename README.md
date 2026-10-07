# GroEarn — Career, Talent & Mentorship Ecosystem

> **“Learn. Build Skills. Get Guidance. Earn. Grow. Mentor — All in One.”**

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![pgvector](https://img.shields.io/badge/pgvector-1024--dim-blue?style=flat-square)](https://github.com/pgvector/pgvector)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.4-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Cashfree](https://img.shields.io/badge/Cashfree-v2023--08--01-green?style=flat-square)](https://www.cashfree.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-v2.9-0C2340?style=flat-square&logo=razorpay)](https://razorpay.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Playwright](https://img.shields.io/badge/Playwright-E2E-45ba4b?style=flat-square&logo=playwright)](https://playwright.dev/)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Technology Stack Matrix](#️-technology-stack-matrix)
- [Role Workflows & Capabilities](#-role-workflows--capabilities)
  - [1. 🎓 Learner / Student Experience](#1--learner--student-experience-flow)
  - [2. 💼 Freelancer / Professional Experience](#2--freelancer--professional-experience-flow)
  - [3. 👨‍🏫 Expert Mentor Experience](#3--expert-mentor-experience-flow)
  - [4. 🏢 Company / Employer Experience](#4--company--employer-experience-flow)
  - [5. 🛡️ System Admin Console](#5-️-system-admin-console)
  - [6. 💬 Community Feed & Direct Messaging](#6--community-feed--direct-messaging)
- [Multi-Provider Payment Architecture](#-multi-provider-payment-architecture)
  - [Cashfree Marketplace Integration (v2023-08-01)](#cashfree-marketplace-integration-v2023-08-01)
  - [Razorpay Alternate Gateway](#razorpay-alternate-gateway)
  - [Refunds, Health Telemetry & Payout Settlements](#refunds-health-telemetry--payout-settlements)
- [AI, Semantic Search & pgvector RAG Engine](#-ai-semantic-search--pgvector-rag-engine)
  - [Local BGE-M3 (1024-dim) Embedding Inference](#local-bge-m3-1024-dim-embedding-inference)
  - [Deterministic Multi-Signal Hybrid Scoring](#deterministic-multi-signal-hybrid-scoring)
  - [Zero-Shot Intent Classifier Fallback](#zero-shot-intent-classifier-fallback)
- [Security, Governance & Fail-Closed Policies](#-security-governance--fail-closed-policies)
- [API Route Reference](#-api-route-reference)
- [Environment Configuration (.env)](#-environment-configuration-env)
- [Getting Started Locally](#-getting-started-locally)
- [Automated Verification & Test Suites](#-automated-verification--test-suites)
- [Project Directory Structure](#-project-directory-structure)

---

## 🌟 Overview

**GroEarn** is a production-grade, full-stack talent marketplace and career ecosystem designed to unify the end-to-end professional lifecycle:
1. **Learn:** Discover structured career roadmaps generated from database-backed knowledge.
2. **Build Skills:** Complete interactive courses and track milestone progress.
3. **Get Guidance:** Book 1-on-1 coaching sessions with industry mentors.
4. **Earn:** Discover freelance contracts and full-time jobs with multi-signal semantic matching.
5. **Grow:** Share industry updates, write articles, and network in the community feed.
6. **Mentor & Hire:** Publish technical courses, coach students, post job requisitions, and review candidates via an ATS pipeline.

The platform is engineered with **Next.js 16 (App Router)**, **PostgreSQL + pgvector (`vector(1024)`)**, **Prisma ORM v6**, **Local BGE-M3 vector inference**, **Cashfree Marketplace PG (v2023-08-01)**, **Razorpay alternate payments**, **Groq High-Speed LLM inference**, **multi-instance PostgreSQL rate limiting**, and **zero-trust RBAC**.

---

## 🛠️ Technology Stack Matrix

| Layer | Technology | Implementation & Operational Details |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)** | React 19 Server & Client Components, Turbopack, canonical role-based routing |
| **Styling** | **Tailwind CSS v4** | Modern CSS tokens, emerald/teal design system, fully responsive layouts |
| **UI Primitives** | **Radix UI / Sonner / Lucide** | Accessible UI primitives, Sonner toast notifications, Lucide vector icons |
| **Database** | **PostgreSQL (pg15+)** | Relational integrity, foreign keys, unique constraints, and B-tree indexes |
| **Vector Search Engine** | **pgvector (`vector(1024)`)** | HNSW graph cosine distance indexing on `document_chunks` for grounded semantic retrieval |
| **Vector Embeddings** | **Local BGE-M3 (1024-dim)** | Real 1024-dimensional vector embedding inference via Ollama / local serving layer |
| **LLM Inference** | **Groq API / LangChain** | High-speed LLM inference (Llama 3.3 70B / GPT-OSS 120B) for grounding and AI chat |
| **ORM & Migrations** | **Prisma ORM v6** | Type-safe migrations (`prisma migrate deploy`), transactional queries, preview features |
| **Primary Payment Gateway** | **Cashfree Payments** | Official v2023-08-01 PG API, sandbox/production environments, payment sessions, HMAC-SHA256 signatures, replay attack prevention |
| **Alternate Payment Gateway** | **Razorpay SDK** | Server-side order creation, HMAC-SHA256 signature verification, idempotent webhooks |
| **Authentication & RBAC** | **Stateless JWT & Bcrypt** | Fail-closed runtime validation, HttpOnly Secure SameSite cookies, Zero-Trust RBAC |
| **Rate Limiting** | **PostgreSQL DatabaseRateLimiter** | Multi-instance distributed rate limiting backed by PostgreSQL `RateLimit` table |
| **Object Storage** | **Multi-Provider Storage Engine** | Unified local disk storage and S3 / Cloudflare R2 cloud storage with signed URLs |
| **Schema Validation** | **Zod v3** | Strict runtime schema validation across all API endpoints, controllers, and models |
| **Testing & Verification** | **Master TSX Suite & Playwright** | 13 test suites (47/47 assertions), Cashfree suite (21/21), RAG proof, load benchmarks, E2E specs |

---

## 🚀 Role Workflows & Capabilities

```
                  ┌───────────────────────────────────────────────────────────┐
                  │                 Canonical Edge Middleware                 │
                  │   (Fail-Closed JWT Secret, Role-Based Access Control)     │
                  └─────────────────────────────┬─────────────────────────────┘
                                                │
         ┌──────────────────┬───────────────────┼───────────────────┬──────────────────┐
         ▼                  ▼                   ▼                   ▼                  ▼
  🎓 Learner Hub     💼 Freelancer Hub   👨‍🏫 Mentor Studio    🏢 Employer ATS    🛡️ Admin Console
  (/learner/*)       (/freelancer/*)     (/mentor/*)         (/employer/*)      (/admin/*)
  • Skill Roadmaps   • Semantic Matching • Course Studio     • Job Posting      • Telemetry
  • Course Checkout  • Job Applications  • Student Requests  • Candidate RAG    • User Moderation
  • 1-on-1 Mentoring • Proposal Builder  • Revenue Analytics • ATS Pipeline     • Audit Logs
```

### 1. 🎓 Learner / Student Experience Flow
- **Skill-First RAG Discovery:** Input any technical skill (e.g., `Java`, `Next.js`, `Machine Learning`, `PostgreSQL`) to instantly retrieve database-backed career roadmaps with structured phase breakdowns and milestones.
- **Top 5 Courses & Expert Mentors:** Multi-signal ranked courses and verified mentors with duplicate-free pagination.
- **Marketplace Course Checkout:** Seamlessly purchase paid courses via Cashfree or Razorpay with instantaneous transactional entitlement unlocking.
- **1-on-1 Mentorship Booking:** Book personalized coaching sessions with industry mentors and unlock direct real-time messaging upon confirmation.
- **Interactive Roadmaps:** Track completed milestones and progress through comprehensive career learning paths.

### 2. 💼 Freelancer / Professional Experience Flow
- **5-Factor Semantic Job Matching:** Multi-signal ranked job and contract discovery combining:
  - Verified Skill Overlap: **50%**
  - Experience Level Match: **20%**
  - Location Alignment: **10%**
  - Career Goal Compatibility: **10%**
  - pgvector Cosine Similarity: **10%**
- **Proposal Creation Studio:** Craft and submit tailored project proposals with AI-assisted cover letters.
- **Application Lifecycle Tracker:** Real-time visibility into application statuses: `APPLIED` → `SHORTLISTED` → `INTERVIEW` → `ACCEPTED` / `REJECTED`.
- **Portfolio & Resume Hub:** Upload resumes with secure cloud/local storage and obtain verified skill badges.

### 3. 👨‍🏫 Expert Mentor Experience Flow
- **Course Authoring Studio (`/mentor/courses/new`):** Create and publish technical courses with video modules, lessons, and pricing.
- **Mentorship Request Management (`/mentor/requests`):** Review incoming student mentorship requests, accept or decline with notes, and automatically initialize 1-on-1 direct messaging.
- **Live Earnings & Payout Analytics (`/api/payments/mentor/earnings`):** Live telemetry calculating gross earnings, platform commission (10%), net settlement (90%), and complete transaction ledger.

### 4. 🏢 Company / Employer Experience Flow
- **Job Posting Studio (`/employer/jobs/new`):** Publish job listings with required skills, experience levels, work modes (`REMOTE`, `HYBRID`, `ONSITE`), and salary ranges.
- **Semantic Candidate Matching:** Query candidate chunks using vector embeddings to identify high-fit verified talent.
- **Applicant Tracking System (ATS) Pipeline (`/employer/jobs/[id]/applicants`):** Inspect applicant profiles, review match explanations, and transition candidates through hiring stages.

### 5. 🛡️ System Admin Console (`/admin/dashboard`)
- **Platform Telemetry:** Live counters and analytics for users, courses, jobs, applications, payments, and messaging.
- **User & Verification Moderation (`/admin/users`):** Manage user roles, toggle moderation status, and issue verified talent badges.
- **Content Moderation (`/admin/courses`, `/admin/jobs`):** Audit and moderate published courses and job listings.
- **Immutable Security Audit Log (`/admin/audit`):** Append-only audit trail logging all authentication events, administrative operations, and payment lifecycles.

### 6. 💬 Community Feed & Direct Messaging
- **Community Feed (`/feed`):** Share technical insights, publish articles, comment on discussions, and react with likes.
- **Direct Messaging (`/messages`):** End-to-end secured 1-on-1 conversations between students, mentors, freelancers, and recruiters.

---

## 💳 Multi-Provider Payment Architecture

GroEarn implements an enterprise-grade pluggable payment architecture powered by the `IPaymentProvider` abstraction and `PaymentProviderFactory`.

```
                    ┌──────────────────────────────┐
                    │     PaymentService Core      │
                    │ (Orders, Signatures, Entitle)│
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────┴───────────────┐
                    ▼                              ▼
     ┌────────────────────────────┐  ┌────────────────────────────┐
     │  CashfreePaymentProvider   │  │   RazorpayPaymentProvider  │
     │  (Official v2023-08-01 PG) │  │    (Alternate Gateway)     │
     └──────────────┬─────────────┘  └─────────────┬──────────────┘
                    │                              │
                    ▼                              ▼
     • Sandbox & Production APIs    • Server-Side Order Creation
     • HMAC-SHA256 Webhook Sig      • HMAC-SHA256 Signature Verify
     • 5-min Replay Attack Window   • Idempotent Webhook Engine
     • Constant-Time Sig Equality   • Transactional Entitlements
     • Refund Endpoint & Health
```

### Cashfree Marketplace Integration (v2023-08-01)
- **Environment Isolation:** Official endpoints dynamically bound to environment:
  - **Sandbox:** `https://sandbox.cashfree.com/pg`
  - **Production:** `https://api.cashfree.com/pg`
- **Server-Side Order Creation:** Generates secure `payment_session_id` and authoritative database order records.
- **Cryptographic Webhook Verification:** 
  - Validates `x-webhook-signature` (HMAC-SHA256 base64) and `x-webhook-timestamp`.
  - Replay attack prevention: strictly rejects webhooks older than 5 minutes ($300\text{s}$).
  - Constant-time signature comparison via `crypto.timingSafeEqual` to eliminate timing attacks.
- **Idempotent Webhook Processing:** Prevents duplicate course purchases or duplicate enrollments on repeated webhook deliveries.
- **Platform Split Commission:** Automatically calculates 10% platform fee and 90% mentor net payout settlement.

### Razorpay Alternate Gateway
- Server-side order creation with strict price verification.
- Authoritative HMAC-SHA256 signature verification.
- Idempotent webhook handling with database transaction isolation.

### Refunds, Health Telemetry & Payout Settlements
- **Refund Endpoint (`POST /api/payments/refund`):** Authenticated refund processing supporting full or partial refunds with audit logging and RBAC validation.
- **Payment Health Check (`GET /api/health/payment`):** Reports gateway readiness, active provider, and environment without leaking credentials.
- **Mentor Earnings API (`GET /api/payments/mentor/earnings`):** Provides gross revenue, platform fee deductions, and net payout breakdown.

---

## 🧠 AI, Semantic Search & pgvector RAG Engine

GroEarn enforces a clean separation of concerns:
```text
PostgreSQL Database (Source of Truth)
        ↓
pgvector HNSW Cosine Distance (<=> operator, vector(1024))
        ↓
Deterministic Multi-Signal Business Ranking
        ↓
Groq LLM Grounded Personalization & Explanation
        ↓
Structured User Response
```

### Local BGE-M3 (1024-dim) Embedding Inference
- Generates real 1024-dimensional embeddings via local model serving (`http://127.0.0.1:11434`, model: `bge-m3`).
- Runtime assertion validates vector dimensions: `vector.length === 1024`.
- PostgreSQL HNSW graph index on `document_chunks.embedding` (`vector(1024)`).

### Deterministic Multi-Signal Hybrid Scoring
Recommendations are scored using a transparent, multi-factor formula rather than opaque estimations:
$$\text{Final Score} = (\text{Vector Similarity} \times 0.35) + (\text{Skill Overlap} \times 0.35) + (\text{Rating} \times 0.15) + (\text{Level Match} \times 0.15)$$

### Zero-Shot Intent Classifier Fallback
If the embedding server is offline or undergoing maintenance, the `IntentClassifier` seamlessly falls back to keyword-token zero-shot classification to ensure 100% platform availability without crashes.

---

## 🔒 Security, Governance & Fail-Closed Policies

1. **Zero-Trust RBAC:**
   - Public registration endpoints (`/api/auth/register`, `/api/auth/role-select`) reject the `ADMIN` role via Zod validation schemas and `AuthService` guards.
   - Admin accounts can only be provisioned via direct database migrations or authorized administrative operations.
2. **Fail-Closed JWT Secret Runtime Enforcement:**
   - Rejects missing or weak ($< 32$ characters) `JWT_SECRET` values during application initialization.
   - Tokens stored in `HttpOnly`, `SameSite=lax`, `Secure` cookies.
3. **IDOR Prevention:**
   - Strict ownership validation across messaging, mentorship requests, job listings, applications, resumes, and payment ledgers.
4. **PostgreSQL Multi-Instance Rate Limiting:**
   - Distributed rate limiter backed by the `RateLimit` table (`DatabaseRateLimiter`), ensuring uniform rate limiting across serverless instances with automatic expiry cleanup.
5. **Append-Only Immutable Audit Logs:**
   - Security audit logs recorded for every authentication attempt, payment lifecycle event, and administrative mutation. Prisma update/delete operations on `AuditLog` are strictly forbidden.
6. **Cloud Storage Fail-Closed Policy:**
   - Explicit failure in production if cloud credentials fail (no silent or insecure local fallbacks).

---

## 📡 API Route Reference

### Authentication & Profiles
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user (`LEARNER`, `FREELANCER`, `MENTOR`, `COMPANY`) |
| `POST` | `/api/auth/login` | Authenticate user and issue secure JWT cookie |
| `POST` | `/api/auth/logout` | Clear authentication session |
| `GET` | `/api/auth/me` | Fetch currently authenticated user and profile |
| `POST` | `/api/auth/role-select` | Update onboarding role selection |
| `GET` / `PUT` | `/api/profile` | Retrieve and update user profile data |
| `POST` | `/api/profile/educations` | Add education records |

### AI, Semantic RAG & Roadmaps
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/ai/roadmap` | Generate or retrieve database-backed career roadmap |
| `POST` | `/api/ai/rag-recommendations` | Multi-signal RAG course and mentor recommendations |
| `POST` | `/api/ai/skill-analysis` | Analyze user skills and produce proficiency diagnostics |
| `POST` | `/api/ai/chat` | AI career assistant chat with grounded context |
| `POST` | `/api/ai/proposal` | AI proposal and cover letter generation |
| `POST` | `/api/ai/resume-parse` | Extract metadata and skills from uploaded resume |

### Marketplace Payments & Refunds
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/payments/orders` | Create server-side order with Cashfree / Razorpay |
| `POST` | `/api/payments/verify` | Verify client-side payment completion signature |
| `POST` | `/api/payments/webhook` | Process cryptographic webhook events (Cashfree / Razorpay) |
| `POST` | `/api/payments/refund` | Process authenticated full/partial refund |
| `GET` | `/api/payments/mentor/earnings` | Fetch mentor gross revenue, platform fee, and net settlement |
| `GET` | `/api/payments/[id]` | Inspect specific payment record (with IDOR protection) |

### Jobs & Applications
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` / `POST` | `/api/jobs` | Search job listings / Create new job requisition |
| `GET` / `PUT` / `DELETE` | `/api/jobs/[id]` | View, update, or close job posting |
| `GET` | `/api/jobs/[id]/applicants` | View applicant pipeline for specific job |
| `POST` | `/api/applications` | Submit job application with cover letter |
| `PUT` | `/api/applications/[id]/status` | Transition applicant status (`APPLIED`, `SHORTLISTED`, `INTERVIEW`, `ACCEPTED`, `REJECTED`) |

### Courses & Mentors
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` / `POST` | `/api/courses` | List published courses / Author new course |
| `GET` / `PUT` | `/api/courses/[id]` | View course curriculum / Update course details |
| `GET` / `POST` | `/api/mentors` | List expert mentors / Book mentorship session |
| `GET` / `PUT` | `/api/mentor/requests` | Fetch mentor requests / Accept or decline booking |

### Messaging, Notifications & Community
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` / `POST` | `/api/messages` | List user conversations / Send direct message |
| `GET` | `/api/notifications` | Fetch unread and historic notifications |
| `PUT` | `/api/notifications/[id]/read` | Mark specific notification as read |
| `GET` / `POST` | `/api/posts` | Fetch community feed / Create new post |

### Health & System Telemetry
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | General application health check |
| `GET` | `/api/health/db` | PostgreSQL connection and schema health |
| `GET` | `/api/health/payment` | Payment gateway readiness and environment telemetry |
| `GET` | `/api/admin/stats` | Admin platform-wide telemetry counters |
| `GET` | `/api/admin/audit` | Admin security audit log stream |

---

## ⚙️ Environment Configuration (.env)

Create a `.env` file in the project root based on `.env.example`:

```ini
# ==============================================================================
# Database Configuration (PostgreSQL with pgvector extension)
# ==============================================================================
DATABASE_URL="postgresql://user:password@host:5432/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@host:5432/neondb?sslmode=require"

# ==============================================================================
# Authentication & Security
# ==============================================================================
JWT_SECRET="generate-a-strong-random-jwt-secret-min-32-chars"
JWT_EXPIRES_IN="7d"

# ==============================================================================
# Local BGE-M3 Embedding Service (Ollama / Local Serving Layer)
# ==============================================================================
EMBEDDING_BASE_URL="http://127.0.0.1:11434"
BGE_M3_MODEL="bge-m3"

# ==============================================================================
# AI & LLM Services (Groq High-Speed LLM)
# ==============================================================================
MOCK_AI="false"
GROQ_API_KEY="gsk_your_groq_api_key_here"
GROQ_MODEL="openai/gpt-oss-120b"

# ==============================================================================
# Cashfree Marketplace Payments Configuration
# ==============================================================================
PAYMENT_PROVIDER="CASHFREE"
CASHFREE_ENVIRONMENT="sandbox" # 'sandbox' or 'production'
CASHFREE_CLIENT_ID="your_cashfree_app_id"
CASHFREE_CLIENT_SECRET="your_cashfree_secret_key"
CASHFREE_API_VERSION="2023-08-01"
PLATFORM_COMMISSION_PERCENT="10"

# ==============================================================================
# Alternate Payment Gateway (Razorpay - Optional fallback)
# ==============================================================================
RAZORPAY_KEY_ID="rzp_test_your_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_secret"
RAZORPAY_WEBHOOK_SECRET="your_razorpay_webhook_secret"

# ==============================================================================
# Application URL & Storage
# ==============================================================================
NEXT_PUBLIC_APP_URL="http://localhost:3000"
STORAGE_PROVIDER="local" # 'local' or 's3'

# ==============================================================================
# Production Telemetry & Guard
# ==============================================================================
NODE_ENV="development"
DEMO_MODE="false"
NEXT_PUBLIC_DEMO_MODE="false"
LOG_LEVEL="info"
```

---

## 💻 Getting Started Locally

### 1. Prerequisites
- **Node.js:** v20.x or higher
- **PostgreSQL:** PostgreSQL 15+ with `pgvector` extension enabled
- **Ollama (Optional for local embeddings):** `ollama pull bge-m3`

### 2. Clone Repository & Install Dependencies
```bash
git clone https://github.com/tharuntej123/growearn.git
cd growearn
npm ci
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
# Open .env and configure your DATABASE_URL, JWT_SECRET, and Payment credentials
```

### 4. Run Migrations & Seed Database
```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Automated Verification & Test Suites

GroEarn includes an extensive, enterprise-grade verification test suite:

```bash
# 1. TypeScript Static Typecheck
npm run typecheck

# 2. ESLint Quality Analysis
npm run lint

# 3. Master End-to-End Test Suite (13 Suites, 47/47 Passing)
npm test

# 4. Cashfree Payment & Webhook Integration Suite (21/21 Passing)
npx tsx src/lib/__tests__/cashfree-payment.test.ts

# 5. Live Semantic RAG Infrastructure Proof
npm run test:rag:proof

# 6. Realistic Concurrent Performance Benchmark
npm run test:benchmark

# 7. Playwright End-to-End Test Suite
npm run test:e2e

# 8. Next.js Production Build Verification
npm run build
```

---

## 📁 Project Directory Structure

```text
growearn/
├── .github/                     # GitHub Actions CI/CD workflows
├── e2e/                         # Playwright E2E test specs (learner, mentor, company, freelancer, admin)
├── prisma/
│   ├── migrations/              # PostgreSQL schema migrations
│   ├── schema.prisma            # Prisma schema definition with pgvector extension
│   └── seed.ts                  # Production database seed script
├── public/                      # Static assets and icons
├── scripts/                     # Operational maintenance scripts (re-embed, rate limits, timing)
├── src/
│   ├── app/                     # Next.js 16 App Router pages and API routes
│   │   ├── (auth)/              # Login, signup, role-select, onboarding
│   │   ├── admin/               # Admin dashboard, audit logs, users, moderation
│   │   ├── ai-assistant/        # AI Career Assistant interface
│   │   ├── api/                 # REST API endpoints (auth, ai, payments, health, jobs, courses, etc.)
│   │   ├── community/ / feed/   # Community posts, discussions, and feeds
│   │   ├── company/ / employer/ # Employer dashboard, job creation, ATS applicant pipeline
│   │   ├── courses/             # Course catalog, curriculum viewer, lesson player
│   │   ├── freelancer/ / prof/  # Freelancer dashboard, proposals, application tracker
│   │   ├── jobs/                # Job board and job detail pages
│   │   ├── learner/ / student/  # Learner dashboard, skill roadmaps, course enrollment
│   │   ├── mentor/ / mentors/   # Mentor dashboard, course studio, request management
│   │   └── messages/            # Direct 1-on-1 messaging
│   ├── components/              # Reusable React components & UI primitives
│   ├── controllers/             # Backend domain controllers
│   ├── lib/
│   │   ├── __tests__/           # Master test suite, Cashfree tests, RAG proof, benchmarks
│   │   ├── ai/                  # BGE-M3 embeddings, RAG chain, hybrid matcher, roadmaps catalog
│   │   ├── auth.ts              # Stateless JWT & cookie utilities
│   │   ├── constants.ts         # Roles, permissions, categories, demo fixtures
│   │   ├── prisma.ts            # Global Prisma database client instance
│   │   ├── rate-limiter.ts      # Multi-instance PostgreSQL DatabaseRateLimiter
│   │   └── utils.ts             # API response helpers and cryptographic tools
│   ├── repositories/            # Database access layer (User, Job, Course, Mentor, etc.)
│   ├── services/
│   │   ├── auth.service.ts      # User registration, authentication, RBAC
│   │   ├── payment/             # Cashfree & Razorpay provider implementations, factory, service
│   │   └── storage.service.ts   # Multi-provider local and cloud object storage
│   └── validators/              # Zod validation schemas
├── .env.example                 # Environment variable template
├── ARCHITECTURE.md              # Technical engineering specification
├── package.json                 # Project dependencies and test scripts
├── playwright.config.ts         # Playwright test configuration
└── README.md                    # Project documentation
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](file:///g:/ufp/LICENSE) file for details.
