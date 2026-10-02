# GroEarn — Career-Growth Ecosystem

> **“Learn. Build Skills. Get Guidance. Earn. Grow. Mentor — All in One.”**

GroEarn is a production-grade career-growth ecosystem connecting learners, verified professionals, mentors, and employers. Built with Next.js 16, PostgreSQL + pgvector, Prisma ORM, LangChain RAG, and strict Role-Based Access Control (RBAC).

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)** | React 19 Server & Client Components, Turbopack, canonical routing |
| **Styling** | **Tailwind CSS v4** | CSS variables, emerald design tokens, responsive layouts |
| **UI Primitives** | **Radix UI / Sonner / Lucide** | Accessible UI primitives, toast alerts, vector icons |
| **Database** | **PostgreSQL (Neon Serverless)** | Relational entities, foreign keys, unique constraints, and indexes |
| **Vector Database** | **pgvector (`vector(1536)`)** | Cosine similarity document chunk retrieval for grounded RAG |
| **ORM** | **Prisma ORM v6** | Type-safe data modeling and transactional query execution |
| **AI / Embeddings** | **OpenAI (`text-embedding-3-small`)** | Real 1536-dimensional vector embedding generation |
| **LLM Inference** | **Groq API / Llama 3.3 70B** | Grounded explanation, intent classification, and message polishing |
| **Authentication** | **Stateless JWT & Bcrypt** | Salted password hashing, HttpOnly secure cookies, RBAC edge middleware |
| **Validation** | **Zod v3** | Runtime schema validation for all API inputs and authentication payloads |
| **Testing** | **TSX & Automated Master Suite** | Unit, integration, security, and full multi-dashboard lifecycle tests |

---

## 🌟 Implemented Role Workflows

### 1. 🎓 Learner Experience (`/learner/dashboard`)
- **Skill-First Discovery:** Input a skill (e.g. `Java`, `Next.js`, `Python AI`) to retrieve structured database-backed roadmaps.
- **Top 5 Courses:** Multi-signal ranked courses from the PostgreSQL catalog.
- **Top 5 Mentors:** Real mentor profiles with verified expertise and hourly coaching rates.
- **Duplicate-Free Pagination:** "Next 5 Courses / Mentors" pagination strictly excludes already displayed IDs.
- **Course Enrollment:** Real database persistence in `Enrollment` with duplicate prevention.
- **1-on-1 Mentorship Requests:** Transactional mentorship requests with status tracking (`PENDING`, `ACCEPTED`, `REJECTED`).

### 2. 💼 Professional Experience (`/professional/dashboard`)
- **Job Discovery:** Real industry job postings with full descriptions, compensation ranges, and skill requirements.
- **5-Factor Hybrid Match Scoring:** Transparent scoring based on skills (50%), experience (20%), location (10%), career goal (10%), and AI relevance (10%).
- **Job Applications:** Persisted application submission with cover letters and real-time status tracking (`APPLIED`, `SHORTLISTED`, `INTERVIEW`, `HIRED`, `REJECTED`).
- **Profile & Resume Management:** Server-side file upload (PDF/DOCX up to 5MB) with metadata persistence.

### 3. 👨‍🏫 Mentor Experience (`/mentor/dashboard`)
- **Mentor Profile Studio:** Configure expertise tags, bio, hourly rate, and availability calendar.
- **Course Publishing:** Build and publish technical courses with modules, lessons, and required skills to the platform catalog (`/mentor/courses/new`).
- **Mentorship Request Management:** Review pending student requests, accept/reject, and auto-initialize 1-on-1 messaging (`/mentor/requests`).

### 4. 🏢 Employer Experience (`/employer/dashboard`)
- **Company Profile:** Manage organization information, industry, and official website.
- **Job Posting Studio:** Create, publish, and close job postings (`/employer/jobs/new`).
- **Applicant Tracking System (ATS):** Review candidate profiles, match breakdowns, and transition applicants through the hiring pipeline (`/employer/jobs/[id]/applicants`).

### 5. 🛡️ Admin Experience (`/admin/dashboard`)
- **Platform Telemetry:** Live platform metrics for total users, courses, jobs, applications, and messages.
- **User Management & Verification:** Search users, modify roles, and toggle verification status (`/admin/users`).
- **Content Moderation:** Publish, unpublish, and feature courses (`/admin/courses`) and jobs (`/admin/jobs`).
- **Security Audit Logging:** Immutable telemetry tracking authentication and administrative actions (`/admin/audit`).

---

## 🔒 Security & RBAC Specifications

- **ADMIN Self-Registration Prevention:** The `ADMIN` role is blocked from all public registration endpoints (`/api/auth/register`, `/api/auth/role-select`).
- **JWT Environment Enforcement:** Fails safely if `JWT_SECRET` is missing in production; no insecure fallbacks.
- **IDOR Protection:** Backend validation ensures employers can only manage their own jobs/applications and users can only view their own private conversations.
- **Input Validation:** Every route validates payloads via Zod schemas before database execution.

---

## 🚀 Getting Started Locally

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/tharuntej123/growearn.git
cd growearn
npm ci
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and configure your database URL and secrets:
```bash
cp .env.example .env
```

### 3. Synchronize Database & Seed
```bash
npx prisma generate
npx prisma db push
npm run prisma:seed
```

### 4. Run Test & Quality Suite
```bash
npm run typecheck
npm run lint
npm test
npm run build
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 Feature Implementation Status

| Feature Domain | Status | Notes |
| :--- | :--- | :--- |
| **Authentication & RBAC** | ✅ Implemented | Bcrypt, JWT in HttpOnly cookies, ADMIN escalation prevention, AuditLog |
| **Canonical Routing** | ✅ Implemented | `/learner/*`, `/professional/*`, `/mentor/*`, `/employer/*`, `/admin/*` with 307 redirects |
| **Skill Roadmaps** | ✅ Implemented | Database-backed roadmaps with structured phases, hours, and difficulty |
| **Course Catalog & Enrollment** | ✅ Implemented | Multi-module syllabus, DB enrollment persistence, duplicate blocking |
| **Mentorship Requests** | ✅ Implemented | Real requests, status transitions (`PENDING` $\to$ `ACCEPTED`), conversation creation |
| **Job Discovery & Applications**| ✅ Implemented | 5-factor hybrid scoring, application persistence, ATS candidate review |
| **Direct Messaging** | ✅ Implemented | PostgreSQL persistence, participant validation, AI tone improver |
| **Admin Moderation & Audit** | ✅ Implemented | User role management, course/job moderation, security audit logs |
| **Vector Search (pgvector)** | ✅ Implemented | 1536-dim embeddings with OpenAI text-embedding-3-small and graceful keyword fallback |
| **Resume File Storage** | ✅ Implemented | Server-side MIME/size validation (5MB max) with DB URL persistence |
| **Payment Gateways** | ⏳ Planned / Isolated | Integrated payment provider interfaces ready for Stripe/Razorpay webhooks |
