# <div align="center">Learn Faster &nbsp;|&nbsp; Earn Smarter &nbsp;|&nbsp; AI Powered</div>

<div align="center">

**Growearn** is an enterprise-grade, AI-native talent, mentorship, and career acceleration ecosystem unifying personalized skill roadmaps, 1-on-1 industry mentorship, freelance contract bidding, and ATS talent pipelines with CrewAI multi-agent workflows, 1024-dimensional semantic RAG search, Cashfree marketplace payments, and full-stack Docker orchestration.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![version](https://img.shields.io/badge/version-1.0.0-blue.svg)](package.json)
[![Next.js](https://img.shields.io/badge/Next.js-16.3%20App%20Router-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready%20%26%20Orchestrated-2496ED?logo=docker)](docker-compose.yml)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%20%2B%20pgvector-336791?logo=postgresql)](https://github.com/pgvector/pgvector)
[![CrewAI](https://img.shields.io/badge/CrewAI-Multi--Agent-FF4B4B.svg)](agents/)
[![LangChain](https://img.shields.io/badge/LangChain-RunnableSequence-1C3C3C.svg)](https://js.langchain.com/)
[![Cashfree](https://img.shields.io/badge/Cashfree-v2023--08--01-00B272.svg)](https://www.cashfree.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4.1-2D3748?logo=prisma)](https://www.prisma.io/)
[![Embeddings](https://img.shields.io/badge/Embeddings-BGE--M3%201024d-FF6B6B.svg)](https://ollama.com/)

</div>

---

## 📑 Table of Contents

- [✨ Demo & Platform Preview](#-demo--platform-preview)
- [🔑 Seeded Role Hubs & Authentication](#-seeded-role-hubs--authentication)
- [⚡ Why We Built Growearn](#-why-we-built-growearn)
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

> **Growearn**: The unified full-stack ecosystem that transforms fragmented technical career progression into an end-to-end, AI-grounded workflow — from initial skill exploration and 1-on-1 coaching to paid freelance contract delivery and direct company recruitment.

<div align="center">
  <img src="assets/demo-hero.png" alt="Growearn AI Career Platform Demo" width="950" />
</div>

<br />

---

## 🔑 Seeded Role Hubs & Authentication

Growearn enforces a **zero-password security architecture**. Legacy passwords and traditional email/password forms have been retired (`HTTP 410 Gone`). Public authentication is handled exclusively via **Google OAuth 2.0 with OpenID Connect (OIDC)**, PKCE (`S256`), and database-backed session cookies (`groearn_session`).

For local development and automated E2E testing, the database seed (`npm run seed`) pre-populates production-grade profiles across all 5 canonical roles:

| Role | Seeded Email | Canonical Route | Core Capabilities |
| :--- | :--- | :--- | :--- |
| **Learner** | `student@example.com` / `learner@growearn.com` | `/learner/dashboard` | CrewAI 3-agent career roadmaps, Tavily live web search, course enrollment, 1-on-1 mentor booking |
| **Freelancer** | `professional@example.com` / `professional@growearn.com` | `/freelancer/dashboard` | 5-factor hybrid job matching, AI proposal generator, application tracking |
| **Mentor** | `priya.sharma@example.com` / `mentor@growearn.com` | `/mentor/dashboard` | Course publishing studio, booking approvals, 90/10 revenue telemetry |
| **Company** | `careers@novatech-solutions.io` / `employer@growearn.com` | `/company/dashboard` | Job creation studio, ATS applicant pipeline, resume viewer |
| **Admin** | `admin@growearn.com` | `/admin/dashboard` | Platform telemetry, user moderation, role controls, immutable audit logs |

> [!NOTE]
> In automated browser tests (`npm run test:e2e`), authentication is executed programmatically via `loginAsRole()`, injecting cryptographically valid session tokens directly into the browser context. In interactive browser use, simply sign in with your Google account.

---

## ⚡ Why We Built Growearn

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

Growearn unifies these stages into a cohesive, AI-grounded platform:

<div align="center">
  <img src="assets/features.png" alt="Growearn Core Capabilities Infographic" width="950" />
</div>

<br />

### Core Pillars

- 🎓 **CrewAI Multi-Agent Roadmaps (Researcher, Planner, Reviewer)**: Request any technical domain (`Java`, `Next.js 16`, `Distributed Systems`, `PostgreSQL`) to orchestrate a 3-agent CrewAI workflow. Uses Tavily tool calls to research live market demand, maps against internal courses and mentors, audits curriculum feasibility, and returns a verified 4-phase structured milestone roadmap.
- ⚡ **RAG & ANN Vector Search (LangChain + pgvector HNSW + RRF)**: LangChain `RunnableSequence` orchestrates BGE-M3 1024-dimensional embeddings, pgvector HNSW cosine similarity search (`<=>`), full-text search with Reciprocal Rank Fusion ($k=60$), and deterministic multi-signal ranking.
- 💳 **Production Cashfree Marketplace Checkout**: Instant enrollment and 1-on-1 mentor booking powered by Cashfree PG API v2023-08-01 with constant-time HMAC-SHA256 webhook signatures, timestamp replay protection, and automated 90/10 split payouts.
- 🐳 **Complete Container Orchestration**: Multi-container Docker Compose environment managing standalone Next.js 16, pgvector PostgreSQL 16, Ollama BGE-M3, one-shot migration runner, and the Python CrewAI microservice.

---

## 🐳 Complete Dockerization & Container Architecture

Growearn is completely containerized. All infrastructure components, databases, embedding services, multi-agent services, and the production application runner are orchestrated via `docker-compose.yml`.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       GROWNEARN DOCKER NETWORK (growearn-network)           │
│                                                                             │
│   ┌────────────────────────┐                   ┌────────────────────────┐   │
│   │      growearn-app      │                   │   growearn-postgres    │   │
│   │  Next.js 16 Standalone │ ◄─── DATABASE ───►│  PostgreSQL 16 pgvector│   │
│   │      (Port 3000)       │                   │      (Port 5432)       │   │
│   │  Unprivileged 'nextjs' │                   └───────────▲────────────┘   │
│   └───────────▲────────────┘                               │                │
│               │                                            │ Volume:        │
│               │ REST Client                                │ postgres_data  │
│               ▼                                            │                │
│   ┌────────────────────────┐                               │                │
│   │     growearn-agents    │                               │                │
│   │  Python CrewAI Microsvc│ (Internal Port 8001)          │                │
│   │  Researcher/Planner/Rev│                               │                │
│   └───────────▲────────────┘                               │                │
│               │ Tavily Tools                               │                │
│               ▼                                            │                │
│   ┌────────────────────────┐                               │                │
│   │growearn-embedding-svcs │                               │                │
│   │  Ollama BGE-M3 (1024d) │                               │                │
│   │      (Port 11434)      │                               │                │
│   └───────────▲────────────┘                               │                │
│               │ Auto-Pulls Model On First Run              │                │
│   ┌───────────┴────────────┐                               │                │
│   │   growearn-model-init  │                               │                │
│   │  Pre-loads 'bge-m3'    │                               │                │
│   │  (One-shot container)  │                               │                │
│   └────────────────────────┘                               │                │
│               │ Volume: ollama_models                      │                │
└───────────────┼────────────────────────────────────────────┼────────────────┘
                ▼                                            ▼
      Local Storage: Models                       Local Storage: Data
```

### The 5 Docker Services

1. **`app` (`growearn-app`)**:
   - Built from multi-stage Alpine Node 20 `Dockerfile` leveraging Next.js `output: 'standalone'`.
   - Runs as unprivileged `nextjs:nodejs` user (UID/GID 1001) for container security.
   - Depends on `postgres`, `embedding-service`, and `agents` healthchecks.
   - Healthcheck: Probes `http://127.0.0.1:3000/api/health` every 15s. Exposes port `3000`.

2. **`agents` (`growearn-agents`)**:
   - Built from slim Python 3.11 `agents/Dockerfile` running FastAPI and CrewAI.
   - Runs as non-root `appuser`.
   - Exposes internal port `8001` on the `growearn-network` (isolated from public host binding).
   - Healthcheck: Probes `http://127.0.0.1:8001/health`.

3. **`postgres` (`growearn-postgres`)**:
   - Built from official `pgvector/pgvector:pg16` image.
   - Native support for PostgreSQL `vector(1024)` dense embeddings, HNSW indexes, and `tsvector` FTS.
   - Healthcheck: `pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}`.
   - Volume persistence: `postgres_data` mapped to `/var/lib/postgresql/data`. Exposes port `5432`.

4. **`embedding-service` (`growearn-embedding-service`)**:
   - Built from `ollama/ollama:0.5.4`.
   - Hosts the BGE-M3 1024-dimensional dense embedding model.
   - Volume persistence: `ollama_models` mapped to `/root/.ollama`. Exposes port `11434`.

5. **`model-init` (`growearn-model-init`) & `migrate` (`growearn-migrate`)**:
   - One-shot initialization containers that execute `ollama pull bge-m3` and `npx prisma migrate deploy`.
   - Guarantee zero cold-start delay and verified database schema on launch.

---

### Docker Operations & Commands

```bash
# ==============================================================================
# Full Stack Containerized Deployment
# ==============================================================================

# Build and start all services in Docker (App, Agents, Postgres, Ollama, Init)
npm run docker:up

# View real-time container logs
npm run docker:logs

# Stop and tear down all containers and networks
npm run docker:down

# ==============================================================================
# Hybrid Development Mode (Host Next.js + Docker Backends)
# ==============================================================================

# Start only backing infrastructure (PostgreSQL, Ollama, Agents) in Docker:
docker compose up postgres embedding-service model-init agents -d

# Run Next.js on host with hot-reload:
npm run dev
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
        Ctrl_Agentic["Agentic Roadmap (/api/ai/roadmap/agentic)"]
        Ctrl_Jobs["JobController (/api/jobs/*, /api/applications/*)"]
        Ctrl_Mentors["MentorController (/api/mentors/*)"]
        Ctrl_Payments["PaymentController (/api/payments/*)"]
        Ctrl_Admin["AdminController (/api/admin/*)"]
        Ctrl_Storage["StorageController (/api/storage/*)"]
        Ctrl_Health["Health Diagnostics (/api/health, /api/health/ai, /api/health/db, /api/health/payment)"]
    end

    subgraph Multi_Agent_Service["4. CrewAI Multi-Agent Microservice (Python FastAPI :8001)"]
        Agent_Researcher["Tech Lead Labor Market Researcher (Tavily Web Search)"]
        Agent_Planner["Curriculum Architect & Planner (Growearn Catalog Lookup)"]
        Agent_Reviewer["Principal Engineering Reviewer (Feasibility & Schema Audit)"]
    end

    subgraph Services_Layer["5. Core Domain Services (LangChain Orchestrated)"]
        Svc_Auth["AuthService (Google OAuth 2.0 & Session Revocation)"]
        Svc_RAGChain["LangChain RunnableSequence RAG Chain"]
        Svc_Embeddings["BgeM3Embeddings (LangChain Embeddings Subclass)"]
        Svc_Payment["PaymentService (CashfreeProvider)"]
        Svc_Storage["StorageService (LocalStorageProvider with Magic-Byte Checks)"]
        Svc_RAGSync["RAGSyncService (Real-Time Synchronous Entity Ingestion)"]
    end

    subgraph AI_Vector_Store["6. AI & Vector Engine"]
        BGE3["Local BGE-M3 Container (1024-dim Dense Embeddings)"]
        HNSW["pgvector HNSW Cosine Index (document_chunks.embedding, ef_search=40)"]
        FTS["tsvector GIN Full-Text Index (Keyword Retrieval)"]
        RRF["Reciprocal Rank Fusion Hybrid Scorer (k=60)"]
        Groq["Groq Cloud LLM (llama-3.3-70b-versatile with openai/gpt-oss-120b fallback)"]
    end

    subgraph External_Gateways["7. External Gateways & APIs"]
        Cashfree["Cashfree Payments Gateway (PG API v2023-08-01)"]
        Tavily["Tavily Search API (Live Market Grounding)"]
        LocalStorage["Local Object Storage (storage/private with HMAC URLs)"]
    end

    subgraph Database_Layer["8. PostgreSQL 16 Persistence Layer (Prisma ORM)"]
        DB_User["User & Profile (Canonical Role CHECK Constraints)"]
        DB_Roadmap["CareerRoadmap (Phases & Multi-Agent Traces)"]
        DB_Jobs["Job, Application, & Candidate"]
        DB_Courses["Course, CourseModule, Lesson & Purchase"]
        DB_Mentors["MentorProfile & MentorshipBooking"]
        DB_Payments["PaymentOrder, Payment & WebhookEvent"]
        DB_Audit["AuditLog (Immutable Append-Only Records)"]
        DB_Chunks["document_chunks (vector(1024) + tsv)"]
        DB_RateLimit["RateLimit (Multi-Instance Database Rate Limiter)"]
    end

    UI_Learner --> MW
    UI_Freelancer --> MW
    UI_Mentor --> MW
    UI_Company --> MW
    UI_Admin --> MW

    MW --> Ctrl_Auth
    MW --> Ctrl_AI
    MW --> Ctrl_Agentic
    MW --> Ctrl_Jobs
    MW --> Ctrl_Mentors
    MW --> Ctrl_Payments
    MW --> Ctrl_Admin
    MW --> Ctrl_Storage
    MW --> Ctrl_Health

    Ctrl_Agentic --> Multi_Agent_Service
    Agent_Researcher --> Tavily
    Agent_Planner --> DB_Courses
    Agent_Planner --> DB_Mentors
    Agent_Researcher --> Agent_Planner
    Agent_Planner --> Agent_Reviewer
    Agent_Reviewer --> Ctrl_Agentic
    Ctrl_Agentic --> DB_Roadmap

    Ctrl_AI --> Svc_RAGChain
    Svc_RAGChain --> Svc_Embeddings
    Svc_Embeddings --> BGE3
    BGE3 --> HNSW
    Ctrl_AI --> FTS
    HNSW --> RRF
    FTS --> RRF
    RRF --> Groq

    Ctrl_Payments --> Svc_Payment
    Svc_Payment --> Cashfree
    Svc_Storage --> LocalStorage

    Ctrl_Jobs --> DB_Jobs
    Ctrl_Jobs --> Svc_RAGSync
    Svc_RAGSync --> DB_Chunks
    Ctrl_Mentors --> DB_Mentors
    Ctrl_Admin --> DB_Audit
    Svc_Payment --> DB_Payments
    Svc_Payment --> DB_Courses
```

---

### Key Data Flows

#### 1. AI Semantic RAG & Multi-Signal Hybrid Search
1. **User Query**: Learner queries a skill or target role (e.g. `Next.js 16`, `Spring Boot`).
2. **In-Memory LRU Cache**: Checks 250-item LRU cache (<0.05ms hit). On miss, generates 1024-dimensional dense vector via local BGE-M3 service.
3. **Hybrid ANN & FTS Search**: Executes parameterized `pgvector` HNSW cosine search (`SET LOCAL hnsw.ef_search = 40`) and PostgreSQL `tsvector` full-text search in parallel.
4. **Reciprocal Rank Fusion (RRF)**: Merges dense and lexical results using $\text{Score} = \sum \frac{1}{60 + \text{Rank}}$.
5. **Multi-Signal Scorer & Groq LLM**: Combines vector similarity (35%), skill overlap (35%), mentor rating (15%), and experience level (15%), passing formatted context to Groq (`llama-3.3-70b-versatile`).

#### 2. Cashfree Payment, HMAC-SHA256 Webhooks & Entitlements
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

#### 6. Agentic Multi-Agent Career Roadmap (CrewAI & Tavily)
1. **User Request**: Authenticated learner clicks "Generate with CrewAI Multi-Agent" on `/learner/dashboard` for a skill target (e.g. `Next.js 16`).
2. **Next.js Dispatch**: Route `/api/ai/roadmap/agentic` enforces rate limits and authentication, serializes learner profile and hours, and dispatches `POST /roadmap` to the internal Python FastAPI microservice (`http://agents:8001`).
3. **Sequential Crew Execution**:
   - **Researcher Agent**: Executes live market research using Tavily Search tool calls to identify industry demand, current best practices, and ecosystem libraries.
   - **Planner Agent**: Queries the Growearn course and mentor catalog to design a 4-phase structured progression with realistic time budgets.
   - **Reviewer Agent**: Audits curriculum coherence, checks prerequisites, and validates output against strict Pydantic JSON schemas.
4. **Persistence & UI Feedback**: Next.js receives the validated `RoadmapResponse`, stores the roadmap and agent execution traces in PostgreSQL, and renders milestone phases with live research references in the learner dashboard.
5. **Resilient Local Degradation**: If the agent service is offline or takes > 60s, the system automatically falls back to deterministic single-pass roadmap generation.

---

## 📂 Project Directory Structure

```text
growearn/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI/CD pipeline (Node + Python Pytest)
├── agents/                      # CrewAI Multi-Agent Python Microservice (FastAPI :8001)
│   ├── app/
│   │   ├── crew.py              # 3-agent Crew (Researcher, Planner, Reviewer) & sequential execution
│   │   ├── main.py              # FastAPI server routes (/health, /roadmap)
│   │   ├── schemas.py           # Pydantic input/output schemas (RoadmapRequest, RoadmapResponse)
│   │   └── tools.py             # TavilySearchTool and GrowearnCatalogLookupTool
│   ├── tests/
│   │   ├── test_api.py          # FastAPI endpoint integration tests
│   │   └── test_crew.py         # Multi-agent crew tests & fallback verification
│   ├── Dockerfile               # Production Python 3.11 slim container
│   ├── pyproject.toml           # Agent dependencies and test configuration
│   └── requirements.txt         # Pinned crewai, fastapi, uvicorn, pydantic, httpx, pytest
├── assets/                      # High-resolution README graphics & diagrams
├── docs/                        # Deep architectural, security, AI, and payment docs
│   ├── agents.md                # CrewAI 3-agent architecture, tools, task flow, and fallback docs
│   ├── ai.md                    # LangChain, 1024-dim BGE-M3 RAG, HNSW and RRF hybrid search specs
│   ├── architecture.md          # Multi-layer system design and entity relationships
│   ├── benchmarks.md            # Vector search latency & recall benchmarks (Exact vs HNSW vs Hybrid)
│   ├── payments.md              # Cashfree PG implementation, HMAC-SHA256 signatures, and webhooks
│   └── security.md              # Google OAuth 2.0, RBAC, IDOR defense, and audit immutability
├── prisma/                      # Prisma schema and database migrations
│   ├── migrations/              # Versioned migrations (HNSW index, tsvector GIN, check constraints)
│   ├── schema.prisma            # Database schema with role checks, vectors, and indexes
│   └── seed.ts                  # Production-grade seed data (5 roles, zero password footprint)
├── scripts/                     # Operational, embedding, and benchmark CLI scripts
│   ├── eval/
│   │   └── queries.json         # 32 ground-truth labeled evaluation queries
│   ├── check-bgem3.ts           # Ollama connectivity diagnostics
│   ├── measure-rag-timing.ts    # Automated latency, recall@5, and MRR benchmark runner
│   └── reembed-all-documents.ts # Batch re-embed all catalog courses, mentors, and jobs
├── src/
│   ├── app/                     # Next.js 16 App Router pages & API routes
│   │   ├── api/ai/              # AI endpoints: courses, mentors, message, skill-analysis, agentic
│   │   ├── company/             # Company dashboard, job publishing, ATS applicant review
│   │   ├── feed/                # Community posts, comments, and discussions
│   │   ├── freelancer/          # Freelancer dashboard, proposals, and matched jobs
│   │   ├── jobs/                # Public job board and application portal
│   │   ├── learner/             # Learner dashboard, multi-agent roadmaps, course tracking
│   │   ├── login/               # Zero-password Google OAuth sign-in portal
│   │   ├── mentor/              # Mentor studio, session management, and earnings ledger
│   │   ├── messages/            # Real-time private chat interface
│   │   └── signup/              # Zero-password Google OAuth registration portal
│   ├── components/              # Modular, reusable React UI components
│   ├── context/                 # React context providers (AuthContext)
│   ├── controllers/             # Domain controllers managing request/response lifecycles
│   ├── lib/
│   │   ├── __tests__/           # Master verification suite and benchmarks
│   │   ├── ai/
│   │   │   ├── embeddings.ts    # In-memory LRU embedding cache (250 entries, 15m TTL)
│   │   │   ├── lc-embeddings.ts # LangChain Embeddings subclass for BGE-M3
│   │   │   ├── lc-llm.ts        # LangChain ChatGroq with resilient fallbacks
│   │   │   ├── rag-chain.ts     # LangChain RunnableSequence RAG pipeline with tracing hook
│   │   │   ├── retriever.ts     # PgVectorRetriever supporting vector and hybrid modes
│   │   │   └── vector-store.ts  # Parameterized Prisma.sql, HNSW ef_search=40, FTS, RRF k=60
│   │   ├── auth.ts              # Google OAuth client, PKCE helpers, session token signing
│   │   ├── constants.ts         # Canonical role enums, platform commissions, fixtures
│   │   ├── prisma.ts            # Singleton Prisma client instance
│   │   └── rate-limiter.ts      # Multi-instance database rate limiter
│   ├── repositories/            # Encapsulated database query and mutation layers
│   ├── services/                # Business services (payment, auth, storage, roadmap)
│   └── validators/              # Zod validation schemas for requests and payloads
├── .dockerignore                # Production Docker build exclusions
├── .env.example                 # Comprehensive environment variable documentation
├── docker-compose.yml           # 5-service orchestration (App, Agents, Postgres, Ollama, Init)
├── Dockerfile                   # Production multi-stage Alpine Node 20 standalone Dockerfile
├── next.config.ts               # Next.js 16 standalone config, CSP headers, and image optimization
├── package.json                 # Project dependencies, build scripts, and test commands
└── README.md                    # Primary project documentation
```

---

## 🛠️ Tech Stack Reference

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | [Next.js](https://nextjs.org/) | `16.3.4` | App Router, Server Actions, API routes, standalone containerization |
| **UI Library** | [React](https://react.dev/) | `19.2.8` | Declarative component UI with React Server Components |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) | `v4.0` | High-performance CSS design tokens and responsive utilities |
| **Multi-Agent AI** | [CrewAI](https://crewai.com/) | `0.102.0` | 3-agent autonomous career roadmap workflow (Researcher, Planner, Reviewer) |
| **Agent API** | [FastAPI](https://fastapi.tiangolo.com/) | `0.115.0` | High-performance Python async microservice (`uvicorn`) |
| **RAG Orchestrator** | [LangChain](https://js.langchain.com/) | `@langchain/core` / `@langchain/groq` | `RunnableSequence` RAG chains, `Embeddings` subclass, structured output |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | `16.x` | Relational persistence, foreign keys, transactions, tsvector FTS |
| **Vector Engine** | [pgvector](https://github.com/pgvector/pgvector) | `0.8.0` | 1024-dimensional cosine distance HNSW vector index (`ef_search = 40`) |
| **ORM** | [Prisma ORM](https://www.prisma.io/) | `6.4.1` | Type-safe database queries, migrations, check constraints |
| **Containerization** | [Docker Compose](https://www.docker.com/) | Multi-Stage | Standalone Next.js, Python FastAPI CrewAI, Postgres 16, Ollama BGE-M3 |
| **AI Embeddings** | [BGE-M3](https://ollama.com/) | `1024-dim` | Dense semantic embeddings served via Ollama / Docker |
| **LLM Inference** | [Groq Cloud](https://groq.com/) | `llama-3.3-70b-versatile` | Low-latency inference with `openai/gpt-oss-120b` fallback |
| **Web Grounding** | [Tavily Search](https://tavily.com/) | REST API | Isolated live web grounding for CrewAI Researcher agent |
| **Payments** | [Cashfree PG](https://www.cashfree.com/) | `v2023-08-01` | Sandbox & Production marketplace checkout, HMAC-SHA256 webhooks |
| **Auth & Security** | Google OAuth & Sessions | `google-auth-library` / `jose` | Exclusive Google OAuth 2.0 / OIDC, PKCE, HttpOnly secure cookies, server-side RBAC |
| **Validation** | [Zod](https://zod.dev/) | `3.24.2` | Runtime schema validation for requests and API inputs |

---

## 🚀 Getting Started & Local Setup

### Prerequisites

- **Node.js**: `v20.x` or higher (LTS recommended)
- **Python**: `3.10+` (for running agents standalone)
- **Docker & Docker Compose**: For containerized orchestration
- **Git**: For version control

---

### Step 1: Clone & Install Dependencies

```bash
git clone https://github.com/tharuntej123/growearn.git
cd growearn
npm install

# Optional: set up Python agent environment
cd agents
pip install -r requirements.txt
cd ..
```

---

### Step 2: Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Key environment variables:

| Variable | Description | Default / Example | Required |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://growearn:growearn_secure_password@localhost:5432/growearn?schema=public` | **Yes** |
| `DIRECT_URL` | Direct PostgreSQL connection string | `postgresql://growearn:growearn_secure_password@localhost:5432/growearn?schema=public` | Optional |
| `AUTH_SECRET` | Secret key for session signing (minimum 32 characters) | `your_secure_32_character_auth_secret_key_here` | **Yes** |
| `AUTH_URL` | Application root URL | `http://localhost:3000` | **Yes** |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID | `your-client-id.apps.googleusercontent.com` | **Yes** |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 Client Secret | `your-google-client-secret` | **Yes** |
| `EMBEDDING_BASE_URL` | Local embedding server URL | `http://127.0.0.1:11434` | **Yes** |
| `BGE_M3_MODEL` | Embedding model identifier | `bge-m3` | **Yes** |
| `GROQ_API_KEY` | Groq Cloud API Key for LLM chat & proposals | `gsk_...` | **Yes** |
| `GROQ_MODEL` | Groq LLM model name | `llama-3.3-70b-versatile` | Optional |
| `AGENTS_SERVICE_URL` | CrewAI Python microservice endpoint | `http://127.0.0.1:8001` (Docker: `http://agents:8001`) | **Yes** |
| `TAVILY_API_KEY` | Tavily API Key (for Researcher agent web search) | `tvly-...` | Optional (graceful fallback) |
| `CASHFREE_ENVIRONMENT` | Cashfree environment (`sandbox` or `production`) | `sandbox` | **Yes** |
| `CASHFREE_CLIENT_ID` | Cashfree Client App ID | `your_cashfree_app_id` | **Yes** |
| `CASHFREE_CLIENT_SECRET` | Cashfree Secret Key | `your_cashfree_secret_key` | **Yes** |

---

### Step 3: Run the Application

#### Method A: Full Stack in Docker Compose

```bash
# Starts Next.js app, Agents microservice, PostgreSQL 16 (pgvector), Ollama, and auto-pulls BGE-M3
npm run docker:up

# Open http://localhost:3000 in your browser
```

#### Method B: Hybrid Mode (Recommended for fast local Next.js development)

```bash
# 1. Start backing services in Docker:
docker compose up postgres embedding-service model-init agents -d

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

Growearn includes an exhaustive, production-grade test suite covering authentication, IDOR isolation, object storage security, pgvector bounds, multi-instance rate limiting, Cashfree payments, CrewAI agent workflows, and Playwright browser E2E workflows.

### Complete Command Reference

| Script | Command | Purpose |
| :--- | :--- | :--- |
| **Typecheck** | `npm run typecheck` | Strict TypeScript compilation (`tsc --noEmit`) |
| **Lint** | `npm run lint` | ESLint rules check on `src/` |
| **Master Tests** | `npm test` | Master end-to-end integration and security test suite |
| **RAG Tests** | `npm run test:rag` | Production RAG pipeline and intent classifier verification |
| **RAG Proof** | `npm run test:rag:proof` | Live semantic RAG and pgvector cosine search proof |
| **RAG Benchmark** | `npm run benchmark` | Vector search recall@5, MRR, and latency benchmark against 32 labeled queries |
| **Agents Tests** | `pytest agents/tests` | CrewAI 3-agent workflow, FastAPI endpoints, and fallback verification |
| **E2E Browser** | `npm run test:e2e` | Playwright automated browser test suite across all 5 roles |
| **Docker Up** | `npm run docker:up` | Build and launch complete containerized stack in background |
| **Docker Down** | `npm run docker:down` | Stop and tear down all containers and networks |

---

## 🛡️ Enterprise Security Hardening

- **Zero Password Footprint**: Legacy passwords completely retired. Authentication handled exclusively via Google OAuth 2.0 with PKCE and OpenID Connect.
- **Database-Level Role CHECK Constraint**: Enforced at the PostgreSQL level (`LEARNER`, `FREELANCER`, `MENTOR`, `COMPANY`, `ADMIN`).
- **Account Takeover Prevention**: Silent account linking based purely on email is blocked. Linking a Google account to an existing profile requires cryptographically signed token verification.
- **IDOR Isolation**: Direct object access on job applications, proposals, candidate resumes, and payment orders requires explicit ownership or administrative authorization.
- **Sole Admin Demotion Protection**: Platform safeguards prevent demoting or deleting the last active platform administrator.
- **Cryptographic Webhook Signatures**: Cashfree webhook payloads require HMAC-SHA256 signature verification with constant-time equality checks (`crypto.timingSafeEqual`) and a 300-second replay attack prevention window.
- **File Upload Protection**: Uploaded resumes undergo MIME type verification, path traversal checks (`../`), and file header magic-byte validation to reject spoofed executable payloads.
- **Append-Only Audit Logs**: Sensitive operations (role changes, refunds, payments, and admin moderation) are recorded in an immutable `AuditLog` table protected against `UPDATE` and `DELETE` queries.
- **Multi-Instance Rate Limiting**: Distributed database rate limiter backed by the PostgreSQL `RateLimit` table (`DatabaseRateLimiter`) with automatic in-memory fallback.
- **Content Security Policy (CSP)**: Hardened CSP headers restricting script, connect, style, and frame sources to trusted origins (Google, Groq, Cashfree, Tavily).

---

## 🔗 System Documentation

For in-depth architectural specifications and implementation guides, refer to the documentation in `/docs`:

- [CrewAI Multi-Agent Architecture](docs/agents.md) — 3-agent CrewAI microservice, Tavily search tool, task chaining, and fallback docs.
- [AI & Vector Engine](docs/ai.md) — LangChain `RunnableSequence`, BGE-M3 1024-dim embeddings, pgvector HNSW, and RRF hybrid search.
- [Vector Search Benchmarks](docs/benchmarks.md) — Exact scan vs HNSW vs Hybrid retrieval latency, Recall@5, and MRR metrics.
- [System Architecture](docs/architecture.md) — Multi-layer system design, controller responsibilities, and entity relationships.
- [Cashfree Payments](docs/payments.md) — Cashfree PG API v2023-08-01 implementation, HMAC-SHA256 signatures, and webhooks.
- [Security Policies](docs/security.md) — Google OAuth 2.0, RBAC, IDOR defense, and audit immutability.

---

## 📜 License

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.

**Author**: [Pagadala Tharun Tej](https://github.com/tharuntej123)  
**Repository**: [github.com/tharuntej123/growearn](https://github.com/tharuntej123/growearn)
