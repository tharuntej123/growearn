// Demo & Staging Fixture Seed
// Strictly refuses to run in production environments (APP_ENV=production).

import { PrismaClient } from '@prisma/client';
import { seedReferenceData } from './reference';

const prisma = new PrismaClient();

export async function seedFixtures() {
  const env = process.env.APP_ENV || process.env.NODE_ENV || 'development';
  if (env === 'production') {
    throw new Error('⛔ FATAL: Fixtures seed refuses to execute in production environment (APP_ENV=production).');
  }

  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.includes('prod') && !process.env.ALLOW_PRODUCTION_SEED) {
    throw new Error('⛔ FATAL: Refusing to seed fixtures against production database endpoint.');
  }

  console.log(`🌱 Seeding demo/staging fixtures for environment: ${env}...`);
  // Ensure reference skills are seeded first
  await seedReferenceData();
  const { seedFixturesData } = await import('./data/fixtures');
  await seedFixturesData();

  console.log('✅ Demo fixture provisioning completed successfully.');
}

if (require.main === module) {
  seedFixtures()
    .catch((err) => {
      console.error('Fixture seeding error:', err.message);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
