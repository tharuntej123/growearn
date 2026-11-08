# GrowEarn

GrowEarn is an AI-powered career-to-earning platform that connects learners, mentors, freelancers, and hiring companies across 5 distinct user roles. It features an authentic multi-agent career roadmap system, a hybrid semantic RAG pipeline, real-time marketplace payments, and full containerization with Docker Compose.

---

## 🌟 Resume & Architecture Highlights

1. **Enterprise Full-Stack Platform**: Built with Next.js 16 (App Router), React 19, TypeScript, PostgreSQL 16/18 with `pgvector`, and Prisma ORM. Connects 5 user roles: **Learner**, **Freelancer**, **Mentor**, **Company**, and **Admin**.
2. **Hybrid RAG Pipeline**: LangChain `RunnableSequence` paired with Groq LLM (`llama-3.3-70b-versatile`), BGE-M3 1024-dimensional dense embeddings, PostgreSQL `pgvector` HNSW index (ANN cosine distance), PostgreSQL GIN full-text search (`tsvector`), and Reciprocal Rank Fusion (RRF $k=60$) with multi-signal ranking.
3. **CrewAI Agentic Workflows**: Multi-agent service in Python (`agents/`) utilizing CrewAI (Researcher, Planner, and Reviewer agents) with Tavily live tool calls for market-grounded career roadmaps, containerized with Docker Compose.
4. **Cashfree Marketplace Payments**: Strict server-verified payment lifecycle (orders, verification, raw HMAC-SHA256 webhooks, refunds, audit logs, and idempotency protection).

---

## 👥 Five User Roles

| Role | Primary Dashboard | Core Capabilities |
| :--- | :--- | :--- |
| **Learner** | `/learner/dashboard` | CrewAI career roadmaps, course enrollments, mentorship bookings, skill explorer |
| **Freelancer**| `/freelancer/dashboard`| Project proposal bidding, milestone deliverables, profile portfolio |
| **Mentor** | `/mentor/dashboard` | Mentorship session availability, booking management, course authoring |
| **Company** | `/company/dashboard` | Job postings, ATS candidate pipeline discovery, contract milestones |
| **Admin** | `/admin` | Marketplace telemetry, payment reconciliation, audit logs, dispute handling |

---

## 🏗️ Architecture & Stack

```text
[ Browser / Client (Next.js 16 + React 19) ]
         │
         ├─── REST / Server Actions / Middleware (Jose Sessions, RBAC)
         │
[ Next.js API Layer ] ──── LangChain RAG ──── Groq LLM (Llama 3.3 70B)
         │                     │
         │                     └─── BGE-M3 (1024-dim) + pgvector HNSW
         │
         ├─── Internal HMAC Secret ─── [ CrewAI Service (Python 3.11 / FastAPI) ]
         │                                   ├── Researcher Agent (Tavily Tools)
         │                                   ├── Planner Agent (Curriculum & Skills)
         │                                   └── Reviewer Agent (Validation & Milestones)
         │
         ├─── Cashfree Payment Gateway (v2023-08-01, Webhook HMAC-SHA256)
         │
[ PostgreSQL + pgvector ] (Prisma ORM, Decimal precision, AuditLog, Outbox)
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js >= 20.x, npm >= 10.x
- Python >= 3.10
- PostgreSQL with `pgvector` or Docker

### 2. Environment Configuration
Copy sample configuration files:
```bash
cp .env.example .env
cp agents/.env.example agents/.env
```

### 3. Local Development
```bash
# Install frontend dependencies
npm install

# Run database migrations and seed reference data
npx prisma migrate deploy
npm run seed:reference

# Start Next.js development server
npm run dev
```

To run the CrewAI agent microservice:
```bash
cd agents
python -m venv .venv
source .venv/bin/activate  # Or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 4. Docker Compose Orchestration
Spin up the full containerized ecosystem:
```bash
docker compose up -d --build
```

---

## 🧪 Verification & Proof Suite

GrowEarn includes an automated 97-point auditor harness verifying security, payment integrity, RAG accuracy, multi-agent workflows, and code hygiene:

```bash
# Run comprehensive 97-point auditor and proof verification
npm run verify:all

# Run TypeScript checks
npm run typecheck

# Run ESLint
npm run lint

# Run Node test suite
npm test

# Run Python CrewAI test suite
pytest agents/tests -v
```

All empirical verification proofs and command outputs are preserved under `docs/evidence/`.

---

## 📄 Documentation

- [Master Proof Report](docs/PROOF_REPORT.md)
- [AI Reality & Fallback Matrix](docs/ai-reality-matrix.md)
- [Payments & Cashfree Integration](docs/payments.md)
- [Architecture & Benchmarks](docs/benchmarks.md)
- [Technical Interview Guide](docs/INTERVIEW.md)

---

## 📜 License
MIT License. Built for production demonstration and interview verification.
