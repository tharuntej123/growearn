import { prisma } from '../src/lib/prisma';

async function main() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Profile" 
    ADD COLUMN IF NOT EXISTS "resumeKey" TEXT,
    ADD COLUMN IF NOT EXISTS "resumeMimeType" TEXT,
    ADD COLUMN IF NOT EXISTS "resumeStorageProvider" TEXT DEFAULT 'local';
  `);
  console.log('Profile storage columns added successfully');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
