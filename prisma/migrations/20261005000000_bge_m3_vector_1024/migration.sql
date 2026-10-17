DROP INDEX IF EXISTS "document_chunks_embedding_hnsw_idx";
DROP INDEX IF EXISTS "document_chunks_embedding_idx";

ALTER TABLE "document_chunks" 
  ALTER COLUMN "embedding" TYPE vector(1024) USING NULL;

CREATE INDEX IF NOT EXISTS "document_chunks_embedding_hnsw_idx" 
  ON "document_chunks" 
  USING hnsw ("embedding" vector_cosine_ops);
