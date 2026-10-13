# <div align="center">Learn Faster &nbsp;|&nbsp; Earn Smarter &nbsp;|&nbsp; AI Powered</div>

<div align="center">

**GroEarn** is an AI-native talent, mentorship, and career acceleration ecosystem unifying skill roadmaps, 1-on-1 industry mentorship, freelance contract bidding, and ATS talent pipelines with 1024-dimensional semantic RAG search and Cashfree marketplace payments.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![Next.js](https://img.shields.io/badge/Next.js-16.3%20App%20Router-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-336791?logo=postgresql)](https://github.com/pgvector/pgvector)
[![Cashfree](https://img.shields.io/badge/Cashfree-v2023--08--01-00B272.svg)](https://www.cashfree.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4.1-2D3748?logo=prisma)](https://www.prisma.io/)
[![Embeddings](https://img.shields.io/badge/Embeddings-BGE--M3%201024d-FF6B6B.svg)](https://ollama.com/)
[![Tests](https://img.shields.io/badge/Tests-59%2F59%20Passing-brightgreen.svg)](#-verification--testing)

</div>

---

## ✨ Demo

> **GroEarn**: The unified full-stack platform that transforms fragmented career progression into an end-to-end, AI-grounded workflow from initial skill exploration to paid freelance contracts and hiring.

<div align="center">
  <img src="assets/demo-hero.png" alt="GroEarn AI Career Platform Demo" width="950" />
</div>

<br />

### 🔑 Seeded Demo Credentials

Explore all 5 role hubs locally without manual registration (password for all demo accounts: `Demo1234!`):

| Role | Email | Canonical Route | Core Capabilities |
| :--- | :--- | :--- | :--- |
| **Learner** | `student@example.com` | `/learner/dashboard` | Skill-first AI roadmaps, course enrollment, 1-on-1 mentor booking |
| **Freelancer** | `professional@example.com` | `/freelancer/dashboard` | 5-factor hybrid job matching, AI proposal generator, application tracker |
| **Mentor** | `priya.sharma@example.com` | `/mentor/dashboard` | Course publishing studio, booking approvals, 90/10 revenue telemetry |
| **Company** | `careers@novatech-solutions.io` | `/company/dashboard` | Job creation studio, ATS candidate pipeline, resume viewer |
| **Admin** | `admin@example.com` | `/admin/dashboard` | Platform metrics, user role moderation, append-only security audit logs |

---

## ⚡ Why We Built GroEarn

<div align="center">
  <img src="https://img.shields.io/badge/Real--world%20Skills-4F46E5?style=for-the-badge" alt="Real-world Skills" />
  &nbsp;
  <img src="https://img.shields.io/badge/Guaranteed%20Earnings-059669?style=for-the-badge" alt="Guaranteed Earnings" />
  &nbsp;
  <img src="https://img.shields.io/badge/AI--Native%20Workflow-8B5CF6?style=for-the-badge" alt="AI Native Workflow" />
</div>

<br />

Modern technical career growth suffers from two major problems: **slow execution** and **high technical friction**.

Learners finish video tutorials but have no verified roadmap to transition into real-world freelance projects. Industry professionals want to mentor and monetize their expertise, but are bogged down by scheduling, payment logistics, and course authoring friction. Companies waste hundreds of hours filtering through unverified applicant resumes. Shipping a real career leap often takes months when it should take days.

<div align="center">
  <img src="assets/features.png" alt="GroEarn Core Capabilities Infographic" width="950" />
</div>

<br />

### Core Pillars

- 🎓 **AI Skill Roadmaps (1024-dim BGE-M3 RAG)**: Input any technical skill (`Java`, `Next.js`, `Kubernetes`) to retrieve database-backed 4-phase milestone roadmaps, top courses, and top mentors with zero duplicate pagination.
- 💼 **5-Factor Hybrid Job Matcher**: Matches candidates to open contracts based on Skill Overlap (50%), Experience Level (20%), Location Alignment (10%), Career Goal Fit (10%), and pgvector Cosine Similarity (10%).
- 👨‍🏫 **1-on-1 Mentorship & Direct Messaging**: Connect directly with verified mentors, schedule coaching sessions, and communicate over real-time private messaging channels.
- 💳 **Cashfree Marketplace Payments**: Enterprise-grade Cashfree Payments (v2023-08-01) integration with cryptographic HMAC-SHA256 signature verification, automated 90% mentor / 10% platform fee splits, and instant entitlement unlocking.
- 🏢 **Company ATS Hiring Pipeline**: Post engineering jobs with instant vector chunk ingestion, evaluate candidate proposals, and manage hiring stages (`APPLIED` ➔ `REVIEWING` ➔ `INTERVIEW` ➔ `ACCEPTED` ➔ `REJECTED`).
- 🛡️ **Immutable Security & pgvector**: Canonical database check constraints (`LEARNER`, `FREELANCER`, `MENTOR`, `COMPANY`, `ADMIN`), sole admin demotion defense, magic-byte inspection, path traversal guards, and append-only audit logging.

---

## 🏗️ System Overview

GroEarn is engineered with a modular, service-oriented architecture using Next.js 16 App Router for server/client component rendering, PostgreSQL 16 with pgvector for relational data and dense vector embeddings, Prisma ORM for type-safe persistence, and Cashfree for secure payments.

### Core Technologies

- **Framework**: [Next.js 16.3.4](https://nextjs.org/) (App Router, Server Actions, Server Components)
- **Frontend & UI**: [React 19.2](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Sonner](https://sonner.emilkowal.ski/)
- **Database & Persistence**: [PostgreSQL 16](https://www.postgresql.org/) with [pgvector](https://github.com/pgvector/pgvector) extension (`vector(1024)`)
- **ORM & Data Layer**: [Prisma ORM 6.4.1](https://www.prisma.io/) with custom SQL migrations & canonical `CHECK` constraints
- **Authentication**: Stateless JWT in `HttpOnly` `SameSite=Lax` secure cookies, [Bcrypt.js](https://github.com/dcodeIO/bcrypt.js), server-side RBAC
- **AI & RAG Engine**: Local BGE-M3 (1024-dimensional dense vectors), HNSW Cosine Index, [Groq LLM](https://groq.com/) (Llama 3.3 70B), LangChain text splitters, zero-shot intent classifier fallback
- **Payments Gateway**: [Cashfree Payments](https://www.cashfree.com/) (API v2023-08-01), HMAC-SHA256 signature verification, replay attack prevention, mentor revenue split
- **Object Storage**: Pluggable `StorageService` (Local disk storage with path traversal & magic-byte protection, and AWS S3 / Cloudflare R2 compatibility)
- **Rate Limiting**: Multi-instance database rate limiter backed by PostgreSQL `RateLimit` table

---

## 📐 Architecture Diagram

```mermaid
graph TD
    subgraph Client_Side["1. Client Side (Next.js 16 App Router)"]
        UI_Learner["Learner Hub (/learner/*)"]
        UI_Freelancer["Freelancer Hub (/freelancer/*)"]
        UI_Mentor["Mentor Studio (/mentor/*)"]
        UI_Company["Company ATS (/company/*)"]
        UI_Admin["Admin Console (/admin/*)"]
    end

    subgraph Edge_Security["2. Edge Security & Routing"]
        MW["Next.js Middleware (Stateless JWT Verification & RBAC Guards)"]
    end

    subgraph Server_APIs["3. Server-Side Next.js API Routes & Controllers"]
        Ctrl_Auth["AuthController (/api/auth/*)"]
        Ctrl_AI["AI Endpoints (/api/ai/* - Chat, RAG, Proposal, Resume)"]
        Ctrl_Jobs["JobController (/api/jobs/*, /api/applications/*)"]
        Ctrl_Mentors["MentorController (/api/mentors/*)"]
        Ctrl_Payments["PaymentController (/api/payments/*)"]
        Ctrl_Admin["AdminController (/api/admin/*)"]
        Ctrl_Storage["StorageController (/api/storage/*)"]
    end

    subgraph Services_Layer["4. Core Domain Services"]
        Svc_Auth["AuthService"]
        Svc_SkillRAG["SkillRAGService & IntentClassifier"]
        Svc_Payment["PaymentService (CashfreeProvider)"]
        Svc_Storage["StorageService (LocalStorage / S3Provider)"]
        Svc_RAGSync["RAGSyncService (Real-time Entity Ingestion)"]
    end

    subgraph AI_Vector_Store["5. AI & Vector Engine"]
        BGE3["Local BGE-M3 Service (1024-dim Dense Embeddings)"]
        HNSW["pgvector HNSW Cosine Index (document_chunks.embedding)"]
        Groq["Groq Cloud LLM (Llama 3.3 70B Grounding)"]
        MultiSignal["Multi-Signal Scorer (Vector 35% + Skill 35% + Rating 15% + Level 15%)"]
    end

    subgraph External_Services["6. External Gateways & Storage"]
        Cashfree["Cashfree Payments Gateway (v2023-08-01)"]
        DiskS3["Object Storage (Local Disk / AWS S3 / R2)"]
    end

    subgraph Database_Layer["7. PostgreSQL Persistence Layer (Prisma ORM)"]
        DB_User["User & Profile (Canonical Role CHECK Constraints)"]
        DB_Jobs["Job, Application, & Candidate"]
        DB_Courses["Course, CourseModule, Lesson & Purchase"]
        DB_Mentors["MentorProfile & MentorshipBooking"]
        DB_Payments["PaymentOrder, Payment & WebhookEvent"]
        DB_Audit["AuditLog (Immutable Append-Only Records)"]
        DB_Chunks["document_chunks (vector(1024))"]
    end

    UI_Learner --> MW
    UI_Freelancer --> MW
    UI_Mentor --> MW
    UI_Company --> MW
    UI_Admin --> MW

    MW --> Ctrl_Auth
    MW --> Ctrl_AI
    MW --> Ctrl_Jobs
    MW --> Ctrl_Mentors
    MW --> Ctrl_Payments
    MW --> Ctrl_Admin
    MW --> Ctrl_Storage

    Ctrl_Auth --> Svc_Auth
    Ctrl_AI --> Svc_SkillRAG
    Ctrl_Payments --> Svc_Payment
    Ctrl_Jobs --> Svc_RAGSync
    Ctrl_Storage --> Svc_Storage

    Svc_SkillRAG --> BGE3
    BGE3 --> HNSW
    HNSW --> MultiSignal
    MultiSignal --> Groq

    Svc_Payment --> Cashfree
    Svc_Storage --> DiskS3

    Svc_Auth --> DB_User
    Svc_Payment --> DB_Payments
    Svc_Payment --> DB_Courses
    Svc_RAGSync --> DB_Chunks
    Ctrl_Jobs --> DB_Jobs
    Ctrl_Mentors --> DB_Mentors
    Ctrl_Admin --> DB_Audit
    HNSW --> DB_Chunks
```

---

## 🔄 Key Data Flows

### 1. AI Semantic RAG Skill Roadmap & Course Retrieval
1. **User Query**: Learner submits a skill query (e.g., `Java Spring Boot`, `Next.js 16`) from the Learner Dashboard or AI Assistant.
2. **Intent Classification & Embedding**: The system normalizes the query and generates a 1024-dimensional dense vector via the local BGE-M3 embedding service.
3. **pgvector Cosine Search**: Executes an HNSW cosine distance query (`<=>` operator) against `document_chunks` to locate relevant roadmaps, courses, and verified mentors.
4. **Deterministic Multi-Signal Hybrid Ranking**:
   $$\text{Final Score} = (\text{Vector Similarity} \times 0.35) + (\text{Skill Overlap} \times 0.35) + (\text{Rating} \times 0.15) + (\text{Level Match} \times 0.15)$$
5. **Deduplicated Delivery**: Returns structured 4-phase milestones with direct course enrollment links and zero duplicate entity IDs across pagination pages.

### 2. Cashfree Payment & Automated Entitlement Unlocking
1. **Order Initiation**: User clicks "Enroll" or "Book Mentor". The backend validates course/mentor pricing against the database and creates a `PaymentOrder` (`status = CREATED`).
2. **Gateway Dispatch**: The server communicates with Cashfree PG (`/pg/orders`) to generate a `payment_session_id`.
3. **Client Checkout**: The frontend mounts the official Cashfree JS SDK modal; the user completes payment via UPI, Credit/Debit Card, or Net Banking.
4. **Cryptographic Webhook Verification**: Cashfree posts a `PAYMENT_SUCCESS_WEBHOOK` payload. The server validates the cryptographic HMAC-SHA256 signature using `CASHFREE_CLIENT_SECRET`, validates timestamps within 300s to prevent replay attacks, and asserts order amounts match down to the exact currency unit.
5. **Atomic Entitlements & Split Ledger**: In a PostgreSQL transaction, the order is marked `PAID`, a `CoursePurchase` record is created, and the mentor payout ledger is credited (90% to mentor, 10% platform fee).

### 3. Job Discovery, 5-Factor Matching & ATS Pipeline
1. **Job Ingestion**: An employer creates an engineering job. `RAGSyncService` synchronously splits the job description and indexes it into `document_chunks`.
2. **Hybrid Matcher**: Freelancers browsing opportunities are evaluated with a composite 5-factor scoring engine:
   - Skill Overlap (50%)
   - Experience Level (20%)
   - Location Alignment (10%)
   - Career Goal Fit (10%)
   - Vector Similarity (10%)
3. **AI Proposal Builder**: Freelancer drafts a proposal with AI-assisted cover letter generation tailored to the candidate's verified skills and project criteria.
4. **ATS Pipeline**: Employers review incoming applications in real time through an ATS Kanban board, transitioning statuses (`APPLIED` ➔ `REVIEWING` ➔ `INTERVIEW` ➔ `ACCEPTED` ➔ `REJECTED`).

### 4. 1-on-1 Mentorship Booking & Direct Messaging
1. **Mentor Discovery**: Learners evaluate mentors based on industry rating, verified skills, and hourly coaching fees.
2. **Booking Request**: Learner schedules a 1-on-1 coaching session; a `MentorshipBooking` is created (`status = PENDING`).
3. **Mentor Acceptance**: Mentor accepts the booking in the Mentor Studio.
4. **Communication Channel**: A direct `Conversation` record is automatically initialized in the database, allowing immediate private 1-on-1 messaging between learner and mentor.

### 5. Admin Security Moderation & Audit Immutability
1. **Role Escalation Defense**: Public user registration and update endpoints strictly reject privilege escalation to `ADMIN`.
2. **Sole Admin Protection**: Demoting or deleting the last active platform administrator is blocked at the repository level.
3. **Append-Only Audit Logs**: Every security, role change, and payment transaction is appended to the `AuditLog` table. SQL-level constraints prevent `UPDATE` or `DELETE` operations on audit rows.

---

## 📂 Project Directory Structure

```text
growearn/
├── assets/                      # High-resolution README graphics and feature infographics
│   ├── demo-hero.png            # Hero demo web UI preview
│   └── features.png             # Core platform architecture and feature breakdown
├── docs/                        # In-depth architectural, AI, security, and payment documentation
│   ├── ai.md                    # 1024-dim BGE-M3 RAG and pgvector technical specifications
│   ├── architecture.md          # Multi-layer system design and entity relationships
│   ├── payments.md              # Cashfree PG implementation, HMAC verification, and webhooks
│   └── security.md              # IDOR defense, RBAC guards, and audit log immutability
├── e2e/                         # Playwright automated browser test suite
├── prisma/
│   ├── migrations/              # PostgreSQL schema migrations (including canonical role check constraints)
│   ├── schema.prisma            # Prisma schema definition with pgvector extension
│   └── seed.ts                  # Production-like database seed script
├── public/                      # Static assets and robots.txt
├── src/
│   ├── app/                     # Next.js 16 App Router (Pages, Layouts & Route Handlers)
│   │   ├── admin/               # Admin dashboard, audit log viewer, role moderation
│   │   ├── ai-assistant/        # Interactive AI Career Assistant chat interface
│   │   ├── api/                 # REST API Route Handlers
│   │   │   ├── admin/           # Platform metrics, user role management, job moderation
│   │   │   ├── ai/              # Chat, proposal builder, resume parse, RAG recommendations
│   │   │   ├── applications/    # Job application submission and IDOR-isolated fetching
│   │   │   ├── auth/            # Login, registration, session, and logout endpoints
│   │   │   ├── candidates/      # Candidate profile retrieval and matching
│   │   │   ├── courses/         # Course catalog, lesson streaming, and enrollment
│   │   │   ├── health/          # Health diagnostics (/api/health/ai, /api/health/db)
│   │   │   ├── jobs/            # Job board, creation, and detail views
│   │   │   ├── mentors/         # Mentor profiles, bookings, and availability
│   │   │   ├── messages/        # Direct 1-on-1 messaging endpoints
│   │   │   ├── payments/        # Cashfree checkout order creation, status, and webhooks
│   │   │   └── storage/         # Signed URL generation and file upload/download
│   │   ├── company/             # Company dashboard, job studio, and ATS candidate pipeline
│   │   ├── courses/             # Course discovery, curriculum overview, and lesson player
│   │   ├── feed/                # Community posts, comments, and discussions
│   │   ├── freelancer/          # Freelancer dashboard, proposals, and matched jobs
│   │   ├── jobs/                # Public job board and application portal
│   │   ├── learner/             # Learner dashboard, skill roadmaps, and course tracking
│   │   ├── login/               # Authentication portal with quick demo-account login
│   │   ├── mentor/              # Mentor studio, session management, and earnings ledger
│   │   └── messages/            # Real-time private chat interface
│   ├── components/              # Modular, reusable React UI components
│   ├── controllers/             # Domain controllers managing request/response lifecycles
│   ├── lib/
│   │   ├── __tests__/           # Master verification suite (59 passing tests) and benchmarks
│   │   ├── ai/                  # BGE-M3 embeddings, pgvector store, retriever, intent classifier
│   │   ├── auth.ts              # JWT signing/verification, password hashing, cookie helpers
│   │   ├── constants.ts         # Canonical role enums, platform commissions, fixtures
│   │   ├── prisma.ts            # Singleton Prisma client instance
│   │   └── rate-limiter.ts      # Multi-instance database rate limiter
│   ├── repositories/            # Encapsulated database query and mutation layers
│   ├── services/
│   │   ├── auth.service.ts      # Authentication, password verification, and role normalization
│   │   ├── payment/             # Cashfree provider, webhook signature verification, refunds
│   │   └── storage.service.ts   # Local disk and cloud object storage with magic-byte checks
│   └── validators/              # Zod validation schemas for requests and payloads
├── docker-compose.yml           # Multi-container orchestration (PostgreSQL 16 + pgvector, Ollama)
├── Dockerfile                   # Production multi-stage Docker build
├── next.config.ts               # Next.js 16 compiler and image domain configuration
├── package.json                 # Project dependencies, build scripts, and test commands
└── README.md                    # Primary project documentation
```

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) | `16.3.4` | App Router, Server Actions, API routes, fast SSR & ISR |
| **UI Library** | [React](https://react.dev/) | `19.2.8` | Declarative component UI with React Server Components |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `v4.0` | High-performance CSS design tokens and responsive utilities |
| **Icons & Toasts** | Lucide React & Sonner | `1.16` / `2.0` | Vector UI icons and toast notifications |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | `16.x` | Relational data persistence, foreign keys, transactions |
| **Vector Engine** | [pgvector](https://github.com/pgvector/pgvector) | `0.8.0` | 1024-dimensional cosine distance HNSW vector index |
| **ORM** | [Prisma ORM](https://www.prisma.io/) | `6.4.1` | Type-safe database queries, schema migrations, check constraints |
| **AI Embeddings** | [BGE-M3](https://ollama.com/) | `1024-dim` | Dense semantic embeddings served via Ollama / Docker |
| **LLM Inference** | [Groq Cloud](https://groq.com/) | Llama 3.3 70B | Grounded responses, proposal generation, resume parsing |
| **Payments** | [Cashfree PG](https://www.cashfree.com/) | `v2023-08-01` | Sandbox & Production marketplace checkout, HMAC-SHA256 webhooks |
| **Auth & Security** | JWT & Bcrypt.js | `jose` / `bcryptjs` | HttpOnly secure cookies, password hashing, server-side RBAC |
| **Validation** | [Zod](https://zod.dev/) | `3.24.2` | Runtime schema validation for requests and API inputs |
| **Testing** | TSX & Playwright | `4.19` / `1.63` | 59 automated integration tests and browser E2E workflows |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.x` or higher (LTS recommended)
- **Docker & Docker Compose**: For running PostgreSQL 16 with the `pgvector` extension
- **Ollama** *(Optional for local embeddings)*: `ollama pull bge-m3`

---

### Step 1: Clone & Install Dependencies

```bash
git clone https://github.com/tharuntej123/growearn.git
cd growearn
npm install
```

---

### Step 2: Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Verify or configure your environment variables:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://growearn:growearn_secret@localhost:5432/growearn_db` |
| `JWT_SECRET` | Secret key for JWT signing (minimum 32 characters) | `your_secure_32_character_jwt_secret_key_here` |
| `JWT_EXPIRES_IN` | Token expiration duration | `7d` |
| `EMBEDDING_BASE_URL` | Local embedding server URL | `http://127.0.0.1:11434` |
| `BGE_M3_MODEL` | Embedding model identifier | `bge-m3` |
| `GROQ_API_KEY` | Groq Cloud API Key for LLM chat & proposals | `gsk_...` |
| `CASHFREE_ENVIRONMENT` | Cashfree environment (`sandbox` or `production`) | `sandbox` |
| `CASHFREE_CLIENT_ID` | Cashfree Client App ID | `your_cashfree_app_id` |
| `CASHFREE_CLIENT_SECRET` | Cashfree Secret Key | `your_cashfree_secret_key` |
| `CASHFREE_API_VERSION` | Cashfree PG API Version | `2023-08-01` |
| `NEXT_PUBLIC_APP_URL` | Application root URL | `http://localhost:3000` |
| `STORAGE_PROVIDER` | Storage backend (`local` or `s3`) | `local` |

---

### Step 3: Start Infrastructure via Docker Compose

Launch PostgreSQL 16 with `pgvector` enabled:

```bash
docker compose up -d
```

---

### Step 4: Run Database Migrations & Seed Data

```bash
# Generate Prisma Client
npm run prisma:generate

# Apply PostgreSQL migrations (including canonical role check constraint)
npm run prisma:migrate

# Seed database with sample courses, mentors, jobs, and test accounts
npm run seed
```

---

### Step 5: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You can log in immediately using any of the [Seeded Demo Accounts](#-seeded-demo-credentials).

---

## 🧪 Verification & Testing

GroEarn includes an exhaustive, production-grade test suite covering authentication, IDOR isolation, object storage security, pgvector bounds, multi-instance rate limiting, and Cashfree payments.

```bash
# 1. Run TypeScript Type-Check
npm run typecheck

# 2. Run ESLint
npm run lint

# 3. Run Master Verification Suite (59 Tests)
npm test

# 4. Run Semantic RAG & Vector Search Proof
npm run test:rag:proof

# 5. Run Performance & Load Benchmark
npm run test:benchmark

# 6. Run Browser End-to-End Tests
npm run test:e2e
```

### Automated Master Test Suite Breakdown

```text
================================================================================
📊 MASTER TEST RESULTS: 59/59 PASSED (0 FAILED)
================================================================================
🔒 SUITE 1: Security, Auth & IDOR Isolation (11/11 Passed)
⏱️ SUITE 2: PostgreSQL Multi-Instance Database Rate Limiter (3/3 Passed)
📦 SUITE 3: Object Storage Service & Magic-Byte Defense (5/5 Passed)
📜 SUITE 4: Audit Log Immutability & Append-Only Restrictions (3/3 Passed)
🎓 SUITE 5: Learner Lifecycle & Real RAG Retrieval (11/11 Passed)
💼 SUITE 6: Professional Job Matching & Application Flow (3/3 Passed)
👨‍🏫 SUITE 7: Mentor Course Publishing & Mentorship Genesis (4/4 Passed)
🏢 SUITE 8: Employer Hiring Pipeline & Status Persistence (1/1 Passed)
💬 SUITE 9: Community Feed Persistence & Interactions (3/3 Passed)
🔔 SUITE 10: Notifications Lifecycle & Unread Tracking (3/3 Passed)
🛡️ SUITE 11: Admin Moderation & Platform Telemetry (3/3 Passed)
💳 SUITE 12: Cashfree Payment System, Entitlements & Webhooks (9/9 Passed)
================================================================================
🎉 ALL INTEGRATION, SECURITY, STORAGE, RAG & LIFECYCLE TESTS PASSED!
```

---

## 🛡️ Enterprise Security Hardening

- **Database-Level Role CHECK Constraint**: Enforced at the PostgreSQL level (`LEARNER`, `FREELANCER`, `MENTOR`, `COMPANY`, `ADMIN`). Arbitrary string roles are rejected fail-closed.
- **IDOR Isolation**: Direct object access on job applications, proposals, candidate resumes, and payment orders requires explicit ownership or administrative authorization.
- **Sole Admin Demotion Protection**: Platform safeguards prevent demoting or deleting the last active platform administrator.
- **Cryptographic Webhook Signatures**: Cashfree webhook payloads require HMAC-SHA256 signature verification with constant-time equality checks and a 300-second replay attack prevention window.
- **File Upload Protection**: Uploaded files undergo MIME type verification, path traversal checks (`../`), and file header magic-byte validation to reject spoofed executable payloads.
- **Append-Only Audit Logs**: Sensitive operations (role changes, refunds, payments, and admin moderation) are recorded in an immutable `AuditLog` table protected against `UPDATE` and `DELETE` queries.
- **Health Diagnostics**: Real-time diagnostic endpoints available at [/api/health/ai](file:///g:/ufp/src/app/api/health/ai) and [/api/health/db](file:///g:/ufp/src/app/api/health/db) to verify pgvector and embedding availability.

---

## 📜 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.

**Author**: [Pagadala Tharun Tej](https://github.com/tharuntej123)  
**Repository**: [github.com/tharuntej123/growearn](https://github.com/tharuntej123/growearn)
