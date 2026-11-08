// LangChain Vector Retriever for PostgreSQL pgvector.
// Enforces role-based source-type allowlists and candidate retrieval audit logging.

import { BaseRetriever, BaseRetrieverInput } from '@langchain/core/retrievers';
import { Document } from '@langchain/core/documents';
import { generateEmbedding } from './embeddings';
import { PgVectorStore, DocumentChunkRecord } from './vector-store';
import { prisma } from '@/lib/prisma';
import { normalizeRole } from '@/lib/auth';

export const ROLE_ALLOWED_SOURCE_TYPES: Record<string, string[]> = {
  LEARNER: ['course', 'mentor', 'job'],
  FREELANCER: ['course', 'mentor', 'job'],
  MENTOR: ['course', 'mentor', 'job'],
  COMPANY: ['candidate', 'course', 'mentor', 'job'],
  ADMIN: ['candidate', 'course', 'mentor', 'job'],
};

export interface VectorRetrieverOptions extends BaseRetrieverInput {
  topK?: number;
  sourceType?: string;
  minSimilarity?: number;
  mode?: 'vector' | 'hybrid';
  userRole?: string;
  userId?: string;
}

export class PgVectorRetriever extends BaseRetriever {
  lc_namespace = ['growearn', 'retrievers', 'pgvector'];

  private topK: number;
  private sourceType?: string;
  private minSimilarity: number;
  public mode: 'vector' | 'hybrid';
  public userRole: string;
  public userId?: string;

  constructor(options: VectorRetrieverOptions = {}) {
    super(options);
    this.topK = options.topK ?? 5;
    this.sourceType = options.sourceType;
    this.minSimilarity = options.minSimilarity ?? 0.0;
    this.mode = options.mode ?? 'hybrid';
    try {
      this.userRole = normalizeRole(options.userRole);
    } catch {
      this.userRole = 'LEARNER';
    }
    this.userId = options.userId;
  }

  // Core LangChain retrieval method.
  async _getRelevantDocuments(query: string): Promise<Document[]> {
    const records = await this.retrieveRecords(query);

    return records.map(
      (r) =>
        new Document({
          pageContent: r.content,
          metadata: {
            id: r.id,
            source: r.source,
            sourceType: r.sourceType,
            similarity: r.similarity,
            ...r.metadata,
          },
        })
    );
  }

  // Retrieves raw document chunk records with exact similarity scores and role boundary enforcement.
  async retrieveRecords(query: string): Promise<DocumentChunkRecord[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const allowedSources = ROLE_ALLOWED_SOURCE_TYPES[this.userRole] || ['course', 'mentor', 'job'];
    let effectiveFilter: string | string[] | undefined = undefined;

    if (this.sourceType && this.sourceType.trim() !== '') {
      // If caller requests a source type not permitted for their role, reject immediately.
      if (!allowedSources.includes(this.sourceType)) {
        return [];
      }
      effectiveFilter = this.sourceType;
    } else {
      // General queries: If role cannot access candidates (e.g. LEARNER, FREELANCER),
      // restrict search filter explicitly to allowed non-PII sources.
      if (!allowedSources.includes('candidate')) {
        effectiveFilter = allowedSources;
      }
    }

    const queryEmbedding = await generateEmbedding(query);
    const results =
      this.mode === 'hybrid'
        ? await PgVectorStore.hybridSearch(query, queryEmbedding, this.topK, effectiveFilter)
        : await PgVectorStore.similaritySearch(queryEmbedding, this.topK, effectiveFilter);

    // Filter by similarity threshold
    const filtered =
      this.minSimilarity > 0
        ? results.filter((r) => (r.similarity ?? 0) >= this.minSimilarity)
        : results;

    // Defense-in-depth: scrub any candidate PII fields that should never be exposed
    filtered.forEach((r) => {
      if (r.sourceType === 'candidate' && r.metadata) {
        delete (r.metadata as Record<string, any>).email;
        delete (r.metadata as Record<string, any>).phone;
        delete (r.metadata as Record<string, any>).address;
      }
    });

    // Audit Logging: If candidate chunks were retrieved by COMPANY or ADMIN, write audit record
    const candidateChunks = filtered.filter((r) => r.sourceType === 'candidate');
    if (candidateChunks.length > 0 && (this.userRole === 'COMPANY' || this.userRole === 'ADMIN')) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: this.userId || null,
            action: 'CANDIDATE_SEARCH_RETRIEVAL',
            resource: 'DocumentChunk',
            details: {
              query,
              candidateCount: candidateChunks.length,
              candidateIds: candidateChunks.map((c) => c.metadata?.userId || c.id),
              role: this.userRole,
            },
          },
        });
      } catch (auditErr) {
        console.error('[PgVectorRetriever] Failed to record candidate retrieval audit:', auditErr);
      }
    }

    return filtered;
  }

  // Helper to format retrieved documents into a clean context string for LLM prompting.
  static formatDocsForPrompt(docs: DocumentChunkRecord[] | Document[]): string {
    if (!docs || docs.length === 0) {
      return 'No relevant context documents found in the database.';
    }

    return docs
      .map((doc, idx) => {
        const content = 'pageContent' in doc ? doc.pageContent : doc.content;
        const source =
          'metadata' in doc && doc.metadata?.source
            ? doc.metadata.source
            : (doc as DocumentChunkRecord).source || 'Database';
        const similarity =
          'metadata' in doc && doc.metadata?.similarity !== undefined
            ? doc.metadata.similarity
            : (doc as DocumentChunkRecord).similarity;
        const scoreInfo = similarity !== undefined ? ` [Similarity: ${similarity}]` : '';

        return `[Source ${idx + 1}: ${source}${scoreInfo}]\n${content.trim()}`;
      })
      .join('\n\n---\n\n');
  }
}
