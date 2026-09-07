# Groearn — Career-to-Earning Ecosystem
> **“Learn. Earn. Work. Grow — All in One.”**

Groearn is an AI-powered career-to-earning ecosystem that continuously identifies what a person can do, what they need to learn, which opportunities they are actually ready for, and how to help them successfully transition from learning to earning.

---

## 🛠️ Complete Technology Stack

| Category | Technology / Library | Version | Role & Architectural Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **Next.js** (App Router) | `16.3.4` | React Server Components (RSC), Turbopack bundler, server actions, route handlers, dynamic layout nesting. |
| **UI Library** | **React** / **React DOM** | `19.2.8` | Component rendering, concurrent features, modern hooks (`useTransition`, `useOptimistic`, `useActionState`). |
| **Styling & Design System** | **Tailwind CSS v4** • **PostCSS** | `^4.0.0` | Modern CSS tokens, light emerald palette (`#16A34A` / `#F8FAF9`), glassmorphism, responsive grid layouts. |
| **Component Primitives** | **Radix UI Primitives** • **CVA** • **clsx** • **tailwind-merge** | `latest` | Headless, accessible UI building blocks with dynamic variant composition. |
| **Icons & Micro-Interactions**| **Lucide React** • **Sonner** • **Canvas Confetti** | `^1.16.0` | Scalable vector icon set, interactive toast notifications, milestone celebration animations. |
| **Data Visualization** | **Recharts** | `^2.15.1` | Interactive radar charts for skill gap matrices, revenue metrics, and career analytics. |
| **AI / LLM Orchestration** | **Groq API** • **LangChain** (`@langchain/core`, `@langchain/openai`) | `^1.2.9` | Ultra-low latency inference (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`), RAG agent workflows, multi-turn reasoning. |
| **Resilience & Fallback Engine**| **Multi-Model Dynamic Fallback** • **Deterministic AI Engine** | Built-in | Seamless automatic fallback across models and offline rule-based heuristic engine ensuring zero downtime. |
| **RAG & Context Engine** | **Custom Database RAG Retriever** | Built-in | Grounded retrieval of live jobs, courses, mentors, and user portfolios with zero hallucination. |
| **Form Handling & Validation**| **React Hook Form** • **Zod** • **@hookform/resolvers** | `^7.54` / `^3.24` | Strict client-side and server-side runtime schema validation and error handling. |
| **Authentication & Security** | **Jose** • **JsonWebToken** • **Bcrypt.js** | `^5.9` / `^9.0` | Stateless JWT tokens, HTTP-only secure cookie sessions, salted password hashing, Role-Based Access Control (RBAC). |
| **Database & ORM** | **Prisma ORM** • **PostgreSQL (Neon Serverless)** | `^6.4.1` | Type-safe database queries, declarative migrations, connection pooling, and multi-relational modeling. |
| **Testing & Scripting** | **TSX** • **Node Test Runner** | `^4.19.3` | Direct TypeScript test execution for AI pipelines, job matching algorithms, and database seeding. |
| **Code Quality & CI/CD** | **GitHub Actions** • **ESLint 9** • **TypeScript 5** | `^9.0` / `^5.0` | Automated CI pipeline: multi-platform dependencies, Prisma client generation, TypeScript checking, linting, and production builds. |

---

## 🌟 Key Platform Features & Modules

### 1. 🎓 Learner Hub (`/student/dashboard`)
- **AI Skill Gap Radar**: Evaluates current profile skills against target career paths (e.g., Full Stack, AI/ML, Cloud).
- **Personalized Career Roadmaps**: Step-by-step 4-phase learning tracks with interactive ASCII workflow charts and milestone projects.
- **Interactive Course System**: Video streaming, module progression checklists, mock checkout, and verifiable certificate generation.

### 2. 💼 Professional Workspace (`/professional/dashboard`, `/jobs`)
- **Dual Job Discovery**:
  - **Global Remote Projects**: High-ticket freelance contracts and full-time remote opportunities.
  - **Local Gigs**: On-site local projects filtered by city and state (e.g., Chennai, Bangalore, Hyderabad).
- **AI Proposal Generator**: Generates customized client proposals with architecture outlines, timelines, and deliverables.
- **Dynamic Portfolio Builder**: Interactive experience manager, skill endorsements, education credentials, and project highlights.

### 3. 👨‍🏫 Mentor Coaching Studio (`/mentor/dashboard`, `/mentors`)
- **1-on-1 Mentorship Marketplace**: Set hourly coaching rates, specialties, and bio.
- **Session Booking Pipeline**: Review, accept, or decline student coaching requests with built-in meeting room links.
- **Course Publishing**: Create and publish comprehensive video courses directly to the global catalog.

### 4. 🏢 Company Hiring Pipeline (`/company/dashboard`)
- **2-Way Job Posting**:
  - **Quick Job Poster**: Fast 1-click modal for immediate job broadcasting.
  - **Detailed Job Creator**: Multi-tier specifications (salary, experience level, remote/on-site, technical requirements).
- **5-Factor Candidate Matcher**: Instantly ranks applicants with explainable score breakdowns.
- **Applicant Tracking System (ATS)**: Manage applicant pipeline stages (Applied, Under Review, Interview, Hired, Rejected).

### 5. 🌐 Professional Social Feed (`/feed`)
- **Multi-Category Posts**: Share General updates, Hiring announcements, Project showcases, Certifications, and Career milestones.
- **Real-Time Social Interactions**: Instant likes, threaded comments, user tags, and author profile links.

### 6. 🤖 AI Career Advisor & Assistant (`/ai-assistant`)
- **LangChain RAG Agent**: Chat with an AI advisor grounded in the platform's live database of jobs, courses, and mentors.
- **Tone Polisher**: Transform draft messages into Professional, Friendly, Concise, Persuasive, or Grammar-Corrected variations.
- **Resume Skill Parser**: Extract structured skills, experience levels, and domain proficiencies from raw resume text.

---

## 🧠 Explainable AI: 5-Factor Candidate Matching

Candidate-to-job matching utilizes an explainable 5-factor weighted algorithm:

$$\text{Total Match Score} = (S \times 0.50) + (E \times 0.20) + (L \times 0.10) + (G \times 0.10) + (A \times 0.10)$$

Where:
- **$S$ (Skills Match - 50%)**: Jaccard similarity between candidate skills and job technical requirements.
- **$E$ (Experience Match - 20%)**: Delta between candidate years of experience and target job tier.
- **$L$ (Location Fit - 10%)**: Geographic proximity for on-site gigs or full credit for remote positions.
- **$G$ (Career Goal Alignment - 10%)**: Semantic match between user's target role and job title.
- **$A$ (AI Semantic Relevance - 10%)**: LLM contextual relevance evaluation between candidate bio and job description.

---

## 🏛️ System Architecture

```mermaid
graph TD
    Client["Next.js 16 App Router (React 19, Tailwind CSS v4, Lucide, Recharts)"]

    subgraph API_Layer ["REST API & Route Handlers (/api)"]
        AuthAPI["/api/auth/*"]
        JobAPI["/api/jobs/*"]
        CourseAPI["/api/courses/*"]
        MentorAPI["/api/mentors/*"]
        PostAPI["/api/posts/*"]
        AIAPI["/api/ai/*"]
    end

    subgraph Core_Backend ["Clean Backend Architecture Pattern"]
        Controllers["Controllers (Zod Validation, Route Handlers)"]
        Services["Services (Business Rules & Domain Logic)"]
        Repositories["Repositories (Prisma Data Access Queries)"]
    end

    subgraph AI_Subsystem ["AI & RAG Intelligence Engine (/lib/ai)"]
        LangChainAgent["LangChain Agent (@langchain/openai)"]
        RAGRetriever["Database RAG Retriever (Prisma Context)"]
        GroqClient["Groq LLM Client (openai/gpt-oss-120b / 20b / qwen3.8)"]
        DeterministicFallback["Deterministic AI & Rule-Based Fallback Engine"]
        HybridMatcher["5-Factor Matcher & Roadmap Generator"]
    end

    subgraph Database_Layer ["Database & Persistence"]
        PrismaClient["Prisma ORM Client 6.4"]
        PostgresDB[("Neon Serverless PostgreSQL")]
    end

    Client --> API_Layer
    API_Layer --> Controllers
    Controllers --> Services
    Services --> Repositories
    Services --> AI_Subsystem
    AI_Subsystem --> LangChainAgent
    LangChainAgent --> RAGRetriever
    LangChainAgent --> GroqClient
    GroqClient -.->|On Offline / Limit| DeterministicFallback
    RAGRetriever --> Repositories
    Repositories --> PrismaClient
    PrismaClient --> PostgresDB
```

---

## 📁 Repository Directory Structure

```
g:/ufp/
├── .github/
│   └── workflows/
│       └── ci.yml               # GitHub Actions CI pipeline configuration
├── prisma/
│   ├── schema.prisma            # Prisma schema (User, Profile, Job, Course, Mentor, Post, etc.)
│   └── seed.ts                  # Database seed script with realistic demo data
├── public/                      # Static assets and icons
├── src/
│   ├── app/                     # Next.js App Router (Pages & API routes)
│   │   ├── api/                 # REST API Endpoints
│   │   │   ├── ai/              # AI endpoints (chat, roadmap, proposal, resume, skill-analysis, message)
│   │   │   ├── auth/            # Auth endpoints (login, register, logout, me, role-select)
│   │   │   ├── candidates/      # Candidate discovery endpoints
│   │   │   ├── courses/         # Course catalog, enrollment, and progress endpoints
│   │   │   ├── dashboard/       # Aggregated dashboard metrics
│   │   │   ├── health/          # Health check endpoint
│   │   │   ├── jobs/            # Job directory, applications, and proposals endpoints
│   │   │   ├── mentors/         # Mentorship directory and booking endpoints
│   │   │   ├── notifications/   # User notifications endpoints
│   │   │   ├── onboarding/      # Role-based onboarding flow
│   │   │   ├── posts/           # Social feed, comments, and likes endpoints
│   │   │   ├── profile/         # User profile and portfolio endpoints
│   │   │   └── skills/          # Skills taxonomy endpoints
│   │   ├── ai-assistant/        # AI Career Advisor & Message Polisher page
│   │   ├── auth/role-select/    # Post-signup role selector page
│   │   ├── company/dashboard/   # Company Hiring Dashboard & Candidate Search
│   │   ├── courses/             # Course Catalog & Video Player
│   │   ├── feed/                # Social Network Feed & Quick Post Card
│   │   ├── freelancer/dashboard/# Freelancer Workspace
│   │   ├── jobs/                # Global & Local Job Directory
│   │   ├── login/               # User Authentication & 1-Click Demo Login
│   │   ├── mentor/dashboard/    # Mentor Coaching Studio & Booking Manager
│   │   ├── mentors/             # Mentorship Marketplace & Booking Modals
│   │   ├── messages/            # Messaging Studio & AI Tone Polisher
│   │   ├── onboarding/          # Role-Based User Onboarding Wizard
│   │   ├── professional/dashboard/# Professional Dashboard & AI Proposal Generator
│   │   ├── profile/             # Profile & Portfolio Management Studio
│   │   ├── signup/              # Account Registration
│   │   ├── student/dashboard/   # Learner Dashboard & Skill Radar Studio
│   │   ├── globals.css          # Tailwind CSS v4 design tokens and utilities
│   │   └── layout.tsx           # Global HTML layout with AuthProvider and Toaster
│   ├── components/
│   │   ├── feed/                # QuickPostCard and feed interaction components
│   │   ├── layout/              # Navbar, Sidebar, Footer, Navigation
│   │   └── ui/                  # Button, Card, Input, Avatar, Badge, Progress UI primitives
│   ├── context/
│   │   └── auth-context.tsx     # Client authentication state & role switching provider
│   ├── controllers/             # Request handling and response formatting
│   ├── lib/
│   │   ├── ai/                  # AI Services, Groq Client, LangChain Agent, RAG Retriever
│   │   │   ├── rag/             # LangChain agent and database retriever
│   │   │   ├── ai-assistant.service.ts # Core AI assistant and tone polisher
│   │   │   ├── ai-service.ts    # Unified multi-LLM service wrapper
│   │   │   ├── grok-client.ts   # High-speed Groq LLM client with multi-model fallbacks
│   │   │   ├── hybrid-matcher.ts# 5-factor candidate matching algorithm
│   │   │   ├── roadmap.service.ts# Visual ASCII career roadmap builder
│   │   │   ├── schemas.ts       # AI response structured schemas
│   │   │   ├── skill-analysis.service.ts # Skill gap evaluation service
│   │   │   └── types.ts         # TypeScript AI interfaces and definitions
│   │   ├── __tests__/           # Integration and unit test suites
│   │   ├── auth.ts              # JWT signing, verification, and cookie session utils
│   │   ├── constants.ts         # System constants, roles, and status enums
│   │   ├── prisma.ts            # Prisma client singleton instance
│   │   └── utils.ts             # Styling and helper utility functions
│   ├── repositories/            # Database query layers (User, Job, Course, Mentor, Post)
│   ├── services/                # Business logic services (Auth, Recommendations, User Context)
│   └── validators/              # Zod schemas (Auth, Job, Course, Post)
├── docs/                        # Architecture guides and project documentation
├── eslint.config.mjs            # ESLint 9 Flat Configuration
├── next.config.ts               # Next.js compiler & build configuration
├── package.json                 # Project dependencies, scripts, and metadata
├── postcss.config.mjs           # PostCSS configuration
└── tsconfig.json                # TypeScript compiler configuration
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **PostgreSQL Database** (e.g., [Neon Serverless PostgreSQL](https://neon.tech)) or local PostgreSQL instance.

### 2. Installation
```bash
# Clone repository
git clone https://github.com/tharuntej123/growearn.git
cd growearn

# Install dependencies (cross-platform compatible)
npm install
```

### 3. Environment Configuration
Create a `.env` file in the project root based on `.env.example`:

```env
# Database Configuration (Neon Serverless PostgreSQL)
DATABASE_URL="postgresql://user:password@ep-example-pooler.neon.tech/neondb?sslmode=require"

# Authentication
JWT_SECRET="ufp-super-secret-jwt-key-2026-production-grade"
JWT_EXPIRES_IN="7d"

# AI Configuration (Groq High-Speed API)
MOCK_AI="false"
GROQ_API_KEY="gsk_your_groq_api_key_here"
GROQ_MODEL="openai/gpt-oss-120b"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup & Seeding
```bash
# Push Prisma schema to your PostgreSQL database
npx prisma db push

# Generate Prisma Client types
npx prisma generate

# Seed database with realistic users, jobs, courses, and social posts
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 👥 Pre-Seeded Demo Accounts

All demo accounts use the standard password: `Demo1234!`

| Role | Email | Key Features to Test |
| :--- | :--- | :--- |
| **👨‍🎓 Learner** | `student@example.com` | AI Skill Gap Radar, 4-Phase Career Roadmap, Course Video Player & Certificate |
| **💼 Professional** | `professional@example.com` | Global Remote & Local Gigs, AI Proposal Builder, Resume Parsing, Portfolio Studio |
| **👨‍🏫 Mentor** | `mentor@example.com` | Coaching Request Approval, Video Meeting Studio, Course Authoring & Publishing |
| **🏢 Company** | `company@example.com` | 2-Way Job Posting (Quick & Detailed), 5-Factor AI Candidate Matcher, ATS Pipeline |

*Tip: The Landing Page and Login Page include 1-click quick-fill buttons for instant role switching without typing credentials.*

---

## 🧪 Testing & Code Verification

| Command | Description |
| :--- | :--- |
| `npx tsx src/lib/__tests__/test-all-ai-groq.ts` | Complete Groq AI suite test (chat, roadmap, proposals, skill gap, tone polisher, resume). |
| `npx tsx src/lib/__tests__/test-live-groq.ts` | Verifies live Groq API key connectivity and prompt completion. |
| `npx tsx src/lib/__tests__/job-posting.test.ts` | Integration tests for database health, job validation, and role authorization. |
| `npx tsx src/lib/__tests__/ai-assistant.test.ts` | Tests the conversational RAG assistant and classifier logic. |
| `npx tsc --noEmit` | Performs full TypeScript static type checking. |
| `npm run lint` | Executes ESLint 9 code quality and style validation. |
| `npm run build` | Compiles the Next.js production bundle with Turbopack. |

---

## 🔄 Automated CI/CD Pipeline

The project features a continuous integration workflow automated with **GitHub Actions** (`.github/workflows/ci.yml`), triggered on pushes and pull requests to `main`, `master`, and `develop`:

1. **Environment Setup**: Provisions Node.js 20 on Ubuntu with automated npm caching.
2. **Resilient Dependency Installation**: Executes `npm ci || npm install --no-audit --prefer-offline`.
3. **Database Schema Sync**: Generates the latest Prisma Client.
4. **Static Type Validation**: Runs `npx tsc --noEmit` across all TypeScript modules.
5. **Linting Check**: Runs `npm run lint` under ESLint 9 flat configuration.
6. **Production Build**: Compiles and verifies the Next.js production bundle.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
