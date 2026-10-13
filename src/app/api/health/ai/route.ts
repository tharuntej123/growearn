import { NextResponse } from 'next/server';
import { LocalBGE3EmbeddingProvider } from '@/lib/ai/embeddings';
import { LLMClient } from '@/lib/ai/llm-client';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const embeddingProvider = new LocalBGE3EmbeddingProvider();
    const [embeddingHealth, pgvectorCheck] = await Promise.all([
      embeddingProvider.checkHealth(),
      (async () => {
        try {
          const ext = await prisma.$queryRawUnsafe<Array<{ extname: string }>>(
            `SELECT extname FROM pg_extension WHERE extname = 'vector'`
          );
          return ext.length > 0;
        } catch {
          return false;
        }
      })(),
    ]);

    const llmProvider = LLMClient.getActiveProvider();

    const isFullyHealthy = embeddingHealth.healthy && pgvectorCheck && llmProvider !== 'none';

    return NextResponse.json(
      {
        status: isFullyHealthy ? 'HEALTHY' : 'DEGRADED',
        embeddingService: {
          model: embeddingHealth.model,
          healthy: embeddingHealth.healthy,
          error: embeddingHealth.error,
        },
        vectorStore: {
          pgvectorInstalled: pgvectorCheck,
        },
        llm: {
          provider: llmProvider,
          available: llmProvider !== 'none',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'UNHEALTHY',
        error: err.message || 'AI health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
