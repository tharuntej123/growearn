# 🚀 GroEarn — Career, Talent & Mentorship Ecosystem

> **“Learn. Build Skills. Get Guidance. Earn. Grow. Mentor — All in One Platform.”**

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![pgvector](https://img.shields.io/badge/pgvector-1024--dim%20HNSW-blue?style=flat-square)](https://github.com/pgvector/pgvector)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.4.1-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Cashfree](https://img.shields.io/badge/Cashfree-v2023--08--01-green?style=flat-square)](https://www.cashfree.com/)
[![Razorpay](https://img.shields.io/badge/Razorpay-v2.9.8-0C2340?style=flat-square&logo=razorpay)](https://razorpay.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Playwright](https://img.shields.io/badge/Playwright-v1.63-45ba4b?style=flat-square&logo=playwright)](https://playwright.dev/)

---

## 💡 Why GroEarn? (What Problem It Solves)

### The Problem
Building a tech career today is fragmented and frustrating:
- **Disjointed Learning:** Students learn skills on video sites without personalized career roadmaps or verified outcomes.
- **Isolated Mentorship:** Aspiring professionals struggle to find experienced 1-on-1 mentors for actionable guidance.
- **High-Commission Freelance Platforms:** Freelancers lose up to 20% in fees and compete against generic, unverified proposals.
- **Opaque Hiring:** Recruiters drown in hundreds of unvetted resumes without transparent skill matching.

### Our Solution
**GroEarn** connects every stage of professional development into one seamless flywheel:

$$\text{Learn Roadmaps} \longrightarrow \text{Master Courses} \longrightarrow \text{1-on-1 Mentorship} \longrightarrow \text{Freelance Contracts} \longrightarrow \text{Full-Time Hiring} \longrightarrow \text{Give Back as a Mentor}$$

---

## 🎬 Quick Demo & Test Accounts

Run the platform locally and log in using any pre-seeded demo account:

| Role | Demo Email | Password | What You Can Explore |
| :--- | :--- | :--- | :--- |
| 🎓 **Learner / Student** | `student@example.com` | `Demo1234!` | Skill RAG roadmaps, course checkout, 1-on-1 mentorship bookings |
| 💼 **Freelancer / Pro** | `professional@example.com` | `Demo1234!` | 5-factor hybrid job matching, AI proposal writer, application tracker |
| 👨‍🏫 **Expert Mentor** | `priya.sharma@example.com` | `Demo1234!` | Course creation studio, student booking requests, live earnings telemetry |
| 🏢 **Company / Employer** | `careers@novatech-solutions.io` | `Demo1234!` | Job posting studio, AI candidate search, ATS applicant pipeline |
| 🛡️ **System Administrator** | `admin@example.com` | `Demo1234!` | Real-time platform counters, user moderation, immutable audit logs |

---

## 🏛️ System Architecture Overview

```mermaid
graph TD
    subgraph Presentation_Layer["1. Frontend Presentation Layer (Next.js 16 App Router)"]
        LearnerUI["Learner Hub (/learner/*)"]
        FreelancerUI["Freelancer Hub (/freelancer/*)"]
        MentorUI["Mentor Studio (/mentor/*)"]
        EmployerUI["Employer ATS (/employer/*)"]
        AdminUI["Admin Console (/admin/*)"]
    end

    subgraph Edge_Security["2. Edge Security & Routing"]
        Middleware["Edge Middleware (Stateless JWT, Zero-Trust RBAC & Rate Limiting)"]
    end

    subgraph Core_Services["3. Core Backend Services"]
        AuthSvc["Auth & User Service"]
        SkillRAG["Skill & Roadmap RAG Engine"]
        PaymentSvc["Payment Engine (Cashfree & Razorpay)"]
        JobSvc["Job & ATS Matching Service"]
        StorageSvc["Multi-Provider Storage (Local/S3)"]
    end

    subgraph AI_Vector_Engine["4. AI & Vector Engine"]
        BGE3["Local BGE-M3 Embeddings (1024 dims)"]
        PgVector["PostgreSQL pgvector (HNSW Cosine Index)"]
        GroqLLM["Groq High-Speed LLM (Llama 3.3 70B & GPT-OSS 120B)"]
    end

    subgraph Payment_Gateways["5. Payment Gateways"]
        Cashfree["Cashfree Marketplace PG (v2023-08-01)"]
        Razorpay["Razorpay Gateway"]
    end

    subgraph Persistence["6. PostgreSQL Database (Prisma ORM v6)"]
        DB[(PostgreSQL 15+ & pgvector)]
    end

    LearnerUI --> Middleware
    FreelancerUI --> Middleware
    MentorUI --> Middleware
    EmployerUI --> Middleware
    AdminUI --> Middleware

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

## 🔄 Key Data Flows

### 1. Skill-First Learning & RAG Roadmaps
```text
User Enters Skill (e.g. "Java", "Next.js")
       ↓
Local BGE-M3 generates 1024-dim vector embedding
       ↓
pgvector HNSW Cosine Search retrieves matching curriculum chunks
       ↓
Deterministic Multi-Signal Ranker orders Top 5 Courses & Expert Mentors
       ↓
Learner follows structured milestones and tracks real-time progress
```

### 2. 5-Factor Semantic Job Matching
```text
Freelancer Profile (Skills, Experience, Location, Career Goal)
       ↓
Weighted Matching Algorithm:
  • Verified Skills Overlap: 50%
  • Experience Level Match:  20%
  • Location Alignment:      10%
  • Career Goal Fit:         10%
  • pgvector Cosine Match:   10%
       ↓
Personalized Match Score + AI Cover Letter Generator + Application Pipeline
```

### 3. Marketplace Payments & Instant Entitlement Unlock
```text
Learner Purchases Course / Books Mentorship Session
       ↓
Server creates authoritative Order via Cashfree / Razorpay (with payment_session_id)
       ↓
Client completes secure checkout
       ↓
Cryptographic Webhook Signature Verified (HMAC-SHA256, 5-min replay window, timing-safe equality)
       ↓
Transactional Database Unlock: CoursePurchase / MentorshipBooking Created
       ↓
Platform Split: 10% Platform Commission / 90% Mentor Net Payout Ledger Recorded
```

---

## 🛠️ Active Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16.3.4 (App Router)** | React 19.2 Server/Client Components, Turbopack, Streaming SSR |
| **Styling & Design** | **Tailwind CSS v4** | CSS tokens, emerald/teal palette, Lucide icons, Sonner toasts, Radix primitives |
| **Database & ORM** | **PostgreSQL 15+ & Prisma 6.4.1** | Foreign keys, unique constraints, transactional queries, schema migrations |
| **Vector Search Engine** | **pgvector (`vector(1024)`)** | HNSW graph cosine distance indexing (`<=>`) on `document_chunks` |
| **AI & Embeddings** | **Local BGE-M3 & Groq LLM** | 1024-dim embeddings via local serving + Groq Llama 3.3 70B / GPT-OSS 120B |
| **Payments** | **Cashfree (v2023-08-01) & Razorpay** | Multi-provider marketplace payments, HMAC-SHA256 signatures, refunds, telemetry |
| **Auth & Security** | **Stateless JWT & Bcrypt** | Fail-closed runtime validation, HttpOnly Secure cookies, Zero-Trust RBAC |
| **Rate Limiting** | **PostgreSQL DatabaseRateLimiter** | Multi-instance distributed rate limiting backed by `RateLimit` table |
| **Storage & Parsing** | **StorageService & PDF-Parse** | Multi-provider storage (Local disk + AWS S3/R2 cloud) with resume parser |
| **Testing** | **TSX Runner & Playwright** | Master test suite (47/47 passing), Cashfree suite (21/21), Playwright E2E |

---

## 📁 Project Directory Structure

```text
growearn/
├── e2e/                         # Playwright E2E tests (learner, mentor, company, freelancer, admin)
├── prisma/
│   ├── migrations/              # PostgreSQL database migrations
│   ├── schema.prisma            # Prisma schema with pgvector vector(1024) extension
│   └── seed.ts                  # Production database seed script
├── public/                      # Static assets and icons
├── src/
│   ├── app/                     # Next.js 16 App Router (pages & REST API routes)
│   │   ├── admin/               # Admin dashboard, audit logs, moderation
│   │   ├── ai-assistant/        # AI Career Assistant interface
│   │   ├── api/                 # REST API endpoints (auth, ai, payments, health, jobs, courses)
│   │   ├── community/ / feed/   # Community discussions and technical feed
│   │   ├── company/ / employer/ # Employer dashboard & ATS hiring pipeline
│   │   ├── courses/             # Course catalog, curriculum viewer, player
│   │   ├── freelancer/ / prof/  # Freelancer dashboard, proposals, applications
│   │   ├── jobs/                # Job board and details
│   │   ├── learner/ / student/  # Learner dashboard, roadmaps, course enrollment
│   │   ├── mentor/ / mentors/   # Mentor studio, earnings, booking requests
│   │   └── messages/            # Real-time 1-on-1 direct messaging
│   ├── components/              # Reusable React components & UI primitives
│   ├── controllers/             # Backend domain controllers
│   ├── lib/
│   │   ├── __tests__/           # Master test suite, Cashfree tests, RAG proof, benchmarks
│   │   ├── ai/                  # BGE-M3 embeddings, RAG chain, hybrid matcher, roadmaps
│   │   ├── auth.ts              # Stateless JWT & cookie security
│   │   ├── constants.ts         # Roles, permissions, demo configurations
│   │   ├── prisma.ts            # Prisma client singleton
│   │   └── rate-limiter.ts      # Multi-instance database rate limiter
│   ├── repositories/            # Database access layer
│   ├── services/
│   │   ├── auth.service.ts      # User auth & RBAC validation
│   │   ├── payment/             # Cashfree & Razorpay provider engines
│   │   └── storage.service.ts   # Local and cloud object storage
│   └── validators/              # Zod runtime schemas
├── .env.example                 # Environment configuration template
├── ARCHITECTURE.md              # Technical engineering specification
├── package.json                 # Project dependencies and npm scripts
└── README.md                    # Project overview & documentation
```

---

## 💻 Getting Started Locally

### 1. Prerequisites
- **Node.js:** v20.x or higher
- **PostgreSQL:** Version 15+ with `pgvector` extension enabled
- **Ollama (Optional for local embeddings):** `ollama pull bge-m3`

### 2. Clone & Install Dependencies
```bash
git clone https://github.com/tharuntej123/growearn.git
cd growearn
npm ci
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
```
Open `.env` and configure your database and payment settings:
```ini
DATABASE_URL="postgresql://user:password@localhost:5432/growearn?sslmode=prefer"
JWT_SECRET="your-super-strong-jwt-secret-minimum-32-characters"
PAYMENT_PROVIDER="CASHFREE" # 'CASHFREE' or 'RAZORPAY'
CASHFREE_ENVIRONMENT="sandbox"
CASHFREE_CLIENT_ID="your_cashfree_app_id"
CASHFREE_CLIENT_SECRET="your_cashfree_secret_key"
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

## 🧪 Automated Verification & Testing

Execute the complete verification suite to ensure system integrity:

```bash
# Typecheck & Lint
npm run typecheck
npm run lint

# Master End-to-End Test Suite (13 Suites, 47/47 Passing)
npm test

# Cashfree Payments Integration Suite (21/21 Passing)
npx tsx src/lib/__tests__/cashfree-payment.test.ts

# Live Semantic RAG Infrastructure Proof
npm run test:rag:proof

# Playwright Browser E2E Suite
npm run test:e2e
```

---

## 👥 Contributing

Contributions make the open-source community an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. **Fork the Project**
2. **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your Changes** (`git commit -m 'feat: add some AmazingFeature'`)
4. **Run Tests to Ensure Quality** (`npm test && npm run typecheck`)
5. **Push to the Branch** (`git push origin feature/AmazingFeature`)
6. **Open a Pull Request**

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](file:///g:/ufp/LICENSE) for more information.
