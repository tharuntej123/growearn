// Nightly Reset Script for GrowEarn Demo Environment
// Re-applies reference seeds and demo fixtures safely. Refuses to run if APP_ENV=production.

import { prisma } from '../src/lib/prisma';
import { seedReferenceData } from '../prisma/seed/reference';
import { seedFixtures } from '../prisma/seed/fixtures';

async function resetDemoDb() {
  if (process.env.APP_ENV === 'production') {
    console.error('⛔ FATAL: Cannot run demo reset script in production environment.');
    process.exit(1);
  }

  console.log('🔄 Starting nightly demo environment reset...');
  
  // Clean transactional state
  await prisma.auditLog.deleteMany({ where: { details: { path: ['isDemo'], equals: true } } }).catch(() => {});
  await prisma.rateLimit.deleteMany().catch(() => {});
  
  // Ensure reference taxonomy is intact
  await seedReferenceData();
  
  // Re-seed demo fixtures
  await seedFixtures();

  console.log('✨ Nightly demo reset completed successfully.');
}

if (require.main === module) {
  resetDemoDb()
    .catch((err) => {
      console.error('Reset error:', err);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

export { resetDemoDb };
