// Local BGE-M3 (1024 dimensions) embedding service via Ollama / local model serving.

export const EMBEDDING_DIMENSION = 1024;

export interface EmbeddingProvider {
  readonly name: string;
  readonly dimension: number;
  generateEmbedding(text: string): Promise<number[]>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
  checkHealth(): Promise<{ healthy: boolean; model: string; error?: string }>;
}

export class LocalBGE3EmbeddingProvider implements EmbeddingProvider {
  readonly name = 'LOCAL_BGE_M3';
  readonly dimension = EMBEDDING_DIMENSION;

  private baseUrl: string;
  private model: string;

  constructor(baseUrl?: string, model?: string) {
    this.baseUrl = (baseUrl || process.env.EMBEDDING_BASE_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
    this.model = model || process.env.BGE_M3_MODEL || 'bge-m3';
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public getModelName(): string {
    return this.model;
  }

  public async checkHealth(): Promise<{ healthy: boolean; model: string; error?: string }> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) {
        return { healthy: false, model: this.model, error: `HTTP ${res.status}: ${res.statusText}` };
      }
      const data = await res.json();
      const models = (data.models || []).map((m: any) => m.name || m.model);
      const hasModel = models.some((m: string) => m.includes(this.model) || this.model.includes(m));
      return {
        healthy: true,
        model: this.model,
        error: hasModel ? undefined : `Model '${this.model}' not found in Ollama library`,
      };
    } catch (err: any) {
      return { healthy: false, model: this.model, error: err.message || 'Connection failed' };
    }
  }

  // Generate real 1024-dimensional vector embedding for single text.
  public async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Embedding input text cannot be empty');
    }

    const trimmed = text.trim();

    try {
      // First try standard Ollama /api/embed (Ollama 0.1.33+)
      const embedUrl = `${this.baseUrl}/api/embed`;
      const response = await fetch(embedUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          input: trimmed,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawVector = Array.isArray(data.embeddings) ? data.embeddings[0] : null;
        if (rawVector && Array.isArray(rawVector)) {
          this.validateVector(rawVector);
          return rawVector;
        }
      }

      // Fall back to Ollama /api/embeddings endpoint
      const legacyUrl = `${this.baseUrl}/api/embeddings`;
      const legacyRes = await fetch(legacyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: trimmed,
        }),
      });

      if (!legacyRes.ok) {
        const errBody = await legacyRes.text().catch(() => '');
        throw new Error(`SEMANTIC_RAG_UNAVAILABLE: Local BGE-M3 embedding service returned HTTP ${legacyRes.status} (${errBody || legacyRes.statusText})`);
      }

      const legacyData = await legacyRes.json();
      const rawVector = legacyData.embedding;

      if (!rawVector || !Array.isArray(rawVector)) {
        throw new Error('SEMANTIC_RAG_UNAVAILABLE: Local BGE-M3 embedding response did not contain a valid vector');
      }

      this.validateVector(rawVector);
      return rawVector;
    } catch (err: any) {
      if (err.message?.startsWith('SEMANTIC_RAG_UNAVAILABLE') || err.message?.startsWith('SEMANTIC_RAG_DIMENSION_MISMATCH')) {
        throw err;
      }
      throw new Error(`SEMANTIC_RAG_UNAVAILABLE: Failed to communicate with local BGE-M3 embedding service at ${this.baseUrl} (${err.message})`);
    }
  }

  // Generate real 1024-dimensional vector embeddings for multiple texts.
  public async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!texts || texts.length === 0) return [];

    try {
      // Try batch /api/embed first
      const embedUrl = `${this.baseUrl}/api/embed`;
      const response = await fetch(embedUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          input: texts,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.embeddings) && data.embeddings.length === texts.length) {
          for (let i = 0; i < data.embeddings.length; i++) {
            this.validateVector(data.embeddings[i]);
          }
          return data.embeddings;
        }
      }

      // If batch not supported or failed, process sequentially
      const results: number[][] = [];
      for (const t of texts) {
        const vec = await this.generateEmbedding(t);
        results.push(vec);
      }
      return results;
    } catch (err: any) {
      if (err.message?.startsWith('SEMANTIC_RAG_UNAVAILABLE') || err.message?.startsWith('SEMANTIC_RAG_DIMENSION_MISMATCH')) {
        throw err;
      }
      throw new Error(`SEMANTIC_RAG_UNAVAILABLE: Batch embedding generation failed: ${err.message}`);
    }
  }

  private validateVector(vector: number[]): void {
    if (!Array.isArray(vector)) {
      throw new Error('SEMANTIC_RAG_UNAVAILABLE: Embedding result is not an array');
    }
    if (vector.length !== EMBEDDING_DIMENSION) {
      throw new Error(
        `SEMANTIC_RAG_DIMENSION_MISMATCH: Local BGE-M3 model returned ${vector.length} dimensions, expected exactly ${EMBEDDING_DIMENSION}`
      );
    }
    for (let i = 0; i < vector.length; i++) {
      if (typeof vector[i] !== 'number' || !Number.isFinite(vector[i])) {
        throw new Error(`SEMANTIC_RAG_UNAVAILABLE: Invalid non-finite float at vector index ${i}`);
      }
    }
  }
}

let defaultProvider: LocalBGE3EmbeddingProvider | null = null;

export function getEmbeddingProvider(): LocalBGE3EmbeddingProvider {
  if (!defaultProvider) {
    defaultProvider = new LocalBGE3EmbeddingProvider();
  }
  return defaultProvider;
}

export function isEmbeddingConfigured(): boolean {
  const url = process.env.EMBEDDING_BASE_URL || 'http://127.0.0.1:11434';
  return Boolean(url && url.trim().length > 0);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  return getEmbeddingProvider().generateEmbedding(text);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  return getEmbeddingProvider().generateEmbeddings(texts);
}
