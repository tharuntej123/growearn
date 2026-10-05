/**
 * @file ingest.ts
 * @description Production Document and Entity Ingestion Pipeline using BGE-M3 (1024 dims).
 * 
 * Pipeline:
 * Upload / Entity Content
 *   ↓
 * Extract Text (PDF parser / Markdown / Text / Structured Metadata)
 *   ↓
 * RecursiveCharacterTextSplitter (chunkSize: 800, chunkOverlap: 120)
 *   ↓
 * Embedding Model (Local BGE-M3, 1024 dim)
 *   ↓
 * Store in PostgreSQL pgvector (document_chunks table) with HNSW Index
 * 
 * Unified Metadata Standards:
 * - Course -> courseId
 * - Mentor -> mentorProfileId
 * - Job -> jobId
 * - Candidate / User -> userId
 * - Project -> projectId
 * - Roadmap -> roadmapId
 */

import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { PDFParse } from 'pdf-parse';
import { PgVectorStore, IngestChunkInput } from './vector-store';
import { generateEmbeddings, isEmbeddingConfigured } from './embeddings';

export interface IngestFileInput {
  filename: string;
  sourceType: 'pdf' | 'markdown' | 'text' | 'course' | 'mentor' | 'job' | 'candidate' | 'knowledge_base';
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
    if (!isEmbeddingConfigured()) {
      return {
        source: input.filename,
        sourceType: input.sourceType,
        chunkCount: 0,
        success: false,
        error: 'SEMANTIC_RAG_UNAVAILABLE: Local BGE-M3 embedding service is not configured',
      };
    }

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

      // Generate real vector embeddings in batch
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
   * Ingest a Course entity with authoritative metadata (courseId).
   */
  static async ingestCourse(course: {
    id: string;
    title: string;
    description: string;
    category: string;
    level: string;
    skillsCovered?: string | null;
  }): Promise<IngestResult> {
    const content = `Course: ${course.title}\nLevel: ${course.level}\nCategory: ${course.category}\nSkills: ${course.skillsCovered || ''}\nDescription: ${course.description}`;
    return this.ingestDocument({
      filename: `course_${course.id}`,
      sourceType: 'course',
      content,
      metadata: {
        courseId: course.id,
        title: course.title,
        level: course.level,
        category: course.category,
        skillsCovered: course.skillsCovered,
      },
    });
  }

  /**
   * Ingest a Mentor entity with authoritative metadata (mentorProfileId).
   */
  static async ingestMentor(mentor: {
    id: string;
    userId: string;
    name: string;
    headline?: string | null;
    expertise: string;
    bio: string;
    hourlyRate: number;
    yearsExperience: number;
  }): Promise<IngestResult> {
    const content = `Mentor: ${mentor.name}\nHeadline: ${mentor.headline || ''}\nExpertise: ${mentor.expertise}\nYears Experience: ${mentor.yearsExperience}\nHourly Rate: $${mentor.hourlyRate}/hr\nBio: ${mentor.bio}`;
    return this.ingestDocument({
      filename: `mentor_${mentor.id}`,
      sourceType: 'mentor',
      content,
      metadata: {
        mentorProfileId: mentor.id,
        userId: mentor.userId,
        name: mentor.name,
        expertise: mentor.expertise,
        hourlyRate: mentor.hourlyRate,
        yearsExperience: mentor.yearsExperience,
      },
    });
  }

  /**
   * Ingest a Job entity with authoritative metadata (jobId).
   */
  static async ingestJob(job: {
    id: string;
    title: string;
    description: string;
    skills: string[];
    experienceLevel: string;
    locationType: string;
    city?: string | null;
    country: string;
  }): Promise<IngestResult> {
    const content = `Job: ${job.title}\nLocation Type: ${job.locationType} (${job.city || ''}, ${job.country})\nExperience Level: ${job.experienceLevel}\nRequired Skills: ${job.skills.join(', ')}\nDescription: ${job.description}`;
    return this.ingestDocument({
      filename: `job_${job.id}`,
      sourceType: 'job',
      content,
      metadata: {
        jobId: job.id,
        title: job.title,
        requiredSkills: job.skills,
        experienceLevel: job.experienceLevel,
        locationType: job.locationType,
      },
    });
  }

  /**
   * Ingest a Candidate entity with authoritative metadata (userId).
   */
  static async ingestCandidate(candidate: {
    id: string;
    name: string;
    headline?: string | null;
    bio?: string | null;
    skills: string[];
    yearsOfExperience: number;
    careerGoal?: string | null;
    projectsSummary?: string;
    certificationsSummary?: string;
  }): Promise<IngestResult> {
    const content = `Candidate Profile: ${candidate.name}\nHeadline: ${candidate.headline || ''}\nSkills: ${candidate.skills.join(', ')}\nExperience: ${candidate.yearsOfExperience} years\nCareer Goal: ${candidate.careerGoal || ''}\nBio: ${candidate.bio || ''}\nProjects: ${candidate.projectsSummary || ''}\nCertifications: ${candidate.certificationsSummary || ''}`;
    return this.ingestDocument({
      filename: `candidate_${candidate.id}`,
      sourceType: 'candidate',
      content,
      metadata: {
        userId: candidate.id,
        name: candidate.name,
        skills: candidate.skills,
        yearsOfExperience: candidate.yearsOfExperience,
        careerGoal: candidate.careerGoal,
      },
    });
  }

  /**
   * Delete vector index chunks when an entity is deleted.
   */
  static async deleteEntityVector(sourceType: string, entityId: string): Promise<number> {
    const sourceName = `${sourceType}_${entityId}`;
    return PgVectorStore.deleteChunksBySource(sourceName);
  }
}
