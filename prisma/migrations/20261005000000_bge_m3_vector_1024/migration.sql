-- Migration: Update pgvector column dimension to 1024 for BGE-M3 local model
-- 1. Drop existing HNSW index if present
DROP INDEX IF EXISTS "document_chunks_embedding_hnsw_idx";
DROP INDEX IF EXISTS "document_chunks_embedding_idx";

-- 2. Alter column type to vector(1024) safely
ALTER TABLE "document_chunks" 
  ALTER COLUMN "embedding" TYPE vector(1024) USING NULL;

-- 3. Recreate HNSW index for production cosine similarity search with vector_cosine_ops
CREATE INDEX IF NOT EXISTS "document_chunks_embedding_hnsw_idx" 
  ON "document_chunks" 
  USING hnsw ("embedding" vector_cosine_ops);
