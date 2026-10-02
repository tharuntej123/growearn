/**
 * @file embeddings.ts
 * @description Real vector embedding generation service using LangChain OpenAIEmbeddings.
 * 
 * Strict Production Rule:
 * - NO hash-based pseudo/fake deterministic embeddings.
 * - If embedding provider is unavailable or not configured, cleanly returns an explicit error/null.
 */

import { OpenAIEmbeddings } from '@langchain/openai';

export const EMBEDDING_DIMENSION = 1536;

let cachedEmbeddingsInstance: OpenAIEmbeddings | null = null;

function getOpenAIEmbeddings(): OpenAIEmbeddings | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }

  if (!cachedEmbeddingsInstance) {
    cachedEmbeddingsInstance = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      modelName: 'text-embedding-3-small',
      dimensions: EMBEDDING_DIMENSION,
    });
  }

  return cachedEmbeddingsInstance;
}

export function isEmbeddingConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0);
}

/**
 * Generate a real vector embedding for a single query or text chunk.
 * Throws a controlled error if embeddings provider is not configured or fails.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text || text.trim().length === 0) {
    throw new Error('Embedding input text cannot be empty');
  }

  const embeddingsService = getOpenAIEmbeddings();
  if (!embeddingsService) {
    throw new Error('Embeddings provider (OPENAI_API_KEY) is not configured in the environment.');
  }

  try {
    const result = await embeddingsService.embedQuery(text);
    if (!result || result.length !== EMBEDDING_DIMENSION) {
      throw new Error(`Embedding generation returned invalid vector dimensions (${result?.length} vs expected ${EMBEDDING_DIMENSION})`);
    }
    return result;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown embedding error';
    throw new Error(`Vector embedding generation failed: ${msg}`);
  }
}

/**
 * Generate real vector embeddings for a batch of text chunks.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!texts || texts.length === 0) return [];

  const embeddingsService = getOpenAIEmbeddings();
  if (!embeddingsService) {
    throw new Error('Embeddings provider (OPENAI_API_KEY) is not configured in the environment.');
  }

  try {
    const results = await embeddingsService.embedDocuments(texts);
    if (!results || results.length !== texts.length) {
      throw new Error('Batch embedding generation returned mismatched results count');
    }
    return results;
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown batch embedding error';
    throw new Error(`Batch vector embedding generation failed: ${msg}`);
  }
}
