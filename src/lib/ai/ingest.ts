/**
 * @file ingest.ts
 * @description Production Document and Entity Ingestion Pipeline using LangChain.
 * 
 * Pipeline:
 * Upload / Content
 *   ↓
 * Extract Text (PDF parser / Markdown / Text)
 *   ↓
 * RecursiveCharacterTextSplitter (chunkSize: 800, chunkOverlap: 120)
 *   ↓
 * Embedding Model (1536 dim)
 *   ↓
 * Store in PostgreSQL pgvector (document_chunks)
 * 
 * Input: File buffer / string, source metadata, source type (pdf, markdown, text, course, mentor, job)
 * Output: Number of chunks ingested into PostgreSQL
 */

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { PDFParse } from 'pdf-parse';
import { PgVectorStore, IngestChunkInput } from './vector-store';
import { generateEmbeddings } from './embeddings';

export interface IngestFileInput {
  filename: string;
  sourceType: 'pdf' | 'markdown' | 'text' | 'course' | 'mentor' | 'job' | 'knowledge_base';
  content?: string;
  buffer?: Buffer;
  metadata?: Record<string, any>;
}

export interface IngestResult {
  source: string;
  sourceType: string;
  chunkCount: number;
  success: boolean;
  error?: string;
}

export class DocumentIngestionService {
  private static splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 120,
    separators: ['\n\n', '\n', '. ', ' ', ''],
  });

  /**
   * Extract raw text from buffer or string based on file type.
   */
  static async extractText(input: IngestFileInput): Promise<string> {
    if (input.content && input.content.trim().length > 0) {
      return input.content;
    }

    if (!input.buffer) {
      throw new Error('Either content string or file buffer must be provided for ingestion.');
    }

    if (input.sourceType === 'pdf' || input.filename.toLowerCase().endsWith('.pdf')) {
      const parser = new PDFParse({ data: input.buffer });
      const parsed = await parser.getText();
      return parsed.text || '';
    }

    // Default text or markdown decoding
    return input.buffer.toString('utf-8');
  }

  /**
   * Ingest a document file or content payload into PostgreSQL pgvector.
   */
  static async ingestDocument(input: IngestFileInput): Promise<IngestResult> {
    try {
      const rawText = await this.extractText(input);
      if (!rawText || rawText.trim().length === 0) {
        return {
          source: input.filename,
          sourceType: input.sourceType,
          chunkCount: 0,
          success: false,
          error: 'Document content is empty',
        };
      }

      // Delete existing chunks for this source if re-indexing
      await PgVectorStore.deleteChunksBySource(input.filename);

      // Split text into chunks
      const chunks = await this.splitter.splitText(rawText);
      if (chunks.length === 0) {
        return {
          source: input.filename,
          sourceType: input.sourceType,
          chunkCount: 0,
          success: true,
        };
      }

      // Generate embeddings in batch
      const embeddings = await generateEmbeddings(chunks);

      const chunkInputs: IngestChunkInput[] = chunks.map((chunkText, idx) => ({
        content: chunkText,
        source: input.filename,
        sourceType: input.sourceType,
        metadata: {
          chunkIndex: idx,
          totalChunks: chunks.length,
          filename: input.filename,
          ...input.metadata,
        },
        embedding: embeddings[idx],
      }));

      const inserted = await PgVectorStore.insertChunks(chunkInputs);

      return {
        source: input.filename,
        sourceType: input.sourceType,
        chunkCount: inserted,
        success: true,
      };
    } catch (err: any) {
      console.error(`[DocumentIngestionService] Failed to ingest ${input.filename}:`, err);
      return {
        source: input.filename,
        sourceType: input.sourceType,
        chunkCount: 0,
        success: false,
        error: err.message || 'Ingestion failed',
      };
    }
  }

  /**
   * Ingest structured platform entities (Courses, Mentors, Jobs, Platform Docs) into pgvector.
   */
  static async ingestPlatformEntity(entity: {
    sourceName: string;
    sourceType: 'course' | 'mentor' | 'job' | 'knowledge_base';
    content: string;
    metadata?: Record<string, any>;
  }): Promise<IngestResult> {
    return this.ingestDocument({
      filename: entity.sourceName,
      sourceType: entity.sourceType,
      content: entity.content,
      metadata: entity.metadata,
    });
  }
}
