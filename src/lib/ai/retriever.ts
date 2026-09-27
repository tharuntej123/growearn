/**
 * @file retriever.ts
 * @description LangChain Vector Retriever for PostgreSQL pgvector.
 * 
 * Architecture:
 * - Query -> Embedding Model (1536 dim) -> Cosine Search via PgVectorStore -> Top-5 Grounded Chunks
 * - No keyword-matching hacks or artificial semantic scores.
 * 
 * Input: User search query string, optional filter and topK limit (default 5)
 * Output: Grounded document chunks with exact vector similarity scores and source citations
 */

import { BaseRetriever, BaseRetrieverInput } from '@langchain/core/retrievers';
import { Document } from '@langchain/core/documents';
import { generateEmbedding } from './embeddings';
import { PgVectorStore, DocumentChunkRecord } from './vector-store';

export interface VectorRetrieverOptions extends BaseRetrieverInput {
  topK?: number;
  sourceType?: string;
  minSimilarity?: number;
}

export class PgVectorRetriever extends BaseRetriever {
  lc_namespace = ['growearn', 'retrievers', 'pgvector'];
  
  private topK: number;
  private sourceType?: string;
  private minSimilarity: number;

  constructor(options: VectorRetrieverOptions = {}) {
    super(options);
    this.topK = options.topK ?? 5;
    this.sourceType = options.sourceType;
    this.minSimilarity = options.minSimilarity ?? 0.0;
  }

  /**
   * Core LangChain retrieval method.
   * Embeds the user query and retrieves top K matching chunks from PostgreSQL pgvector.
   */
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

  /**
   * Retrieves raw document chunk records with exact cosine similarity scores.
   */
  async retrieveRecords(query: string): Promise<DocumentChunkRecord[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const queryEmbedding = await generateEmbedding(query);
    const results = await PgVectorStore.similaritySearch(
      queryEmbedding,
      this.topK,
      this.sourceType
    );

    if (this.minSimilarity > 0) {
      return results.filter((r) => (r.similarity ?? 0) >= this.minSimilarity);
    }

    return results;
  }

  /**
   * Helper to format retrieved documents into a clean context string for LLM prompting.
   */
  static formatDocsForPrompt(docs: DocumentChunkRecord[] | Document[]): string {
    if (!docs || docs.length === 0) {
      return 'No relevant context documents found in the database.';
    }

    return docs
      .map((doc, idx) => {
        const content = 'pageContent' in doc ? doc.pageContent : doc.content;
        const source = 'metadata' in doc && doc.metadata?.source ? doc.metadata.source : (doc as DocumentChunkRecord).source || 'Database';
        const similarity = 'metadata' in doc && doc.metadata?.similarity !== undefined ? doc.metadata.similarity : (doc as DocumentChunkRecord).similarity;
        const scoreInfo = similarity !== undefined ? ` [Similarity: ${similarity}]` : '';

        return `[Source ${idx + 1}: ${source}${scoreInfo}]\n${content.trim()}`;
      })
      .join('\n\n---\n\n');
  }
}
