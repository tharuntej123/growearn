-- Migration: Strengthen HNSW (m=16, ef_construction=64), add source_type index, and add GIN tsvector for Hybrid Search

CREATE INDEX IF NOT EXISTS "document_chunks_source_type_idx" ON "document_chunks"("source_type");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'document_chunks' AND column_name = 'tsv'
  ) THEN
    ALTER TABLE "document_chunks" ADD COLUMN "tsv" tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce("content", '') || ' ' || coalesce("source", ''))) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "document_chunks_tsv_idx" ON "document_chunks" USING gin("tsv");

DROP INDEX IF EXISTS "document_chunks_embedding_hnsw_idx";

CREATE INDEX "document_chunks_embedding_hnsw_idx" 
  ON "document_chunks" 
  USING hnsw ("embedding" vector_cosine_ops) 
  WITH (m = 16, ef_construction = 64);

