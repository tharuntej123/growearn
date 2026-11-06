# AI, Vector Engine & LangChain Architecture

Growearn implements an enterprise RAG pipeline combining LangChain orchestration, Groq LLM inference, 1024-dimensional BGE-M3 embeddings, pgvector HNSW ANN search, and reciprocal rank fusion (RRF) hybrid search.

---

## 1. Core Vector Search & Embedding Architecture

```text
┌──────────────────────────────────────────────┐
│ User Query / Target Skill (e.g. Next.js 16) │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ 1. In-Memory LRU Cache Check (250 entries)   │
│    Hit: Return cached 1024-dim vector        │
│    Miss: Call Ollama BGE-M3 REST API         │
└──────────────────────┬───────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
┌──────────────────┐       ┌──────────────────┐
│ Dense Vector     │       │ Full-Text Search │
│ HNSW Cosine ANN  │       │ tsvector GIN     │
│ (<=> operator)   │       │ (websearch_to_ts)│
└────────┬─────────┘       └─────────┬────────┘
         │                           │
         └─────────────┬─────────────┘
                       ▼
┌──────────────────────────────────────────────┐
│ 2. Reciprocal Rank Fusion (RRF, k = 60)      │
│    Score = Σ (1 / (60 + Rank_i))             │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ 3. Multi-Signal Deterministic Ranking        │
│    Vector Sim (35%) + Skill Overlap (35%) +  │
│    Rating (15%) + Level Fit (15%)            │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│ 4. LangChain RunnableSequence Pipeline       │
│    retriever -> format docs -> ChatGroq ->   │
│    StringOutputParser                        │
└──────────────────────────────────────────────┘
```

---

## 2. LangChain Integration (`src/lib/ai/`)

Rather than unmanaged direct HTTP requests, Growearn's RAG and prompt management uses **LangChain**:

- **`BgeM3Embeddings` (`src/lib/ai/lc-embeddings.ts`)**:
  - Implements LangChain's abstract `Embeddings` base class (`embedQuery`, `embedDocuments`).
  - Connects to Ollama serving BGE-M3 with automatic dimensionality validation (`dim === 1024`).

- **`getLangChainChatGroq` (`src/lib/ai/lc-llm.ts`)**:
  - Uses `@langchain/groq` to instantiate `ChatGroq`.
  - Configured with resilient fallback chains: `.withFallbacks([ChatGroq(fallbackModel)])`.
  - Primary default model: `llama-3.3-70b-versatile` with secondary fallback `openai/gpt-oss-120b`.

- **`RunnableSequence` RAG Chain (`src/lib/ai/rag-chain.ts`)**:
  - Constructed using `RunnableSequence.from<RAGChainInput, string>([ ... ])`.
  - Pipeline:
    ```typescript
    const ragChain = RunnableSequence.from<RAGChainInput, string>([
      {
        context: async (input: RAGChainInput) => {
          const docs = await retriever.invoke(input.question);
          return formatDocumentsAsString(docs);
        },
        question: (input: RAGChainInput) => input.question,
        userContextSnippet: (input: RAGChainInput) => input.userContextSnippet || '',
      },
      ragPromptTemplate,
      llm,
      new StringOutputParser(),
    ]);
    ```
  - Observability hook: When `LANGCHAIN_TRACING_ENABLED="true"` is set, requests automatically export execution traces.

- **Structured Output Generation (`src/lib/ai/llm-client.ts`)**:
  - `completeStructured<T>(schema, prompt)` binds Zod schemas directly to ChatGroq via `.withStructuredOutput(schema)`.

---

## 3. ANN Vector Search & HNSW Indexing

Growearn stores document embeddings in the `document_chunks` table in PostgreSQL 16 using `pgvector`:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- HNSW Vector Index on cosine distance
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx 
ON document_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Full-Text Search tsvector column and GIN index for hybrid retrieval
ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED;

CREATE INDEX IF NOT EXISTS document_chunks_tsv_idx
ON document_chunks USING gin(tsv);
```

### HNSW Query-Time Tuning (`hnsw.ef_search`)
Vector queries set query-time graph exploration accuracy per transaction:
```sql
SET LOCAL hnsw.ef_search = 40;
```
This guarantees an optimal trade-off between sub-5ms query latency and high search recall. All queries use parameterized `Prisma.sql` templates; `$queryRawUnsafe` is completely eliminated.

---

## 4. Hybrid Search with Reciprocal Rank Fusion (RRF)

Growearn supports hybrid retrieval (`mode = 'hybrid'`) combining semantic ANN cosine search and lexical full-text keyword search:
1. **Dense Vector Search**: Top $K$ items ranked by cosine similarity ($1 - \text{cosine\_distance}$).
2. **Lexical Keyword Search**: Top $K$ items ranked by PostgreSQL `ts_rank_cd(tsv, websearch_to_tsquery('english', query))`.
3. **RRF Aggregation**: For each candidate document $d$, its hybrid score is calculated as:
   $$\text{RRF\_Score}(d) = \sum_{m \in \{\text{vector}, \text{fts}\}} \frac{1}{60 + \text{rank}_m(d)}$$
4. Candidates are sorted by `RRF_Score` descending, yielding superior precision on exact technical keywords (e.g. `Next.js 16`, `Spring Boot`) while preserving deep semantic conceptual matches.

---

## 5. In-Memory LRU Embedding Cache

To minimize redundant network calls to Ollama and lower search latency, `src/lib/ai/embeddings.ts` implements a thread-safe in-memory LRU cache (`EmbeddingLRUCache`):
- **Capacity**: 250 unique normalized queries.
- **TTL**: 15 minutes (900,000 ms).
- **Eviction**: Least Recently Used policy upon reaching capacity.
- **Cache Hit Latency**: `< 0.05 ms` (eliminating the 80–120ms Ollama embedding step).

---

## 6. Benchmarks & Evaluation

Evaluation of the RAG pipeline is automated via `scripts/measure-rag-timing.ts` against 32 ground-truth labeled queries (`scripts/eval/queries.json`).

Run the benchmark suite:
```bash
npm run benchmark
```

Detailed latency metrics, Recall@5, MRR, and p50/p95/p99 execution figures are documented in **[docs/benchmarks.md](benchmarks.md)**.
