// GrowEarn Database Seed Orchestrator
// Seeds reference data by default; loads demo fixtures when in development/demo environments.

import { seedReferenceData } from './seed/reference';

async function main() {
  console.log('🌱 Starting database seed...');
  await seedReferenceData();

  if (process.env.APP_ENV === 'demo' || process.env.APP_ENV === 'development' || process.env.APP_ENV === 'test') {
    const { seedFixtures } = await import('./seed/fixtures');
    await seedFixtures();
  }
  console.log('✨ Seed completed.');
}

main().catch((err) => {
  console.error('Seed execution error:', err);
  process.exit(1);
});
