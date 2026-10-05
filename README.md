# GroEarn — Career & Talent Ecosystem

> **“Learn. Build Skills. Get Guidance. Earn. Grow. Mentor — All in One.”**

GroEarn is a production-grade career and talent ecosystem bridging learning, 1-on-1 mentorship, professional work contracts, and intelligent hiring. Built with Next.js 16, PostgreSQL + pgvector, Prisma ORM, real OpenAI embeddings RAG, Razorpay payments, and strict Role-Based Access Control (RBAC).

---

## 🛠️ Technology Stack

| Layer | Technology | Implementation Details |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)** | React 19 Server & Client Components, Turbopack, canonical routing |
| **Styling** | **Tailwind CSS v4** | CSS tokens, emerald design system, responsive layouts |
| **UI Primitives** | **Radix UI / Sonner / Lucide** | Accessible primitives, toast notifications, vector icons |
| **Database** | **PostgreSQL (pg15+)** | Relational integrity, foreign keys, unique constraints, and indexes |
| **Vector Engine** | **pgvector (`vector(1536)`)** | HNSW graph cosine indexing on `document_chunks` for grounded RAG |
| **ORM** | **Prisma ORM v6** | Type-safe migrations (`prisma migrate deploy`), transactional queries |
| **AI / Embeddings** | **OpenAI (`text-embedding-3-small`)** | Real 1536-dimensional vector embedding generation |
| **Payments** | **Razorpay SDK** | Server-side order creation, HMAC-SHA256 verification, idempotent webhooks |
| **Authentication** | **Stateless JWT & Bcrypt** | Fail-closed runtime validation, HttpOnly Secure SameSite cookies, RBAC |
| **Validation** | **Zod v3** | Runtime schema validation across all API routes and models |
| **Testing** | **Automated Master Suite & Playwright** | Unit, integration, security, RAG proof, performance benchmarks, and E2E |

---

## 🌟 Implemented Role Workflows

### 1. 🎓 Learner Experience (`/learner/dashboard`)
- **Skill-First RAG Discovery:** Input a skill (e.g. `Java`, `Next.js`, `Machine Learning`) to retrieve database-backed roadmaps via real pgvector embeddings.
- **Top 5 Courses & Mentors:** Multi-signal ranked courses and expert mentors with duplicate-free pagination.
- **Paid Course Checkout:** Complete Razorpay INR payments to unlock course entitlements and lesson access.
- **1-on-1 Mentorship Booking:** Book coaching sessions, process verified payments, and unlock real-time direct messaging.

### 2. 💼 Professional Experience (`/professional/dashboard`)
- **Semantic Job Matching:** Multi-signal ranking based on verified skills (50%), experience (20%), location (10%), career goal (10%), and pgvector similarity (10%).
- **Job Applications:** Submit applications with cover letters and track status (`APPLIED`, `SHORTLISTED`, `INTERVIEW`, `ACCEPTED`, `REJECTED`).
- **Portfolio & Resumes:** Upload resumes with metadata extraction and verified skill badges.

### 3. 👨‍🏫 Mentor Experience (`/mentor/dashboard`)
- **Course Studio:** Author and publish free or paid technical courses with video modules and lessons (`/mentor/courses/new`).
- **Mentorship Offerings:** Set hourly rates and manage incoming student requests (`/mentor/requests`).
- **Earnings & Revenue Analytics:** Live telemetry calculating gross earnings, 10% platform fee, net revenue, and transaction history (`/api/payments/mentor/earnings`).

### 4. 🏢 Employer Experience (`/employer/dashboard`)
- **Job Posting Studio:** Create, publish, and manage job listings (`/employer/jobs/new`).
- **Semantic Candidate Matching:** Query candidate chunks using real embeddings to discover top-fit verified talent.
- **Applicant Tracking System (ATS):** Review candidate profiles, match score explanations, and manage hiring pipeline stages (`/employer/jobs/[id]/applicants`).

### 5. 🛡️ Admin Experience (`/admin/dashboard`)
- **Platform Telemetry:** Live analytics for users, courses, jobs, applications, payments, and messages.
- **User & Verification Management:** Manage roles and moderation status (`/admin/users`).
- **Security Audit Logs:** Immutable telemetry tracking authentication and administrative actions (`/admin/audit`).

---

## 🔒 Security & RBAC Policies

- **Strict JWT Secret Enforcement:** Fails closed if `JWT_SECRET` is missing or $< 32$ characters; zero hardcoded fallback secrets.
- **Cookie Security:** `HttpOnly: true`, `SameSite: lax`, `Secure: true` in production.
- **IDOR Protection:** Strict ownership checks across all mentorship, job, application, resume, and payment endpoints.
- **Payment Verification:** Server calculates authoritative amounts, validates HMAC-SHA256 signatures, and processes webhooks idempotently using unique database constraints.
- **Cloud Storage Fail-Closed:** Explicit failure in production if cloud credentials fail (no silent local fallbacks).
- **Demo Mode Isolation:** Demo credentials and quick-login shortcuts are guarded behind `DEMO_MODE=true`.

---

## 🚀 Getting Started Locally

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/tharuntej123/growearn.git
cd growearn
npm ci
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your PostgreSQL connection string:
```bash
cp .env.example .env
```

### 3. Run Migrations & Seed Database
```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
```

### 4. Run Test Suites
```bash
# Typecheck & Lint
npm run typecheck
npm run lint

# Master Unit, Integration, Payment & Security Test Suite
npm test

# pgvector Semantic RAG Proof
npm run test:rag:proof

# Realistic Concurrent Performance Benchmark
npm run test:load

# Playwright E2E Verification
npm run test:e2e
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
