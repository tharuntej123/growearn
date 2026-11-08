# GrowEarn AI Architecture & Roadmap Flow

This document details the single, authoritative architectural lifecycle for career roadmap generation and semantic RAG retrieval in GrowEarn.

---

## 🏗️ Architectural Overview

```
[ Learner Client / API ]
          │
          ▼
[ POST /api/learner/roadmap ]
          │
          ├── Step 1: Authentication & RBAC Check (Learner/Admin only)
          ├── Step 2: Rate Limiting (DB-backed, fail-closed on abuse)
          │
          ├── Step 3: PRIMARY TIER — CrewAI Multi-Agent Service
          │     │
          │     ├── POST http://agents:8000/roadmap
          │     ├── Header: X-Internal-Secret (HMAC-SHA256, >=32 chars)
          │     │
          │     ├── [ Researcher Agent ] ── Tavily Live Search Tools
          │     │        │ (Scrapes modern market frameworks & real requirements)
          │     │        ▼
          │     ├── [ Planner Agent ] ── Curriculum Sequencing
          │     │        │ (Builds structured 4-phase milestone curriculum)
          │     │        ▼
          │     └── [ Reviewer Agent ] ── Quality & Pydantic Validation
          │              │ (Verdicts: APPROVED, REVISED, REJECTED)
          │              ▼
          │       Returns: RoadmapResponse (mode: "crewai", liveTrace: [...])
          │
          └── Step 4: SECONDARY TIER — Grounded Deterministic Fallback
                │ (Triggered on: Connection Refused, Timeout, or HTTP 5xx)
                │
                ├── Never fabricates or hallucinates output
                ├── Queries PostgreSQL indexed reference taxonomy
                ├── Retrieves real courses and verified mentors
                └── Explicitly sets: mode: "fallback", degraded: true
```

---

## 🤖 CrewAI Multi-Agent Service

Located in `agents/app/`:
1. **Researcher Agent (`crew.py`)**:
   - Role: Senior Technical Talent & Market Researcher
   - Goal: Research authoritative prerequisites and industry competencies.
   - Tools: `search_tavily` (validates HTTP/HTTPS links and fetches real documentation).
2. **Planner Agent**:
   - Role: Principal Curriculum Architect
   - Goal: Organize skills into a progressive 4-phase sequence with measurable deliverables.
3. **Reviewer Agent**:
   - Role: Engineering Lead & Curriculum Auditor
   - Goal: Audit the curriculum against technical standards and output validated JSON conforming to the `RoadmapResponse` Pydantic schema.

### Security Hardening
- Authentication via `X-Internal-Secret` using `hmac.compare_digest` in `agents/app/main.py`.
- No public port exposed in Docker Compose; internal network binding only.
- Key rotation supported via current and previous secret comparisons.

---

## 🔍 Hybrid RAG Pipeline (BGE-M3 + pgvector)

Located in `src/lib/ai/`:
1. **Embeddings**: BGE-M3 (1024-dimensional dense vectors) served locally via Ollama.
2. **Vector Store (`vector-store.ts`)**:
   - PostgreSQL 16/18 with `pgvector` HNSW cosine distance index (`<=>`).
   - Transactional tuning: `SET LOCAL hnsw.ef_search = 64`.
3. **Full-Text Search**: PostgreSQL GIN index on `document_chunks.tsv` with `ts_rank_cd`.
4. **Reciprocal Rank Fusion**: RRF ($k=60$) combining cosine vector scores with keyword ranks:
   $$\text{RRF Score} = \frac{1}{60 + \text{rank}_v} + \frac{1}{60 + \text{rank}_k}$$
5. **Relevance Gate (`relevance-gate.ts`)**:
   - Below threshold ($< 0.45$), queries are rejected with an honest platform refusal to prevent LLM hallucinations.

---

## 🛡️ Failure Modes & Graceful Degradation

| Failure Condition | System Reaction | User-Facing Output |
| :--- | :--- | :--- |
| **CrewAI service offline** | Catch block activates deterministic catalog matcher | `mode: "fallback"`, `degraded: true` label displayed in UI |
| **Tavily timeout** | Omits web search step, returns platform catalog resources | `toolsUsed: ["catalog"]` without false external links |
| **Embedding service unreachable** | `checkEmbeddingHealth` probe fails; falls back to GIN full-text search | `searchMode: "KEYWORD_FALLBACK"`, `degraded: true` |
| **Out-of-domain query** | Relevance gate triggers ($< 0.45$ similarity) | Clean refusal message, zero LLM hallucination |

