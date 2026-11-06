import { Embeddings, EmbeddingsParams } from '@langchain/core/embeddings';
import { LocalBGE3EmbeddingProvider, EMBEDDING_DIMENSION } from './embeddings';

export interface BgeM3EmbeddingsParams extends EmbeddingsParams {
  baseUrl?: string;
  model?: string;
}

/**
 * LangChain-compatible Embeddings implementation wrapping Growearn's local BGE-M3 provider.
 */
export class BgeM3Embeddings extends Embeddings {
  private provider: LocalBGE3EmbeddingProvider;
  readonly dimension: number = EMBEDDING_DIMENSION;

  constructor(params?: BgeM3EmbeddingsParams) {
    super(params || {});
    this.provider = new LocalBGE3EmbeddingProvider(params?.baseUrl, params?.model);
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    return this.provider.generateEmbeddings(documents);
  }

  async embedQuery(document: string): Promise<number[]> {
    return this.provider.generateEmbedding(document);
  }

  getProvider(): LocalBGE3EmbeddingProvider {
    return this.provider;
  }
}

