import { prisma } from '../src/lib/prisma';

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY,
      points INTEGER NOT NULL DEFAULT 1,
      expires_at TIMESTAMP(3) NOT NULL
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS rate_limits_expires_at_idx ON rate_limits (expires_at)
  `);
  console.log('rate_limits table verified and active');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
