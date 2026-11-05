# <div align="center">Learn Faster &nbsp;|&nbsp; Earn Smarter &nbsp;|&nbsp; AI Powered</div>

<div align="center">

**GroEarn** is an enterprise-grade, AI-native talent, mentorship, and career acceleration ecosystem unifying personalized skill roadmaps, 1-on-1 industry mentorship, freelance contract bidding, and ATS talent pipelines with 1024-dimensional semantic RAG search, Cashfree marketplace payments, and full-stack Docker orchestration.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![Next.js](https://img.shields.io/badge/Next.js-16.3%20App%20Router-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready%20%26%20Orchestrated-2496ED?logo=docker)](docker-compose.yml)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-336791?logo=postgresql)](https://github.com/pgvector/pgvector)
[![Cashfree](https://img.shields.io/badge/Cashfree-v2023--08--01-00B272.svg)](https://www.cashfree.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4.1-2D3748?logo=prisma)](https://www.prisma.io/)
[![Embeddings](https://img.shields.io/badge/Embeddings-BGE--M3%201024d-FF6B6B.svg)](https://ollama.com/)
[![Tests](https://img.shields.io/badge/Tests-59%2F59%20Passing-brightgreen.svg)](#-verification--testing)

</div>

---

## 📑 Table of Contents

- [✨ Demo & Platform Preview](#-demo--platform-preview)
- [🔑 Seeded Role Hubs & Authentication](#-seeded-role-hubs--authentication)
- [⚡ Why We Built GroEarn](#-why-we-built-groearn)
- [🐳 Complete Dockerization & Container Architecture](#-complete-dockerization--container-architecture)
- [🏗️ System Architecture & Data Flows](#️-system-architecture--data-flows)
- [📂 Project Directory Structure](#-project-directory-structure)
- [🛠️ Tech Stack Reference](#️-tech-stack-reference)
- [🚀 Getting Started & Local Setup](#-getting-started--local-setup)
- [🧪 Verification & Testing](#-verification--testing)
- [🛡️ Enterprise Security Hardening](#️-enterprise-security-hardening)
- [🔗 System Documentation](#-system-documentation)
- [📜 License](#-license)

---

## ✨ Demo & Platform Preview

> **GroEarn**: The unified full-stack ecosystem that transforms fragmented technical career progression into an end-to-end, AI-grounded workflow — from initial skill exploration and 1-on-1 coaching to paid freelance contract delivery and direct company recruitment.

<div align="center">
  <img src="assets/demo-hero.png" alt="GroEarn AI Career Platform Demo" width="950" />
</div>

<br />

---

## 🔑 Seeded Role Hubs & Authentication

GroEarn enforces a **zero-password security architecture**. Legacy passwords and traditional email/password forms have been retired (`HTTP 410 Gone`). Public authentication is handled exclusively via **Google OAuth 2.0 with OpenID Connect (OIDC)**, PKCE (`S256`), and database-backed session cookies (`groearn_session`).

For local development and automated E2E testing, the database seed (`npm run seed`) pre-populates production-grade profiles across all 5 canonical roles:

| Role | Seeded Email | Canonical Route | Core Capabilities |
| :--- | :--- | :--- | :--- |
| **Learner** | `student@example.com` | `/learner/dashboard` | Skill-first AI roadmaps, Tavily live web grounding, course enrollment, 1-on-1 mentor booking |
| **Freelancer** | `professional@example.com` | `/freelancer/dashboard` | 5-factor hybrid job matching, AI proposal generator, application tracking |
| **Mentor** | `priya.sharma@example.com` | `/mentor/dashboard` | Course publishing studio, booking approvals, 90/10 revenue telemetry |
| **Company** | `careers@novatech-solutions.io` | `/company/dashboard` | Job creation studio, ATS applicant pipeline, resume viewer |
| **Admin** | `admin@growearn.com` | `/admin/dashboard` | Platform telemetry, user moderation, role controls, immutable audit logs |

> [!NOTE]
> In automated browser tests (`npm run test:e2e`), authentication is executed programmatically via `loginAsRole()`, injecting cryptographically valid session tokens directly into the browser context. In interactive browser use, simply sign in with your Google account.

---

## ⚡ Why We Built GroEarn

<div align="center">
  <img src="https://img.shields.io/badge/Real--world%20Skills-4F46E5?style=for-the-badge" alt="Real-world Skills" />
  &nbsp;
  <img src="https://img.shields.io/badge/Paid%20Freelance%20Contracts-059669?style=for-the-badge" alt="Paid Freelance Contracts" />
  &nbsp;
  <img src="https://img.shields.io/badge/AI--Native%20Workflow-8B5CF6?style=for-the-badge" alt="AI Native Workflow" />
  &nbsp;
  <img src="https://img.shields.io/badge/Dockerized%20Infra-2496ED?style=for-the-badge" alt="Dockerized Infra" />
</div>

<br />

Modern technical career growth is broken by high friction and fragmented tooling:
- **Learners** finish static video courses but lack clear, milestone-driven roadmaps to transition into paid work.
- **Freelancers** struggle through manual bidding platforms flooded with bot proposals and zero verified skill relevance.
- **Mentors** want to monetize their domain expertise but get bogged down by scheduling, payments, and course hosting friction.
- **Companies** waste hundreds of hours filtering through keyword-stuffed resumes without verified proof of competence.

GroEarn unifies these stages into a cohesive, AI-grounded platform:

<div align="center">
  <img src="assets/features.png" alt="GroEarn Core Capabilities Infographic" width="950" />
</div>

<br />

### Core Pillars

- 🎓 **AI Skill Roadmaps (1024-dim BGE-M3 RAG + Isolated Tavily Search)**: Query any technical domain (`Java`, `Next.js`, `Machine Learning`, `PostgreSQL`) to generate a 4-phase structured milestone roadmap, top courses, and verified mentors with zero duplicate pagination. For learners, roadmaps are enriched with live web search results via dedicated Tavily integration.
- 💼 **5-Factor Hybrid Job Matcher**: Real-time matching scoring open contracts based on Skill Overlap (50%), Seniority/Experience (20%), Location Alignment (10%), Career Goal Fit (10%), and pgvector Cosine Similarity (10%).
- 👨‍🏫 **1-on-1 Mentorship & Direct Messaging**: Connect directly with verified mentors, schedule coaching sessions, and chat over private, authenticated 1-on-1 messaging channels.
- 💳 **Cashfree Marketplace Payments**: Enterprise Cashfree Payments (`v2023-08-01`) integration featuring HMAC-SHA256 cryptographic webhook verification, 300-second replay attack defense, automated 90% mentor / 10% platform fee splits, and transactional entitlement unlocking.
- 🏢 **Company ATS Hiring Pipeline**: Post engineering roles with instant vector chunk ingestion, evaluate candidate proposals, review PDF resumes via secure magic-byte verified storage, and track applicants through an ATS Kanban workflow (`APPLIED` ➔ `REVIEWING` ➔ `INTERVIEW` ➔ `ACCEPTED` ➔ `REJECTED`).
- 🛡️ **Enterprise Security & Immutable Audits**: Database-enforced role `CHECK` constraints (`LEARNER`, `FREELANCER`, `MENTOR`, `COMPANY`, `ADMIN`), sole admin demotion defense, distributed rate limiting, and an append-only `AuditLog` table protected against `UPDATE` and `DELETE` operations.

---

## 🐳 Complete Dockerization & Container Architecture

GroEarn is fully dockerized with a production-ready, multi-container orchestration setup managed through `docker-compose.yml` and a multi-stage `Dockerfile`.

### Container Topology

```text
┌───────────────────────────────────────────────────────────────────────────┐
│                          Docker Network: groearn-internal                 │
│                                                                           │
│   ┌────────────────────────┐                   ┌───────────────────────┐  │
│   │       groearn-app      │                   │    groearn-postgres   │  │
│   │   Next.js 16 (Port 3000)│ ◄─── DATABASE ───►│ PostgreSQL 16 pgvector│ │
│   │   Unprivileged 'nextjs'│                   │     (Port 5432)       │  │
│   └───────────▲────────────┘                   └───────────▲───────────┘  │
│               │                                            │              │
│               │ HTTP Vector Inference                      │ Volume:      │
│               ▼                                            │ postgres_data│
│   ┌────────────────────────┐                               │              │
│   │groearn-embedding-service│                              │              │
│   │  Ollama BGE-M3 (1024d) │                               │              │
│   │     (Port 11434)       │                               │              │
│   └───────────▲────────────┘                               │              │
│               │ Auto-Pulls Model On First Run              │              │
│   ┌───────────┴────────────┐                               │              │
│   │   groearn-model-init   │                               │              │
│   │  Pre-loads 'bge-m3'    │                               │              │
│   │  (One-shot container)  │                               │              │
│   └────────────────────────┘                               │              │
│               │ Volume: ollama_models                      │              │
└───────────────┼────────────────────────────────────────────┼──────────────┘
                ▼                                            ▼
      Local Storage: Models                       Local Storage: Data
```

### The 4 Docker Services

1. **`app` (`groearn-app`)**:
   - Built from multi-stage Alpine Node 20 `Dockerfile`.
   - Runs as unprivileged `nextjs:nodejs` user (UID/GID 1001) for container security.
   - Automatically executes `npx prisma migrate deploy` on startup before launching `next start`.
   - Healthcheck: Probes `http://127.0.0.1:3000/api/health` every 15s.
   - Exposes port `3000`.

2. **`postgres` (`groearn-postgres`)**:
   - Built from official `pgvector/pgvector:pg16` image.
   - Native support for PostgreSQL `vector(1024)` dense embeddings and HNSW indexes.
   - Healthcheck: `pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}`.
   - Volume persistence: `postgres_data` mapped to `/var/lib/postgresql/data`.
   - Exposes port `5432` on `127.0.0.1`.

3. **`embedding-service` (`groearn-embedding-service`)**:
   - Built from `ollama/ollama:latest`.
   - Hosts the high-performance BGE-M3 1024-dimensional dense embedding model.
   - Volume persistence: `ollama_models` mapped to `/root/.ollama`.
   - Healthcheck: Validates `curl -f http://localhost:11434/api/tags`.
   - Exposes port `11434` on `127.0.0.1`.

4. **`model-init` (`groearn-model-init`)**:
   - One-shot initialization container that runs once after `embedding-service` is healthy.
   - Automatically executes `ollama pull bge-m3` to pre-download the embedding model weights.
   - Guarantees zero cold-start delay or runtime failure on the first AI RAG search query.
   - Exits cleanly (`restart: "no"`) once initialization completes.

---

### Docker Operations & Commands

```bash
# ==============================================================================
# OPTION A: Full Stack Containerized Deployment (Production / Staging)
# ==============================================================================

# 1. Build and start all 4 services (App, PostgreSQL, Ollama, Model Init)
npm run docker:up
# Or directly with Docker:
docker compose up -d --build

# 2. View real-time container logs
docker compose logs -f app

# 3. Check health and container statuses
docker compose ps

# 4. Stop and tear down all containers and networks
npm run docker:down
# Or directly with Docker:
docker compose down
```

```bash
# ==============================================================================
# OPTION B: Hybrid Development Mode (Recommended for Host Rapid Development)
# ==============================================================================
# Runs PostgreSQL + Ollama in Docker, and runs Next.js on your host with hot-reload

# 1. Start only database and AI embedding services in Docker
docker compose up postgres embedding-service model-init -d

# 2. Run Next.js on your host machine
npm run dev

# 3. Tear down backing infrastructure when done
docker compose down
```

---

## 🏗️ System Architecture & Data Flows

### Architecture Diagram

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
        MW["Next.js Middleware (Stateless JWT Verification, PKCE & RBAC Guards)"]
    end

    subgraph Server_APIs["3. Server-Side Next.js API Routes & Controllers"]
        Ctrl_Auth["AuthController (/api/auth/*)"]
        Ctrl_AI["AI Endpoints (/api/ai/* - Chat, RAG, Proposal, Resume)"]
        Ctrl_Jobs["JobController (/api/jobs/*, /api/applications/*)"]
        Ctrl_Mentors["MentorController (/api/mentors/*)"]
        Ctrl_Payments["PaymentController (/api/payments/*)"]
        Ctrl_Admin["AdminController (/api/admin/*)"]
        Ctrl_Storage["StorageController (/api/storage/*)"]
        Ctrl_Health["Health Diagnostics (/api/health, /api/health/ai, /api/health/db, /api/health/payment)"]
    end

    subgraph Services_Layer["4. Core Domain Services"]
        Svc_Auth["AuthService (Google OAuth 2.0 & Session Revocation)"]
        Svc_SkillRAG["SkillRAGService & IntentClassifier"]
        Svc_RoadmapTavily["CareerRoadmapService & LearnerRoadmapSearchService (Tavily)"]
        Svc_Payment["PaymentService (CashfreeProvider)"]
        Svc_Storage["StorageService (LocalStorageProvider with Magic-Byte Checks)"]
        Svc_RAGSync["RAGSyncService (Real-Time Synchronous Entity Ingestion)"]
    end

    subgraph AI_Vector_Store["5. AI & Vector Engine"]
        BGE3["Local BGE-M3 Container (1024-dim Dense Embeddings)"]
        HNSW["pgvector HNSW Cosine Index (document_chunks.embedding)"]
        Groq["Groq Cloud LLM (Llama 3.3 70B & GPT-OSS 120B Inference)"]
        MultiSignal["Multi-Signal Scorer (Vector 35% + Skill 35% + Rating 15% + Level 15%)"]
    end

    subgraph External_Services["6. External Gateways & Storage"]
        Cashfree["Cashfree Payments Gateway (PG API v2023-08-01)"]
        Tavily["Tavily Search API (Learner Roadmaps Live Grounding)"]
        LocalStorage["Local Object Storage (storage/private with HMAC URLs)"]
    end

    subgraph Database_Layer["7. PostgreSQL Persistence Layer (Prisma ORM)"]
        DB_User["User & Profile (Canonical Role CHECK Constraints)"]
        DB_Session["Session (Database-Backed Session Ledger)"]
        DB_Account["Account (Google Provider Identity Mapping)"]
        DB_Jobs["Job, Application, & Candidate"]
        DB_Courses["Course, CourseModule, Lesson & Purchase"]
        DB_Mentors["MentorProfile & MentorshipBooking"]
        DB_Payments["PaymentOrder, Payment & WebhookEvent"]
        DB_Audit["AuditLog (Immutable Append-Only Records)"]
        DB_Chunks["document_chunks (vector(1024))"]
        DB_RateLimit["RateLimit (Multi-Instance Database Rate Limiter)"]
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
    MW --> Ctrl_Health

    Ctrl_Auth --> Svc_Auth
    Ctrl_AI --> Svc_SkillRAG
    Ctrl_AI --> Svc_RoadmapTavily
    Ctrl_Payments --> Svc_Payment
    Ctrl_Jobs --> Svc_RAGSync
    Ctrl_Storage --> Svc_Storage

    Svc_SkillRAG --> BGE3
    BGE3 --> HNSW
    HNSW --> MultiSignal
    MultiSignal --> Groq
    Svc_RoadmapTavily --> Tavily
    Svc_RoadmapTavily --> Groq

    Svc_Payment --> Cashfree
    Svc_Storage --> LocalStorage

    Svc_Auth --> DB_User
    Svc_Auth --> DB_Session
    Svc_Auth --> DB_Account
    Svc_Payment --> DB_Payments
    Svc_Payment --> DB_Courses
    Svc_RAGSync --> DB_Chunks
    Ctrl_Jobs --> DB_Jobs
    Ctrl_Mentors --> DB_Mentors
    Ctrl_Admin --> DB_Audit
    HNSW --> DB_Chunks
```

---

### Key Data Flows

#### 1. AI Semantic RAG & Tavily-Grounded Roadmap Generation
1. **User Query**: Learner queries a skill or target role (e.g. `Java Spring Boot`, `Next.js 16`).
2. **Intent Classification & Embedding**: Query is normalized and converted to a 1024-dimensional dense vector via the local BGE-M3 service.
3. **pgvector Cosine Search**: Executes an HNSW cosine distance query (`<=>` operator) against `document_chunks` for relevant courses and mentors.
4. **Deterministic Multi-Signal Ranking**:
   $$\text{Final Score} = (\text{Vector Similarity} \times 0.35) + (\text{Skill Overlap} \times 0.35) + (\text{Rating} \times 0.15) + (\text{Level Match} \times 0.15)$$
5. **Live Tavily Web Enrichment**: For the Learner role, `LearnerRoadmapSearchService` queries Tavily for live documentation, tutorials, and repos, passed to Groq LLM for 4-phase structured milestone generation.

#### 2. Cashfree Payment, HMAC-SHA256 Webhook Verification & Entitlements
1. **Order Initiation**: Learner clicks "Enroll" or books a mentorship. The server queries authoritative course or mentor prices from PostgreSQL and creates a `PaymentOrder` (`status = CREATED`).
2. **Session Dispatch**: Server interacts with Cashfree PG (`/pg/orders`) to generate a `payment_session_id`.
3. **Client Checkout**: Frontend mounts Cashfree Web JS SDK v3 modal; learner completes payment via UPI, Card, or Net Banking.
4. **Cryptographic Webhook Verification**: Cashfree posts a `PAYMENT_SUCCESS_WEBHOOK`. The server verifies the HMAC-SHA256 signature using `CASHFREE_CLIENT_SECRET`, validates timestamps within 300 seconds to prevent replay attacks, and asserts amounts match.
5. **Atomic Entitlements & Split Ledger**: In a PostgreSQL transaction, order is marked `PAID`, `CoursePurchase` record is created, and the mentor payout ledger is credited (90% to mentor, 10% platform fee).

#### 3. Freelancer 5-Factor Job Matching & Company ATS Pipeline
1. **Real-time Ingestion**: When an employer publishes a role, `RAGSyncService` splits the description and indexes it into `document_chunks`.
2. **5-Factor Matcher**: Freelancers are scored based on:
   - Verified Skill Overlap: **50%**
   - Seniority / Experience Level: **20%**
   - Location Alignment: **10%**
   - Career Goal Fit: **10%**
   - pgvector Cosine Match: **10%**
3. **AI Proposal Generator**: Freelancer drafts a proposal with AI cover letter generation grounded in verified skills and project requirements.
4. **ATS Pipeline**: Employers review applicants in an ATS Kanban view (`APPLIED` ➔ `REVIEWING` ➔ `INTERVIEW` ➔ `ACCEPTED` ➔ `REJECTED`).

#### 4. 1-on-1 Mentorship Booking & Authenticated Messaging
1. **Discovery**: Learners discover mentors based on verified skills, rating, and hourly rate.
2. **Booking**: Learner schedules a session; a `MentorshipBooking` is created (`status = PENDING`).
3. **Acceptance**: Mentor approves the session in the Mentor Studio.
4. **Direct Messaging**: A private `Conversation` record is initialized, allowing encrypted 1-on-1 communication between learner and mentor.

#### 5. Admin Security Moderation & Audit Immutability
1. **Role Escalation Defense**: Public signup endpoints reject self-assignment of `ADMIN`.
2. **Sole Admin Defense**: System blocks demotion or deletion of the last active platform administrator.
3. **Append-Only Audit Logs**: Every security, role change, and financial transaction is appended to `AuditLog`. PostgreSQL constraints reject `UPDATE` and `DELETE` operations on audit rows.

---

## 📂 Project Directory Structure

```text
growearn/
├── .github/
│   └── workflows/
│       └── ci.yml               # Comprehensive GitHub Actions CI/CD pipeline
├── assets/                      # High-resolution README graphics & diagrams
│   ├── demo-hero.png            # Hero demo web UI preview
│   └── features.png             # Core platform architecture & feature breakdown
├── docs/                        # Deep architectural, security, AI, and payment docs
│   ├── ai.md                    # 1024-dim BGE-M3 RAG and pgvector technical specifications
│   ├── architecture.md          # Multi-layer system design and entity relationships
│   ├── payments.md              # Cashfree PG implementation, HMAC verification, and webhooks
│   └── security.md              # IDOR defense, RBAC guards, and audit log immutability
├── e2e/                         # Playwright automated browser test suite
│   ├── admin.spec.ts            # Admin moderation and telemetry browser tests
│   ├── auth-helper.ts           # Session-injected test authentication helper
│   ├── company.spec.ts          # Company job studio and ATS pipeline tests
│   ├── freelancer.spec.ts       # Freelancer job match and proposal tests
│   ├── learner.spec.ts          # Learner roadmap and course enrollment tests
│   ├── mentor.spec.ts           # Mentor studio and booking tests
│   └── security.spec.ts         # IDOR isolation and route protection tests
├── prisma/
│   ├── migrations/              # PostgreSQL schema migrations (including canonical check constraints)
│   ├── schema.prisma            # Prisma schema with pgvector and session models
│   └── seed.ts                  # Production-like database seed script
├── public/                      # Static assets and robots.txt
├── scripts/
│   ├── check-bgem3.ts           # Ollama & BGE-M3 model connectivity diagnostic
│   ├── measure-rag-timing.ts    # RAG pipeline retrieval latency benchmark
│   ├── reembed-all-documents.ts # Batch vector re-embedding script for production chunks
│   └── test-live-auth.ts        # Live HTTP server authentication & zero-password verification
├── src/
│   ├── app/                     # Next.js 16 App Router (Pages, Layouts & Route Handlers)
│   │   ├── admin/               # Admin dashboard, audit log viewer, role moderation
│   │   ├── ai-assistant/        # Interactive AI Career Assistant chat interface
│   │   ├── api/                 # REST API Route Handlers
│   │   │   ├── admin/           # Platform metrics, user role management, job moderation
│   │   │   ├── ai/              # Chat, proposal builder, resume parse, RAG recommendations
│   │   │   ├── applications/    # Job application submission and IDOR-isolated fetching
│   │   │   ├── auth/            # Google OAuth init, callback, linking, and logout
│   │   │   ├── candidates/      # Candidate profile retrieval and matching
│   │   │   ├── courses/         # Course catalog, lesson streaming, and enrollment
│   │   │   ├── health/          # Health diagnostics (/api/health, /ai, /db, /payment)
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
│   │   ├── login/               # Zero-password Google OAuth sign-in portal
│   │   ├── mentor/              # Mentor studio, session management, and earnings ledger
│   │   ├── messages/            # Real-time private chat interface
│   │   └── signup/              # Zero-password Google OAuth registration portal
│   ├── components/              # Modular, reusable React UI components
│   ├── context/                 # React context providers (AuthContext)
│   ├── controllers/             # Domain controllers managing request/response lifecycles
│   ├── lib/
│   │   ├── __tests__/           # Master verification suite (59 passing tests) and benchmarks
│   │   ├── ai/                  # BGE-M3 embeddings, pgvector store, retriever, intent classifier, Tavily
│   │   ├── auth.ts              # Google OAuth client, PKCE helpers, session token signing
│   │   ├── constants.ts         # Canonical role enums, platform commissions, fixtures
│   │   ├── prisma.ts            # Singleton Prisma client instance
│   │   └── rate-limiter.ts      # Multi-instance database rate limiter
│   ├── repositories/            # Encapsulated database query and mutation layers
│   ├── services/
│   │   ├── auth.service.ts      # Google OAuth flow, identity mapping, session management
│   │   ├── payment/             # Cashfree provider, webhook signature verification, refunds
│   │   └── storage.service.ts   # Local disk storage with magic-byte checks and HMAC URLs
│   └── validators/              # Zod validation schemas for requests and payloads
├── .dockerignore                # Production Docker build exclusions
├── docker-compose.yml           # Multi-container orchestration (App, Postgres 16, Ollama, Model Init)
├── Dockerfile                   # Production multi-stage Alpine Node 20 Dockerfile
├── next.config.ts               # Next.js 16 compiler and image configuration
├── package.json                 # Project dependencies, build scripts, and test commands
├── playwright.config.ts         # Playwright E2E browser testing configuration
└── README.md                    # Primary project documentation
```

---

## 🛠️ Tech Stack Reference

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) | `16.3.4` | App Router, Server Actions, API routes, fast SSR & ISR |
| **UI Library** | [React](https://react.dev/) | `19.2.8` | Declarative component UI with React Server Components |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `v4.0` | High-performance CSS design tokens and responsive utilities |
| **Icons & Toasts** | Lucide React & Sonner | `1.16` / `2.0` | Vector UI icons and toast notifications |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | `16.x` | Relational data persistence, foreign keys, transactions |
| **Vector Engine** | [pgvector](https://github.com/pgvector/pgvector) | `0.8.0` | 1024-dimensional cosine distance HNSW vector index |
| **ORM** | [Prisma ORM](https://www.prisma.io/) | `6.4.1` | Type-safe database queries, migrations, check constraints |
| **Containerization** | [Docker & Compose](https://www.docker.com/) | Multi-Stage | Alpine Node 20 app runner, Postgres 16, Ollama, auto-model init |
| **AI Embeddings** | [BGE-M3](https://ollama.com/) | `1024-dim` | Dense semantic embeddings served via Ollama / Docker |
| **LLM Inference** | [Groq Cloud](https://groq.com/) | Llama 3.3 70B | Grounded responses, proposal generation, resume parsing |
| **Web Grounding** | [Tavily Search](https://tavily.com/) | REST API | Isolated live web grounding for Learner role roadmaps |
| **Payments** | [Cashfree PG](https://www.cashfree.com/) | `v2023-08-01` | Sandbox & Production marketplace checkout, HMAC-SHA256 webhooks |
| **Auth & Security** | Google OAuth & Sessions | `google-auth-library` / `jose` | Exclusive Google OAuth 2.0 / OIDC, PKCE, HttpOnly secure cookies, server-side RBAC |
| **Validation** | [Zod](https://zod.dev/) | `3.24.2` | Runtime schema validation for requests and API inputs |
| **Testing** | TSX & Playwright | `4.19` / `1.63` | 59 automated integration tests, benchmarks, browser E2E workflows |

---

## 🚀 Getting Started & Local Setup

### Prerequisites

- **Node.js**: `v20.x` or higher (LTS recommended)
- **Docker & Docker Compose**: For containerized orchestration
- **Git**: For version control

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

Configure your environment variables:

| Variable | Description | Default / Example | Required |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://groearn:groearn_secure_password@localhost:5432/groearn?schema=public` | **Yes** |
| `DIRECT_URL` | Direct PostgreSQL connection string (for migrations) | `postgresql://groearn:groearn_secure_password@localhost:5432/groearn?schema=public` | Optional |
| `AUTH_SECRET` | Secret key for session signing (minimum 32 characters) | `your_secure_32_character_auth_secret_key_here` | **Yes** |
| `AUTH_URL` | Application root URL | `http://localhost:3000` | **Yes** |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID (from Google Cloud Console) | `your-client-id.apps.googleusercontent.com` | **Yes** |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret | `your-google-client-secret` | **Yes** |
| `EMBEDDING_BASE_URL` | Local embedding server URL | `http://127.0.0.1:11434` | **Yes** |
| `BGE_M3_MODEL` | Embedding model identifier | `bge-m3` | **Yes** |
| `GROQ_API_KEY` | Groq Cloud API Key for LLM chat & proposals | `gsk_...` | **Yes** |
| `GROQ_MODEL` | Groq LLM model name | `openai/gpt-oss-120b` | Optional |
| `TAVILY_API_KEY` | Tavily API Key (exclusively for Learner live roadmaps) | `tvly-...` | Optional (graceful fallback) |
| `CASHFREE_ENVIRONMENT` | Cashfree environment (`sandbox` or `production`) | `sandbox` | **Yes** |
| `CASHFREE_CLIENT_ID` | Cashfree Client App ID | `your_cashfree_app_id` | **Yes** |
| `CASHFREE_CLIENT_SECRET` | Cashfree Secret Key (Never expose client-side) | `your_cashfree_secret_key` | **Yes** |
| `CASHFREE_API_VERSION` | Cashfree PG API Version | `2023-08-01` | **Yes** |
| `PLATFORM_COMMISSION_PERCENT`| Platform fee split percentage | `10` | **Yes** |
| `NEXT_PUBLIC_APP_URL` | Application root URL | `http://localhost:3000` | **Yes** |
| `STORAGE_PROVIDER` | Object storage provider | `local` | **Yes** |
| `MOCK_AI` | Mock AI responses in CI or offline testing | `false` | Optional |

---

### Step 3: Start Infrastructure via Docker Compose

Choose between **Full Stack Containerized Mode** or **Hybrid Local Development Mode**:

#### Method A: Full Stack in Docker (Recommended for testing complete deployment)

```bash
# Starts Next.js app, PostgreSQL 16 (pgvector), Ollama, and auto-pulls BGE-M3 model
npm run docker:up

# Open http://localhost:3000 in your browser
```

#### Method B: Hybrid Mode (Recommended for fast local Next.js development)

```bash
# 1. Start only PostgreSQL and Ollama in Docker:
docker compose up postgres embedding-service model-init -d

# 2. Run Prisma migrations and seed locally:
npm run prisma:generate
npm run prisma:migrate
npm run seed

# 3. Start Next.js development server:
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Testing

GroEarn includes an exhaustive, production-grade test suite covering authentication, IDOR isolation, object storage security, pgvector bounds, multi-instance rate limiting, Cashfree payments, and Playwright browser E2E workflows.

### Complete Command Reference

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **Typecheck** | `npm run typecheck` | Strict TypeScript compilation (`tsc --noEmit`) |
| **Lint** | `npm run lint` | ESLint rules check on `src/` |
| **Master Tests** | `npm test` | Master end-to-end integration and security test suite (59 passing tests) |
| **RAG Tests** | `npm run test:rag` | Production RAG pipeline and intent classifier verification |
| **RAG Proof** | `npm run test:rag:proof` | Live semantic RAG and pgvector cosine search proof |
| **Benchmark** | `npm run test:benchmark` | Load and latency benchmark under simulated traffic |
| **E2E Browser** | `npm run test:e2e` | Playwright automated browser test suite across all 5 roles |
| **BGE-M3 Check**| `npm run bgem3:check` | Ollama service and BGE-M3 model connectivity diagnostic |
| **Re-embed** | `npm run reembed` | Batch re-embed all catalog courses, mentors, and jobs |
| **Docker Up** | `npm run docker:up` | Build and launch complete containerized stack in background |
| **Docker Down** | `npm run docker:down` | Stop and tear down all containers and networks |
| **Docker Build**| `npm run docker:build`| Build all Docker container images |

---

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

- **Zero Password Footprint**: Legacy passwords completely retired. Authentication handled exclusively via Google OAuth 2.0 with PKCE and OpenID Connect.
- **Database-Level Role CHECK Constraint**: Enforced at the PostgreSQL level (`LEARNER`, `FREELANCER`, `MENTOR`, `COMPANY`, `ADMIN`). Arbitrary string roles are rejected fail-closed.
- **Account Takeover Prevention**: Silent account linking based purely on email is blocked. Linking a Google account to an existing profile requires cryptographically signed token verification.
- **IDOR Isolation**: Direct object access on job applications, proposals, candidate resumes, and payment orders requires explicit ownership or administrative authorization.
- **Sole Admin Demotion Protection**: Platform safeguards prevent demoting or deleting the last active platform administrator.
- **Cryptographic Webhook Signatures**: Cashfree webhook payloads require HMAC-SHA256 signature verification with constant-time equality checks (`crypto.timingSafeEqual`) and a 300-second replay attack prevention window.
- **File Upload Protection**: Uploaded resumes undergo MIME type verification, path traversal checks (`../`), and file header magic-byte validation to reject spoofed executable payloads.
- **Append-Only Audit Logs**: Sensitive operations (role changes, refunds, payments, and admin moderation) are recorded in an immutable `AuditLog` table protected against `UPDATE` and `DELETE` queries.
- **Multi-Instance Rate Limiting**: Distributed database rate limiter backed by the PostgreSQL `RateLimit` table (`DatabaseRateLimiter`) with automatic in-memory fallback.
- **Real-Time Health Diagnostics**:
  - `/api/health`: General platform and database connectivity check.
  - `/api/health/ai`: AI embedding service, pgvector extension, and Groq LLM availability.
  - `/api/health/db`: PostgreSQL latency and query responsiveness.
  - `/api/health/payment`: Cashfree configuration and readiness check without exposing secrets.

---

## 🔗 System Documentation

For in-depth architectural specifications and implementation guides, refer to the documentation in `/docs`:

- [System Architecture](docs/architecture.md) — Multi-layer system design, controller responsibilities, and entity relationships.
- [AI & RAG Engine](docs/ai.md) — BGE-M3 1024-dim dense embeddings, pgvector HNSW indexing, and multi-signal ranking.
- [Cashfree Payments](docs/payments.md) — Cashfree PG API v2023-08-01 implementation, HMAC-SHA256 signatures, and webhooks.
- [Security Policies](docs/security.md) — Google OAuth 2.0, RBAC, IDOR defense, and audit immutability.

---

## 📜 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.

**Author**: [Pagadala Tharun Tej](https://github.com/tharuntej123)  
**Repository**: [github.com/tharuntej123/growearn](https://github.com/tharuntej123/growearn)
