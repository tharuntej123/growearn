# GrowEarn — Production Architecture & Engineering Specification

> **Enterprise Multi-Role Career Platform: Learner • Professional • Mentor • Employer • Admin**  
> *End-to-end full-stack platform built with Next.js 16 App Router, PostgreSQL + pgvector, LangChain RAG, Prisma ORM, and Zero-Trust RBAC.*

---

## 🏛️ System Architecture Overview

GroEarn is built as a **modular monolith** that connects the full career lifecycle:
**Learn → Build Skills → Get Guidance → Earn → Grow → Mentor**

```mermaid
graph TD
    subgraph Presentation_Layer["1. Frontend Presentation Layer (Next.js 16 App Router)"]
        UI_Learner["Learner Hub (/learner/*)"]
        UI_Pro["Professional Hub (/professional/*)"]
        UI_Mentor["Mentor Studio (/mentor/*)"]
        UI_Employer["Employer ATS (/employer/*)"]
        UI_Admin["Admin Console (/admin/*)"]
    end

    subgraph Security_Routing["2. Security & Routing Layer"]
        MW["Edge Middleware (RBAC, Canonical 307 Redirects & JWT Verification)"]
    end

    subgraph Application_Layer["3. Backend Application Layer (Controllers, Services & Repositories)"]
        Ctrl_Auth["AuthController (/api/auth)"]
        Ctrl_Job["JobController (/api/jobs)"]
        Ctrl_Course["CourseController (/api/courses)"]
        Ctrl_Mentor["MentorController (/api/mentors)"]
        Ctrl_Msg["MessagingController (/api/messages)"]
        Ctrl_Admin["AdminController (/api/admin)"]
        
        Svc_Auth["AuthService (Bcrypt, JWT, AuditLog)"]
        Svc_SkillRAG["SkillRAGService (Multi-Signal Ranking)"]
        Svc_Storage["StorageService (5MB PDF/DOCX Validation)"]
        
        Repo_User["UserRepository"]
        Repo_Job["JobRepository"]
        Repo_Course["CourseRepository"]
        Repo_Mentor["MentorRepository"]
        Repo_Msg["MessagingRepository"]
        Repo_Roadmap["RoadmapRepository"]
        Repo_Admin["AdminRepository"]
    end

    subgraph AI_RAG_Layer["4. AI & pgvector RAG Engine"]
        Embeddings["Embedding Provider (OpenAI text-embedding-3-small)"]
        VectorStore["PgVectorStore (PostgreSQL pgvector Cosine Distance)"]
        Skill_RAG["SkillRAGService (Multi-Signal Weighted Scorer)"]
        RAG_Chain["ProductionRAGChain (Grounded Context Composition)"]
        LLM_Client["Groq LLM Client (Llama 3.3 70B)"]
    end

    subgraph Persistence_Layer["5. Database Persistence Layer (Neon PostgreSQL & Prisma ORM)"]
        DB_Users["User, Profile, Skill & AuditLog Records"]
        DB_Courses["Course, CourseModule, Lesson & Enrollment Records"]
        DB_Mentors["MentorProfile & MentorshipRequest Records"]
        DB_Jobs["Job & Application Records"]
        DB_Msg["Conversation & Message Records"]
        DB_PgVector["pgvector document_chunks Table (vector(1536))"]
    end

    UI_Learner --> MW
    UI_Pro --> MW
    UI_Mentor --> MW
    UI_Employer --> MW
    UI_Admin --> MW

    MW --> Ctrl_Auth
    MW --> Ctrl_Job
    MW --> Ctrl_Course
    MW --> Ctrl_Mentor
    MW --> Ctrl_Msg
    MW --> Ctrl_Admin

    Ctrl_Auth --> Svc_Auth
    Ctrl_Course --> Svc_SkillRAG
    Ctrl_Mentor --> Svc_SkillRAG
    Ctrl_Job --> Repo_Job
    Ctrl_Msg --> Repo_Msg
    Ctrl_Admin --> Repo_Admin

    Svc_SkillRAG --> VectorStore
    VectorStore --> DB_PgVector
    RAG_Chain --> VectorStore
    RAG_Chain --> LLM_Client

    Svc_Auth --> Repo_User
    Repo_User --> DB_Users
    Repo_Job --> DB_Jobs
    Repo_Course --> DB_Courses
    Repo_Mentor --> DB_Mentors
    Repo_Msg --> DB_Msg
    Repo_Roadmap --> DB_Users
    Repo_Admin --> DB_Users
```

---

## 🔒 Security Architecture & Role Escalation Prevention

1. **Strict RBAC Enforcement:**
   - Public registration endpoints (`/api/auth/register`, `/api/auth/role-select`) reject the `ADMIN` role via Zod validation schemas and `AuthService` guards.
   - Admin accounts can only be assigned through direct database migrations or authorized administrative operations.
2. **Password & JWT Security:**
   - Passwords hashed with `bcryptjs` (salt rounds = 10).
   - JWT tokens signed with mandatory environment secrets (`JWT_SECRET`) without insecure fallbacks in production.
   - Tokens stored in `HttpOnly`, `SameSite=lax`, `Secure` cookies.
3. **Audit Logging:**
   - Immutable security audit logs recorded for every authentication attempt (login, registration, failed logins) and administrative mutation (role modifications, verification toggles, course/job moderation).
4. **Ownership Verification & IDOR Prevention:**
   - Direct object reference protection on all mutation endpoints:
     - Messaging: A user can only access or dispatch messages to conversations where they are a verified participant.
     - Jobs: Employers can only edit, close, or view applicants for jobs created by their organization.
     - Mentors: Mentors can only accept or reject requests directed to their mentor profile.

---

## 🧭 Canonical Role-Based Routing

| Role | Canonical Root | Accessible Features |
|---|---|---|
| **LEARNER** | `/learner/dashboard` | Skill-First Discovery, Database Roadmaps, Top 5 Courses/Mentors, Real Enrollment, 1-on-1 Mentorship Requests |
| **PROFESSIONAL** | `/professional/dashboard` | Job Discovery, 5-Factor Hybrid Match Scoring, Application Submission, Application Pipeline Tracker (`/professional/applications`), Portfolio & Resume Management |
| **MENTOR** | `/mentor/dashboard` | Mentor Profile Management, Course Publishing Studio (`/mentor/courses/new`), Mentorship Request Approvals (`/mentor/requests`), Student Messaging |
| **EMPLOYER** | `/employer/dashboard` | Job Creation & Publishing (`/employer/jobs/new`), Applicant Pipeline (`/employer/jobs/[id]/applicants`), Candidate Status Transitions, Direct Candidate Messaging |
| **ADMIN** | `/admin/dashboard` | User Management (`/admin/users`), Course Moderation (`/admin/courses`), Job Moderation (`/admin/jobs`), Security Audit Logs (`/admin/audit`), Real-Time Platform Telemetry |

*Legacy backward-compatibility:* Routes such as `/student/dashboard`, `/company/dashboard`, and `/freelancer/dashboard` issue 307 redirects to their canonical equivalents.

---

## 🧠 AI, Vector Retrieval & Multi-Signal Scoring

GroEarn enforces a clean separation of concerns:
```text
PostgreSQL (Source of Truth)
        ↓
pgvector Cosine Retrieval / Semantic Search
        ↓
Deterministic Multi-Signal Business Ranking
        ↓
LLM Grounded Personalization & Explanation
        ↓
Structured User Response
```

### Multi-Signal Ranking Formula
Recommendations do not rely on hardcoded scores or fake confidence claims. Instead, candidate items are ranked using a multi-factor transparent formula:
$$\text{Final Score} = (\text{Vector Similarity} \times 0.35) + (\text{Skill Overlap} \times 0.35) + (\text{Quality Rating} \times 0.15) + (\text{Level Match} \times 0.15)$$

### Pagination & Zero Duplicates
The "Next 5 Courses" and "Next 5 Mentors" endpoints accept an `excludeIds` array parameter to strictly prevent duplicate recommendations across pagination pages.

---

## 📁 File Storage Abstraction
- Resumes are validated on the server for MIME type (`application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`) and maximum file size (5 MB limit).
- Persisted locally under `public/uploads/resumes/` with sanitized timestamped filenames and stored in `Profile.resumeUrl`.
- Pluggable storage service architecture allows switching to S3, Cloudflare R2, or Google Cloud Storage via `STORAGE_PROVIDER`.

---

## 🧪 Verification & Automated Testing Suite

All tests can be executed via the standard commands:

```bash
# 1. Generate Prisma Client
npx prisma generate

# 2. Synchronize PostgreSQL Database
npx prisma db push

# 3. Seed Production Database
npm run prisma:seed

# 4. Run TypeScript Typecheck
npm run typecheck

# 5. Run ESLint Quality Check
npm run lint

# 6. Run Master Automated Test Suite
npm test

# 7. Run Next.js Production Build
npm run build
```
