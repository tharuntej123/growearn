import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { generateEmbedding, generateEmbeddings, EMBEDDING_DIMENSION } from './embeddings';

export interface DocumentChunkRecord {
  id: string;
  content: string;
  source: string;
  sourceType: string;
  metadata: Record<string, any> | null;
  similarity?: number;
  vectorScore?: number;
  keywordScore?: number;
  rrfScore?: number;
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

interface RawSimilarityRow {
  id: string;
  content: string;
  source: string;
  source_type: string;
  metadata: Record<string, unknown> | null;
  similarity: number;
}

/**
 * Format a JavaScript number array into a pgvector string literal format: "[0.123,0.456,...]"
 * Validates dimension strictly against EMBEDDING_DIMENSION (1024).
 */
export function formatVectorForPg(vector: number[]): string {
  if (!Array.isArray(vector) || vector.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `SEMANTIC_RAG_DIMENSION_MISMATCH: Expected exactly ${EMBEDDING_DIMENSION} embedding dimensions, received ${vector?.length}`
    );
  }
  for (let i = 0; i < vector.length; i++) {
    if (typeof vector[i] !== 'number' || !Number.isFinite(vector[i])) {
      throw new Error(`SEMANTIC_RAG_UNAVAILABLE: Non-finite float at vector index ${i}`);
    }
  }
  return `[${vector.join(',')}]`;
}

export class PgVectorStore {
  /**
   * Insert a single document chunk into PostgreSQL using parameterized Prisma.sql.
   */
  static async insertChunk(input: IngestChunkInput): Promise<string> {
    const embedding = input.embedding || (await generateEmbedding(input.content));
    const vectorStr = formatVectorForPg(embedding);
    const metadataStr = JSON.stringify(input.metadata || {});

    const rows = await prisma.$queryRaw<Array<{ id: string }>>(
      Prisma.sql`
        INSERT INTO document_chunks (id, content, source, source_type, metadata, embedding, created_at)
        VALUES (
          COALESCE(${input.id || null}, gen_random_uuid()::text),
          ${input.content},
          ${input.source},
          ${input.sourceType},
          ${metadataStr}::jsonb,
          ${vectorStr}::vector,
          NOW()
        )
        RETURNING id
      `
    );

    return rows[0]?.id;
  }

  /**
   * Batch insert multiple document chunks in multi-row batches (100 rows per transaction).
   */
  static async insertChunks(inputs: IngestChunkInput[]): Promise<number> {
    if (!inputs || inputs.length === 0) return 0;

    // Generate missing embeddings in batch
    const missingEmbeddingsTexts: string[] = [];
    const missingIndices: number[] = [];

    inputs.forEach((c, idx) => {
      if (!c.embedding || c.embedding.length === 0) {
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

    const batchSize = 100;
    let totalInserted = 0;

    for (let i = 0; i < inputs.length; i += batchSize) {
      const batch = inputs.slice(i, i + batchSize).filter((c) => c.embedding && c.embedding.length === EMBEDDING_DIMENSION);
      if (batch.length === 0) continue;

      const values = batch.map((c) => {
        const metadataStr = JSON.stringify(c.metadata || {});
        const vectorStr = formatVectorForPg(c.embedding!);
        return Prisma.sql`(
          COALESCE(${c.id || null}, gen_random_uuid()::text),
          ${c.content},
          ${c.source},
          ${c.sourceType},
          ${metadataStr}::jsonb,
          ${vectorStr}::vector,
          NOW()
        )`;
      });

      await prisma.$transaction(async (tx) => {
        await tx.$executeRaw(
          Prisma.sql`
            INSERT INTO document_chunks (id, content, source, source_type, metadata, embedding, created_at)
            VALUES ${Prisma.join(values)}
          `
        );
      });

      totalInserted += batch.length;
    }

    return totalInserted;
  }

  /**
   * Cosine Similarity vector search on document_chunks using pgvector <=> operator.
   * Runs inside a transaction with SET LOCAL hnsw.ef_search for high-recall ANN search.
   */
  static async similaritySearch(
    queryEmbedding: number[],
    topK: number = 5,
    filterSourceType?: string | string[]
  ): Promise<DocumentChunkRecord[]> {
    const safeTopK = Math.min(100, Math.max(1, topK));
    const vectorStr = formatVectorForPg(queryEmbedding);
    const efSearch = parseInt(process.env.HNSW_EF_SEARCH || '64', 10);

    const rows = await prisma.$transaction(async (tx) => {
      // Configure local ef_search for this transaction
      await tx.$executeRaw(
        Prisma.sql`SELECT set_config('hnsw.ef_search', ${efSearch.toString()}, true)`
      );

      if (Array.isArray(filterSourceType) && filterSourceType.length > 0) {
        return tx.$queryRaw<RawSimilarityRow[]>(
          Prisma.sql`
            SELECT 
              id, 
              content, 
              source, 
              source_type, 
              metadata, 
              (1 - (embedding <=> ${vectorStr}::vector)) AS similarity
            FROM document_chunks
            WHERE source_type IN (${Prisma.join(filterSourceType)})
            ORDER BY embedding <=> ${vectorStr}::vector ASC
            LIMIT ${safeTopK}
          `
        );
      } else if (typeof filterSourceType === 'string' && filterSourceType.trim() !== '') {
        return tx.$queryRaw<RawSimilarityRow[]>(
          Prisma.sql`
            SELECT 
              id, 
              content, 
              source, 
              source_type, 
              metadata, 
              (1 - (embedding <=> ${vectorStr}::vector)) AS similarity
            FROM document_chunks
            WHERE source_type = ${filterSourceType}
            ORDER BY embedding <=> ${vectorStr}::vector ASC
            LIMIT ${safeTopK}
          `
        );
      } else {
        return tx.$queryRaw<RawSimilarityRow[]>(
          Prisma.sql`
            SELECT 
              id, 
              content, 
              source, 
              source_type, 
              metadata, 
              (1 - (embedding <=> ${vectorStr}::vector)) AS similarity
            FROM document_chunks
            ORDER BY embedding <=> ${vectorStr}::vector ASC
            LIMIT ${safeTopK}
          `
        );
      }
    });

    return rows.map((r) => ({
      id: r.id,
      content: r.content,
      source: r.source,
      sourceType: r.source_type,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
      similarity:
        typeof r.similarity === 'number'
          ? Number(r.similarity.toFixed(4))
          : Number(parseFloat(String(r.similarity)).toFixed(4)),
    }));
  }

  /**
   * PostgreSQL Full-Text Search using tsvector + GIN index.
   */
  static async keywordSearch(
    query: string,
    topK: number = 5,
    filterSourceType?: string | string[]
  ): Promise<DocumentChunkRecord[]> {
    const safeTopK = Math.min(100, Math.max(1, topK));
    const cleanTokens = query
      .replace(/[^\w\s]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((t) => t.length > 1);

    if (cleanTokens.length === 0) return [];
    const tsQuery = cleanTokens.join(' | ');

    try {
      let rows: RawSimilarityRow[];
      if (Array.isArray(filterSourceType) && filterSourceType.length > 0) {
        rows = await prisma.$queryRaw<RawSimilarityRow[]>(
          Prisma.sql`
            SELECT 
              id, 
              content, 
              source, 
              source_type, 
              metadata,
              ts_rank_cd(tsv, to_tsquery('english', ${tsQuery})) AS similarity
            FROM document_chunks
            WHERE source_type IN (${Prisma.join(filterSourceType)})
              AND tsv @@ to_tsquery('english', ${tsQuery})
            ORDER BY similarity DESC
            LIMIT ${safeTopK}
          `
        );
      } else if (typeof filterSourceType === 'string' && filterSourceType.trim() !== '') {
        rows = await prisma.$queryRaw<RawSimilarityRow[]>(
          Prisma.sql`
            SELECT 
              id, 
              content, 
              source, 
              source_type, 
              metadata,
              ts_rank_cd(tsv, to_tsquery('english', ${tsQuery})) AS similarity
            FROM document_chunks
            WHERE source_type = ${filterSourceType}
              AND tsv @@ to_tsquery('english', ${tsQuery})
            ORDER BY similarity DESC
            LIMIT ${safeTopK}
          `
        );
      } else {
        rows = await prisma.$queryRaw<RawSimilarityRow[]>(
          Prisma.sql`
            SELECT 
              id, 
              content, 
              source, 
              source_type, 
              metadata,
              ts_rank_cd(tsv, to_tsquery('english', ${tsQuery})) AS similarity
            FROM document_chunks
            WHERE tsv @@ to_tsquery('english', ${tsQuery})
            ORDER BY similarity DESC
            LIMIT ${safeTopK}
          `
        );
      }

      return rows.map((r) => ({
        id: r.id,
        content: r.content,
        source: r.source,
        sourceType: r.source_type,
        metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata,
        similarity: Number((Number(r.similarity) || 0).toFixed(4)),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Hybrid Search: Combines pgvector Cosine Search with Full-Text Keyword Search
   * using Reciprocal Rank Fusion (RRF: score = 1 / (60 + rank_v) + 1 / (60 + rank_k)).
   */
  static async hybridSearch(
    queryText: string,
    queryEmbedding: number[],
    topK: number = 5,
    filterSourceType?: string | string[]
  ): Promise<DocumentChunkRecord[]> {
    const k = 60;
    const fetchLimit = topK * 2;

    const [vectorResults, keywordResults] = await Promise.all([
      this.similaritySearch(queryEmbedding, fetchLimit, filterSourceType).catch(() => []),
      this.keywordSearch(queryText, fetchLimit, filterSourceType).catch(() => []),
    ]);

    const rrfMap = new Map<
      string,
      {
        doc: DocumentChunkRecord;
        rrfScore: number;
        vectorScore?: number;
        keywordScore?: number;
      }
    >();

    vectorResults.forEach((doc, rank) => {
      const score = 1 / (k + rank + 1);
      rrfMap.set(doc.id, {
        doc,
        rrfScore: score,
        vectorScore: doc.similarity,
        keywordScore: undefined,
      });
    });

    keywordResults.forEach((doc, rank) => {
      const additional = 1 / (k + rank + 1);
      const existing = rrfMap.get(doc.id);
      if (existing) {
        existing.rrfScore += additional;
        existing.keywordScore = doc.similarity;
      } else {
        rrfMap.set(doc.id, {
          doc,
          rrfScore: additional,
          vectorScore: undefined,
          keywordScore: doc.similarity,
        });
      }
    });

    return Array.from(rrfMap.values())
      .sort((a, b) => b.rrfScore - a.rrfScore)
      .slice(0, topK)
      .map(({ doc, rrfScore, vectorScore, keywordScore }) => ({
        ...doc,
        similarity: vectorScore ?? doc.similarity ?? Number(rrfScore.toFixed(4)),
        vectorScore: vectorScore !== undefined ? Number(vectorScore.toFixed(4)) : undefined,
        keywordScore: keywordScore !== undefined ? Number(keywordScore.toFixed(4)) : undefined,
        rrfScore: Number(rrfScore.toFixed(6)),
      }));
  }

  /**
   * Delete chunks for a specific source name using parameterized Prisma.sql.
   */
  static async deleteChunksBySource(source: string): Promise<number> {
    const count = await prisma.$executeRaw(
      Prisma.sql`DELETE FROM document_chunks WHERE source = ${source}`
    );
    return count;
  }

  /**
   * Count total indexed chunks in the vector database using parameterized Prisma.sql.
   */
  static async countChunks(): Promise<number> {
    const result = await prisma.$queryRaw<Array<{ count: bigint | number }>>(
      Prisma.sql`SELECT COUNT(*)::int as count FROM document_chunks`
    );
    return Number(result[0]?.count || 0);
  }
}

/**
 * Pure mathematical Reciprocal Rank Fusion helper for ranking aggregation.
 */
export function reciprocalRankFusion<T extends { id: string }>(
  vectorResults: T[],
  keywordResults: T[],
  k: number = 60
): Array<T & { score: number }> {
  const rrfMap = new Map<string, { item: T; score: number }>();

  vectorResults.forEach((item, rank) => {
    const s = 1 / (k + rank + 1);
    rrfMap.set(item.id, { item, score: s });
  });

  keywordResults.forEach((item, rank) => {
    const s = 1 / (k + rank + 1);
    const existing = rrfMap.get(item.id);
    if (existing) {
      existing.score += s;
    } else {
      rrfMap.set(item.id, { item, score: s });
    }
  });

  return Array.from(rrfMap.values())
    .sort((a, b) => b.score - a.score)
    .map(({ item, score }) => ({ ...item, score }));
}

export async function keywordSearch(queryText: string, topK?: number, filterSourceType?: string) {
  return PgVectorStore.keywordSearch(queryText, topK, filterSourceType);
}

export async function hybridSearch(queryEmbedding: number[], queryText: string, topK?: number, filterSourceType?: string) {
  return PgVectorStore.hybridSearch(queryText, queryEmbedding, topK, filterSourceType);
}
