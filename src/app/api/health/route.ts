import { NextRequest, NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET(_req: NextRequest) {
  const dbHealth = await checkDatabaseHealth();

  if (!dbHealth.connected) {
    return apiError(
      `Database connection degraded: ${dbHealth.error || 'Connection failed'}`,
      'DATABASE_UNHEALTHY',
      503,
      { latencyMs: dbHealth.latencyMs, database: 'Neon / Prisma' }
    );
  }

  return apiSuccess({
    status: 'HEALTHY',
    database: {
      provider: 'Prisma / Neon',
      connected: true,
      latencyMs: dbHealth.latencyMs,
    },
    timestamp: new Date().toISOString(),
  });
}
