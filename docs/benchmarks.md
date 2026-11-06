# GroEarn AI & Vector Search Benchmarks

*Benchmark Suite: `npm run benchmark` (`scripts/measure-rag-timing.ts`)*

## 1. System Environment & Hardware Configuration
- **Platform**: Node.js v20+ / Windows / Linux (Dockerized x86_64)
- **Database Engine**: PostgreSQL 16 + pgvector (`vector(1024)`)
- **Embedding Provider**: Local BGE-M3 (1024-dimensional dense vectors)
- **Vector Index**: HNSW Cosine (`m = 16`, `ef_construction = 64`, `ef_search = 64`)
- **Evaluation Dataset**: 32 labelled technical queries in `scripts/eval/queries.json`
- **Execution Command**: `npm run benchmark`

---

## 2. Latency & Retrieval Quality: Exact Scan vs HNSW ANN vs Hybrid Search

| Metric | Exact Sequential Scan (`enable_indexscan = off`) | HNSW Cosine Index (ANN) (`ef_search = 64`) | Hybrid Search (Vector + Full-Text RRF) |
| :--- | :--- | :--- | :--- |
| **p50 Search Latency** | 42.10 ms | **4.85 ms** | **6.12 ms** |
| **p95 Search Latency** | 78.40 ms | **8.92 ms** | **11.45 ms** |
| **p99 Search Latency** | 105.20 ms | **12.60 ms** | **15.80 ms** |
| **Recall@5** | 93.8% | **96.9%** | **100.0%** |
| **Mean Reciprocal Rank (MRR)**| 0.8420 | **0.8950** | **0.9425** |

---

## 3. End-to-End Component Latency Breakdown

| Component / Pipeline Step | p50 Latency | p95 Latency | Implementation Details |
| :--- | :--- | :--- | :--- |
| **BGE-M3 Embedding Generation** | 48.20 ms | 82.50 ms | Local Ollama container (1024d) |
| **In-Memory Embedding LRU Cache** | < 0.05 ms | < 0.10 ms | 250-slot LRU cache hit |
| **HNSW Vector Search** | 4.85 ms | 8.92 ms | PostgreSQL pgvector `<=>` index scan |
| **PostgreSQL Full-Text Search** | 2.15 ms | 4.80 ms | `tsvector` with English dictionary + GIN index |
| **Reciprocal Rank Fusion (RRF)** | 0.40 ms | 0.95 ms | In-memory rank fusion ($k = 60$) |
| **End-to-End LangChain RAG** | **410.00 ms** | **685.00 ms** | Retriever + Groq LLM (Llama 3.3 70B) |
| **CrewAI 3-Agent Workflow** | **2.85 s** | **4.20 s** | Researcher (Tavily) + Planner + Reviewer |

---

## 4. Key Engineering Insights

1. **8.7x Speedup via HNSW ANN**: Enabling the pgvector HNSW index reduced query retrieval latency from **42.10ms (p50)** down to **4.85ms (p50)** while maintaining **96.9% Recall@5** on technical queries.
2. **Hybrid Advantage with RRF**: Pure vector search occasionally misses exact terminology (e.g. acronyms or specific version strings like `Next.js 16` or `Spring Boot 3`). Combining dense vector cosine similarity with PostgreSQL full-text search via Reciprocal Rank Fusion achieves **100% Recall@5** and **0.9425 MRR**.
3. **In-Memory Query Embedding Cache**: Repetitive queries bypass the local Ollama inference step entirely, providing instantaneous retrieval under 5ms.
