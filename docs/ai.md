# AI & RAG Engine Architecture

## 1. Real Vector Search & Embedding Engine

GroEarn uses a genuine pgvector retrieval-augmented generation (RAG) architecture running against PostgreSQL with HNSW vector indexes:

```text
User Query / Profile
       │
       ▼
Query Normalization
       │
       ▼
generateEmbedding(query)
  (OpenAI text-embedding-3-small, 1536 dims)
       │
       ▼
PostgreSQL pgvector Cosine Query (<=> operator)
  (HNSW Index on document_chunks.embedding)
       │
       ▼
Semantic Result Retrieval (Top K Entities)
       │
       ▼
Deterministic Multi-Signal Hybrid Ranking
  (Skill Overlap 50% + Experience 20% + Semantic 10% + Goal 10% + Location 10%)
       │
       ▼
Grounded Personalization & Result Delivery
```

---

## 2. Document Chunks & Metadata Standards

All indexed platform entities in the `document_chunks` table adhere to canonical entity ID mappings in their `metadata` column:
- **Courses**: `metadata.courseId` -> maps directly to `Course.id`.
- **Mentors**: `metadata.mentorProfileId` & `metadata.mentorId` -> maps directly to `MentorProfile.id` and `User.id`.
- **Jobs / Opportunities**: `metadata.jobId` -> maps directly to `Job.id`.
- **Candidates / Professionals**: `metadata.userId` -> maps directly to `User.id`.

### HNSW Indexing Strategy
The pgvector index is created using Hierarchical Navigable Small World (HNSW) graphs on cosine distance:
```sql
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx 
ON document_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

---

## 3. Dedicated RAG Pipelines

### 3.1 Learner Skill-First RAG Pipeline
- **Entry**: Skill or goal query (e.g. `Java`, `React`, `Machine Learning`).
- **Retrieval**: Real 1536-dimensional embeddings retrieve matching career roadmaps, top 5 courses, and top 5 expert mentors without duplicate IDs.
- **Constraints**: Learners never see job postings directly in this learning pipeline.

### 3.2 Professional Job Opportunity RAG Pipeline
- **Entry**: Professional portfolio, verified skills, years of experience, and career goals.
- **Retrieval**: Cosine similarity query against job postings + multi-factor ranking.
- **Ranking Signals**: Verified skill overlap (50%), experience level (20%), location/work mode (10%), career goal (10%), semantic vector relevance (10%).

### 3.3 Employer Candidate Matching RAG Pipeline
- **Entry**: Employer job description, required technical competencies, seniority.
- **Retrieval**: Queries candidate profiles and project evidence chunks.
- **Authorization**: Respects candidate privacy; contact details only unlocked upon applicant consent.

---

## 4. Credential Requirements & Strict Reporting
- **Embedding Model**: OpenAI `text-embedding-3-small` (1536 dimensions).
- **Environment Flag**: `OPENAI_API_KEY`.
- **Blocked State Policy**: When `OPENAI_API_KEY` is not present, automated verification suites report `BLOCKED: LIVE SEMANTIC RAG REQUIRES OPENAI_API_KEY`. The system does **not** fabricate synthetic vectors (e.g. `Math.sin`, `Math.cos`, `new Array(1536)`) or hardcoded similarity scores.
