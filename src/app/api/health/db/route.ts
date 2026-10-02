import { NextRequest } from 'next/server';
import { checkDatabaseHealth } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  const dbHealth = await checkDatabaseHealth();

  if (!dbHealth.connected) {
    return apiError(
      `Database connection degraded: ${dbHealth.error || 'Connection failed'}`,
      'DATABASE_UNHEALTHY',
      503,
      { latencyMs: dbHealth.latencyMs, database: 'PostgreSQL / Neon' }
    );
  }

  let vectorExtension = false;
  try {
    const ext = await prisma.$queryRawUnsafe<Array<{ extname: string }>>(
      `SELECT extname FROM pg_extension WHERE extname = 'vector'`
    );
    vectorExtension = ext.length > 0;
  } catch {
    vectorExtension = false;
  }

  return apiSuccess({
    status: 'HEALTHY',
    database: {
      provider: 'PostgreSQL / Neon',
      connected: true,
      latencyMs: dbHealth.latencyMs,
      pgvectorEnabled: vectorExtension,
    },
    timestamp: new Date().toISOString(),
  });
}
