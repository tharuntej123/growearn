// Security Maintenance Script: Invalidate All Active Sessions
// Run after security patching and password reset deployments.

import { prisma } from '../src/lib/prisma';

async function invalidateAllSessions() {
  console.log('🔒 Initiating Global Session Invalidation...');

  const deletedSessions = await prisma.session.deleteMany();
  console.log(`✅ Successfully revoked and deleted ${deletedSessions.count} active sessions.`);

  // Record audit log entry
  await prisma.auditLog.create({
    data: {
      action: 'SECURITY_INVALIDATE_ALL_SESSIONS',
      resource: 'Session',
      details: {
        revokedCount: deletedSessions.count,
        timestamp: new Date().toISOString(),
        reason: 'Security Hardening: Mandatory credential reset and session purge.',
      },
    },
  });

  console.log('📜 Security audit log recorded successfully.');
}

invalidateAllSessions()
  .catch((err) => {
    console.error('❌ Failed to invalidate sessions:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
