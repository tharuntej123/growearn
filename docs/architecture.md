# Unified Freelancing Platform — Architecture Overview

## 1. System Design & Architectural Vision

The **Unified Freelancing Platform** bridges the fragmented tech talent journey:
$$\text{Learn (Udemy)} \longrightarrow \text{Work & Gigs (Upwork)} \longrightarrow \text{Mentorship} \longrightarrow \text{Network (LinkedIn)} \longrightarrow \text{AI Guidance}$$

```mermaid
graph TD
    subgraph Frontend ["Next.js App Router (React 19, Tailwind CSS, Lucide)"]
        UI_Pages["Landing, Feed, Dashboards, Jobs, Courses, Mentors, AI Assistant"]
        Context["AuthProvider & Global State"]
    end

    subgraph API_Layer ["API Layer (/api/*)"]
        Middleware["JWT Session & RBAC Middleware"]
        Controllers["Controllers (Zod Validation, HTTP Responses)"]
    end

    subgraph Service_Layer ["Service Layer"]
        AuthService["AuthService"]
        JobService["JobService"]
        CourseService["CourseService"]
        FeedService["FeedService"]
        AIService["AI Engine (/lib/ai)"]
    end

    subgraph Data_Layer ["Data Access & Abstractions"]
        Repos["Repositories (User, Job, Course, Post, Mentor)"]
        JobProvider["JobProvider Abstraction (Mock & External APIs)"]
        PaymentProvider["PaymentProvider Abstraction (Mock & Stripe)"]
        Prisma["Prisma ORM Client"]
        DB[("PostgreSQL / SQLite Database")]
    end

    UI_Pages --> Middleware --> Controllers
    Controllers --> Service_Layer
    Service_Layer --> Data_Layer
    Repos --> Prisma --> DB
```

## 2. Clean Layered Architecture Principles

1. **Controllers (`src/controllers/`)**: Validate request inputs via Zod schemas and format HTTP status codes using `apiSuccess` and `apiError`.
2. **Services (`src/services/`)**: Encapsulate business logic, orchestration, and domain rules.
3. **Repositories (`src/repositories/`)**: Abstract Prisma queries and database interactions.
4. **AI Engine (`src/lib/ai/`)**: Deterministic 5-factor hybrid scoring algorithms combined with fallback mock AI or LLM generation.
5. **Providers (`JobProvider`, `PaymentProvider`)**: Extensible interfaces allowing third-party API integration without touching business logic.
