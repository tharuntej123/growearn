/**
 * @file vector-store.ts
 * @description PostgreSQL + pgvector vector storage and Cosine Similarity retrieval service.
 * 
 * Architecture:
 * - Database: PostgreSQL with pgvector extension
 * - Table: document_chunks (content, source, source_type, metadata, embedding vector(1024), created_at)
 * - Index: HNSW with vector_cosine_ops
 * - Metric: Cosine Distance (<=> operator), Cosine Similarity = 1 - distance
 * 
 * Input: 1024-dimensional query embedding vector, top-k limit (default 5), optional source filtering
 * Output: Grounded chunks sorted by cosine similarity with real similarity scores [0.0 - 1.0]
 */

import { prisma } from '@/lib/prisma';
import { generateEmbedding, generateEmbeddings } from './embeddings';

export interface DocumentChunkRecord {
  id: string;
  content: string;
  source: string;
  sourceType: string;
  metadata: Record<string, any> | null;
  similarity?: number;
  createdAt?: Date;
}

export interface IngestChunkInput {
  id?: string;
  content: string;
  source: string;
  sourceType: string;
  metadata?: Record<string, any>;
  embedding?: number[];
}

/**
 * Format a JavaScript number array into a pgvector string literal format: "[0.123,0.456,...]"
 */
export function formatVectorForPg(vector: number[]): string {
  return `[${vector.join(',')}]`;
}

export class PgVectorStore {
  /**
   * Insert a single document chunk into PostgreSQL with vector embedding.
   */
  static async insertChunk(input: IngestChunkInput): Promise<string> {
    const embedding = input.embedding || (await generateEmbedding(input.content));
    const vectorStr = formatVectorForPg(embedding);
    const metadataStr = JSON.stringify(input.metadata || {});

    const rows = await prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `
      INSERT INTO document_chunks (id, content, source, source_type, metadata, embedding, created_at)
      VALUES (COALESCE($1, gen_random_uuid()::text), $2, $3, $4, $5::jsonb, $6::vector, NOW())
      RETURNING id
      `,
      input.id || null,
      input.content,
      input.source,
      input.sourceType,
      metadataStr,
      vectorStr
    );

    return rows[0]?.id;
  }

  /**
   * Batch insert multiple document chunks with pgvector embeddings.
   */
  static async insertChunks(inputs: IngestChunkInput[]): Promise<number> {
    if (!inputs || inputs.length === 0) return 0;

    // Generate embeddings in batch if missing
    const chunksWithEmbeddings: IngestChunkInput[] = [];
    const missingEmbeddingsTexts: string[] = [];
    const missingIndices: number[] = [];

    inputs.forEach((c, idx) => {
      if (c.embedding && c.embedding.length > 0) {
        chunksWithEmbeddings.push(c);
      } else {
        missingEmbeddingsTexts.push(c.content);
        missingIndices.push(idx);
      }
    });

    if (missingEmbeddingsTexts.length > 0) {
      const generated = await generateEmbeddings(missingEmbeddingsTexts);
      missingIndices.forEach((origIdx, gIdx) => {
        inputs[origIdx].embedding = generated[gIdx];
      });
    }

    let insertedCount = 0;
    for (const chunk of inputs) {
      if (chunk.embedding) {
        await this.insertChunk(chunk);
        insertedCount++;
      }
    }

    return insertedCount;
  }

  /**
   * Performs Cosine Similarity vector search on document_chunks using pgvector <=> operator.
   * 
   * Cosine Similarity = 1 - (embedding <=> query_vector)
   * Top-K: Returns top K matches strictly sorted by similarity.
   */
  static async similaritySearch(
    queryEmbedding: number[],
    topK: number = 5,
    filterSourceType?: string
  ): Promise<DocumentChunkRecord[]> {
    const vectorStr = formatVectorForPg(queryEmbedding);

    let rows: Array<{
      id: string;
      content: string;
      source: string;
      source_type: string;
      metadata: any;
      similarity: number;
    }> = [];

    if (filterSourceType && filterSourceType.trim() !== '') {
      rows = await prisma.$queryRawUnsafe(
        `
        SELECT 
          id, 
          content, 
          source, 
          source_type, 
          metadata, 
          (1 - (embedding <=> $1::vector)) AS similarity
        FROM document_chunks
        WHERE source_type = $2
        ORDER BY embedding <=> $1::vector ASC
        LIMIT $3
        `,
        vectorStr,
        filterSourceType,
        topK
      );
    } else {
      rows = await prisma.$queryRawUnsafe(
        `
        SELECT 
          id, 
          content, 
          source, 
          source_type, 
          metadata, 
          (1 - (embedding <=> $1::vector)) AS similarity
        FROM document_chunks
        ORDER BY embedding <=> $1::vector ASC
        LIMIT $2
        `,
        vectorStr,
        topK
      );
    }

    return rows.map((r) => ({
      id: r.id,
      content: r.content,
      source: r.source,
      sourceType: r.source_type,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
      similarity: typeof r.similarity === 'number' ? Number(r.similarity.toFixed(4)) : Number(parseFloat(String(r.similarity)).toFixed(4)),
    }));
  }

  /**
   * Delete chunks for a specific source name (e.g. before re-indexing an updated file).
   */
  static async deleteChunksBySource(source: string): Promise<number> {
    const count = await prisma.$executeRawUnsafe(
      `DELETE FROM document_chunks WHERE source = $1`,
      source
    );
    return count;
  }

  /**
   * Count total indexed chunks in the vector database.
   */
  static async countChunks(): Promise<number> {
    const result = await prisma.$queryRawUnsafe<Array<{ count: bigint | number }>>(
      `SELECT COUNT(*)::int as count FROM document_chunks`
    );
    return Number(result[0]?.count || 0);
  }
}
