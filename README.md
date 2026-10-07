# GroEarn — Career, Mentorship & Talent Ecosystem

GroEarn is a full-stack web application designed to connect learning, 1-on-1 mentorship, freelance contract opportunities, and company hiring into a single platform.

The system is built with Next.js 16 (App Router), React 19, PostgreSQL with the pgvector extension, Prisma ORM, a local BGE-M3 embedding service, Cashfree and Razorpay payment integrations, and role-based access control.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Problem & Solution](#problem--solution)
- [User Roles](#user-roles)
- [System Architecture](#system-architecture)
- [Key Data Flows](#key-data-flows)
- [AI & Vector Search Architecture](#ai--vector-search-architecture)
- [Technology Stack](#technology-stack)
- [Project Directory Structure](#project-directory-structure)
- [Environment Variables](#environment-variables)
- [Getting Started Locally](#getting-started-locally)
- [Automated Testing](#automated-testing)
- [Security & Access Control](#security--access-control)
- [Current Scope](#current-scope)
- [License](#license)

---

## Project Overview

GroEarn connects the key stages of technical career growth:
1. **Learn:** Discover database-backed roadmaps and complete structured courses.
2. **Guidance:** Book 1-on-1 coaching sessions with industry mentors.
3. **Earn:** Apply for freelance contracts and full-time engineering roles.
4. **Grow:** Share technical updates and participate in the community feed.
5. **Hire & Mentor:** Post jobs, review candidates via an ATS pipeline, and publish courses.

---

## Problem & Solution

- **The Problem:** Career progression tools are usually fragmented across separate platforms: course websites lack personalized roadmaps, mentorship networks are isolated from job listings, and hiring platforms often lack verified skill context.
- **The Solution:** GroEarn provides a single workflow connecting learning roadmaps, verified skill profiles, 1-on-1 mentor booking, freelance proposals, and candidate matching.

---

## User Roles

The application implements 5 distinct roles:

| Role | Canonical Route | Primary Capabilities |
| :--- | :--- | :--- |
| **Learner** | `/learner/dashboard` | Skill-first roadmaps, course enrollment, 1-on-1 mentor booking |
| **Freelancer** | `/freelancer/dashboard` | 5-factor hybrid job matching, proposal builder, application tracker |
| **Mentor** | `/mentor/dashboard` | Course creation studio, booking request management, revenue telemetry |
| **Company** | `/company/dashboard` | Job posting studio, ATS candidate pipeline, candidate search |
| **Admin** | `/admin/dashboard` | Platform metrics, user moderation, append-only security audit logs |

### Seeded Demo Accounts

When running locally with seeded data, you can log in using the following test accounts (password for all accounts is `Demo1234!`):

- **Learner:** `student@example.com`
- **Freelancer:** `professional@example.com`
- **Mentor:** `priya.sharma@example.com`
- **Company:** `careers@novatech-solutions.io`
- **Admin:** `admin@example.com`

---

## System Architecture

```mermaid
graph TD
    subgraph Frontend["1. Frontend (Next.js 16 App Router)"]
        UI_Learner["Learner Hub (/learner/*)"]
        UI_Freelancer["Freelancer Hub (/freelancer/*)"]
        UI_Mentor["Mentor Studio (/mentor/*)"]
        UI_Company["Company ATS (/company/*)"]
        UI_Admin["Admin Console (/admin/*)"]
    end

    subgraph Security["2. Edge Security & Routing"]
        Middleware["Edge Middleware (Stateless JWT & RBAC)"]
    end

    subgraph Application["3. Core Application Layer"]
        AuthSvc["Auth & User Service"]
        SkillRAG["Skill & Roadmap RAG Engine"]
        PaymentSvc["Payment Service (Cashfree & Razorpay)"]
        JobSvc["Job & Application Service"]
        StorageSvc["Storage Service (Local & Cloud)"]
    end

    subgraph AI_Engine["4. AI & Vector Engine"]
        BGE3["Local BGE-M3 (1024-dim Embeddings)"]
        PgVector["PostgreSQL pgvector (HNSW Index)"]
        GroqLLM["LLM Client (Groq / OpenAI Compatible)"]
    end

    subgraph Payments["5. Payment Gateways"]
        Cashfree["Cashfree PG (v2023-08-01)"]
        Razorpay["Razorpay SDK"]
    end

    subgraph Database["6. Persistence Layer"]
        DB[("PostgreSQL 15+ & Prisma ORM")]
    end

    UI_Learner --> Middleware
    UI_Freelancer --> Middleware
    UI_Mentor --> Middleware
    UI_Company --> Middleware
    UI_Admin --> Middleware

    Middleware --> AuthSvc
    Middleware --> SkillRAG
    Middleware --> PaymentSvc
    Middleware --> JobSvc
    Middleware --> StorageSvc

    SkillRAG --> BGE3
    BGE3 --> PgVector
    SkillRAG --> GroqLLM

    PaymentSvc --> Cashfree
    PaymentSvc --> Razorpay

    AuthSvc --> DB
    SkillRAG --> DB
    PaymentSvc --> DB
    JobSvc --> DB
    StorageSvc --> DB
```

---

## Key Data Flows

### 1. Skill-First Learning & Roadmaps
1. User searches for a technical skill (e.g., `Java`, `Next.js`).
2. Local BGE-M3 generates a 1024-dimensional vector embedding.
3. PostgreSQL pgvector performs an HNSW cosine distance search against `document_chunks`.
4. The system ranks and returns matching courses and expert mentors with duplicate-free pagination.

### 2. Job Matching
1. Freelancer profile attributes (skills, experience level, location, career goal) are retrieved.
2. The hybrid matcher computes a match score:
   - Skill Overlap: 50%
   - Experience Level: 20%
   - Location Alignment: 10%
   - Career Goal Fit: 10%
   - Vector Match: 10%
3. Freelancer submits application or proposal with an AI-assisted cover letter.

### 3. Payment Processing & Entitlement Unlocking
1. User initiates checkout for a course or mentorship session.
2. Server validates price from database and generates an order via Cashfree or Razorpay.
3. Upon checkout completion, webhook signatures are verified using HMAC-SHA256 with constant-time equality checks.
4. Database records `CoursePurchase` or `MentorshipBooking` within a transaction and updates mentor payout ledgers (90% mentor / 10% platform fee).

---

## AI & Vector Search Architecture

- **Embeddings:** Local BGE-M3 dense embeddings (1024 dimensions) served through Ollama or local model serving.
- **Vector Database:** PostgreSQL with the `pgvector` extension and an HNSW cosine distance index on `document_chunks.embedding`.
- **LLM Grounding:** Groq API (Llama 3.3 70B and GPT-OSS 120B) for generating grounded responses.
- **Fallback:** Zero-shot intent classification when the embedding service is unconfigured.

---

## Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.3.4 (App Router) & React 19.2 | Canonical routing, Server/Client Components, Server Actions |
| **Styling** | Tailwind CSS v4 | CSS design tokens, responsive layouts |
| **UI Components** | Lucide React, Sonner | Vector icons, toast notifications |
| **Database & ORM** | PostgreSQL 15+ & Prisma ORM 6.4.1 | Relational models, migrations, foreign key constraints |
| **Vector Engine** | pgvector (`vector(1024)`) | HNSW cosine distance search on document chunks |
| **AI & Embeddings** | Local BGE-M3 & Groq API | 1024-dim vector inference and LLM chat responses |
| **Payments** | Cashfree PG (v2023-08-01) & Razorpay | Marketplace payments, HMAC-SHA256 webhook verification, refunds |
| **Authentication** | Stateless JWT & Bcrypt | HttpOnly cookies, password hashing, role-based guards |
| **Rate Limiting** | PostgreSQL DatabaseRateLimiter | Distributed rate limiting backed by `RateLimit` table |
| **Testing** | TSX test runner & Playwright | Integration test suites, browser E2E verification |

---

## Project Directory Structure

```text
growearn/
├── docs/                        # Architecture, AI, Security, and Payments documentation
│   ├── ai.md
│   ├── architecture.md
│   ├── payments.md
│   └── security.md
├── e2e/                         # Playwright end-to-end test specs
├── prisma/
│   ├── migrations/              # Database migration history
│   ├── schema.prisma            # Prisma schema with pgvector extension
│   └── seed.ts                  # Database seed script
├── public/                      # Static web assets
├── src/
│   ├── app/                     # Next.js App Router (pages and API route handlers)
│   │   ├── admin/               # Admin dashboard, audit logs, user moderation
│   │   ├── ai-assistant/        # AI Career Assistant page
│   │   ├── api/                 # Backend REST endpoints (auth, ai, payments, jobs, etc.)
│   │   ├── company/             # Company dashboard and job management
│   │   ├── courses/             # Course catalog and lesson player
│   │   ├── feed/                # Community feed and discussions
│   │   ├── freelancer/          # Freelancer dashboard, proposals, application tracker
│   │   ├── jobs/                # Job board and details
│   │   ├── learner/             # Learner dashboard, skill roadmaps, enrollment
│   │   ├── mentor/              # Mentor studio, request approvals, earnings
│   │   └── messages/            # 1-on-1 direct messaging
│   ├── components/              # Reusable React components and UI primitives
│   ├── controllers/             # Backend domain controllers
│   ├── lib/
│   │   ├── __tests__/           # Integration, security, payment, and RAG test suites
│   │   ├── ai/                  # BGE-M3 embeddings, LLM client, intent classifier, hybrid matcher
│   │   ├── auth.ts              # JWT signing, verification, and cookie helpers
│   │   ├── constants.ts         # Roles, permissions, and demo user fixtures
│   │   ├── prisma.ts            # Prisma client instance
│   │   └── rate-limiter.ts      # Multi-instance database rate limiter
│   ├── repositories/            # Database query abstractions
│   ├── services/
│   │   ├── auth.service.ts      # Authentication and role management
│   │   ├── payment/             # Cashfree & Razorpay providers and payment service
│   │   └── storage.service.ts   # Object storage abstraction (local disk and cloud)
│   └── validators/              # Zod validation schemas
├── .env.example                 # Template for environment variables
├── package.json                 # Dependencies and scripts
└── README.md                    # Project overview and documentation
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/growearn` |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | `your-random-32-plus-char-jwt-secret` |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `EMBEDDING_BASE_URL` | Local embedding server URL | `http://127.0.0.1:11434` |
| `BGE_M3_MODEL` | Embedding model identifier | `bge-m3` |
| `GROQ_API_KEY` | Groq API key for LLM inference | `gsk_...` |
| `PAYMENT_PROVIDER` | Active gateway (`CASHFREE` or `RAZORPAY`) | `CASHFREE` |
| `CASHFREE_ENVIRONMENT` | Cashfree environment (`sandbox` or `production`) | `sandbox` |
| `CASHFREE_CLIENT_ID` | Cashfree Client App ID | `your_cashfree_app_id` |
| `CASHFREE_CLIENT_SECRET`| Cashfree Secret Key | `your_cashfree_secret_key` |
| `PLATFORM_COMMISSION_PERCENT` | Platform revenue percentage | `10` |
| `STORAGE_PROVIDER` | Storage backend (`local` or `s3`) | `local` |

---

## Getting Started Locally

### 1. Prerequisites
- **Node.js:** v20.x or higher
- **PostgreSQL:** Version 15+ with the `pgvector` extension enabled
- **Ollama (Optional for local embeddings):** `ollama pull bge-m3`

### 2. Installation
```bash
git clone https://github.com/tharuntej123/growearn.git
cd growearn
npm ci
```

### 3. Database Migration & Seed
```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Automated Testing

```bash
# Typecheck
npm run typecheck

# Linting
npm run lint

# Master Integration & Security Test Suite
npm test

# Cashfree Payments Integration Suite
npx tsx src/lib/__tests__/cashfree-payment.test.ts

# Live Semantic RAG Verification
npm run test:rag:proof

# Playwright Browser E2E Tests
npm run test:e2e

# Production Build
npm run build
```

---

## Security & Access Control

- **Role-Based Access Control:** Registration endpoints reject public requests for the `ADMIN` role. Route access is enforced server-side.
- **Data Protection:** Database queries use explicit field selections to prevent exposing `passwordHash` or internal tokens.
- **IDOR Protection:** Ownership checks are enforced on jobs, applications, proposals, payments, and mentorship bookings.
- **Cryptographic Verification:** Webhook signatures are verified using HMAC-SHA256 with constant-time equality checks and a 5-minute replay attack prevention window.
- **Rate Limiting:** Database-backed rate limiting protects authentication, payment, and request endpoints.
- **Audit Logging:** Administrative operations, payment events, and authentication attempts are recorded in an append-only `AuditLog` table.

---

## Current Scope

- **Payments:** Cashfree sandbox and production integration, Razorpay integration, refunds, and mentor revenue calculations.
- **AI/RAG:** Local BGE-M3 1024-dim pgvector cosine retrieval and Groq LLM inference with zero-shot keyword fallback.
- **Storage:** Local file storage and S3/R2 cloud storage abstraction with signed download URLs.
- **Roles:** Dedicated hubs for Learner, Freelancer, Mentor, Company, and Admin with canonical routing.

---

## License

Copyright (c) 2026 Pagadala Tharun Tej. All Rights Reserved.

See the [LICENSE](LICENSE) file for terms and conditions.
