# AI & RAG Engine Architecture

## 1. Vector Search & Embedding Architecture

GroEarn uses a pgvector retrieval-augmented generation (RAG) architecture running against PostgreSQL with HNSW vector indexes:

```text
User Query / Profile
       │
       ▼
Query Normalization
       │
       ▼
generateEmbedding(query)
  (Local BGE-M3, 1024 dimensions via Ollama / local model serving)
       │
       ▼
PostgreSQL pgvector Cosine Distance (<=> operator)
  (HNSW Index on document_chunks.embedding, vector(1024))
       │
       ▼
Semantic Result Retrieval (Top K Matching Entities)
       │
       ▼
Deterministic Multi-Signal Hybrid Ranking
  (Vector Similarity 35% + Skill Overlap 35% + Rating 15% + Level Match 15%)
       │
       ▼
Groq LLM Grounded Explanation & User Delivery
```

---

## 2. Document Chunks & Metadata Standards

Indexed platform entities in the `document_chunks` table adhere to canonical entity ID mappings in their `metadata` column:
- **Courses**: `metadata.courseId` -> maps to `Course.id`.
- **Mentors**: `metadata.mentorProfileId` & `metadata.mentorId` -> maps to `MentorProfile.id` and `User.id`.
- **Jobs / Opportunities**: `metadata.jobId` -> maps to `Job.id`.
- **Candidates**: `metadata.userId` -> maps to `User.id`.

### HNSW Indexing Configuration
The pgvector index uses Hierarchical Navigable Small World (HNSW) graphs on cosine distance:
```sql
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx 
ON document_chunks 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

---

## 3. Dedicated RAG Pipelines

### 3.1 Learner Skill-First RAG Pipeline
- **Entry**: Skill query (e.g. `Java`, `Next.js`, `Machine Learning`, `PostgreSQL`).
- **Retrieval**: 1024-dimensional embeddings query `document_chunks` for matching career roadmaps, top 5 courses, and top 5 expert mentors without duplicate IDs.
- **Output**: 4-phase structured roadmap milestones with direct links to enroll in courses or book mentors.

### 3.2 Freelancer Job Opportunity Matching
- **Entry**: User portfolio, verified skills, experience years, and career goals.
- **Retrieval**: 5-factor hybrid scoring combining:
  - Verified Skill Overlap: **50%**
  - Experience Level Match: **20%**
  - Location Alignment: **10%**
  - Career Goal Fit: **10%**
  - pgvector Cosine Match: **10%**

### 3.3 Candidate Discovery for Companies
- **Entry**: Company job requirements, required competencies, and seniority.
- **Retrieval**: Queries candidate profile chunks using vector embeddings and skill overlap.
- **Authorization**: Access restricted to authenticated `COMPANY` and `ADMIN` users.

---

## 4. LLM Orchestration & Fallback

- **LLM Client (`src/lib/ai/llm-client.ts`)**: Supports high-speed inference via Groq API (Llama 3.3 70B & GPT-OSS 120B) with OpenAI API compatibility.
- **Zero-Shot Intent Classifier Fallback**: If the local embedding server is unconfigured or offline, the `IntentClassifier` seamlessly falls back to keyword-token classification to ensure platform uptime.
