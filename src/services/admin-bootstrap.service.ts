import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export class AdminBootstrapService {
  /**
   * One-time, audited administrative bootstrap.
   * If ADMIN_BOOTSTRAP_EMAIL is configured and exactly 0 ADMIN users exist in the database,
   * promote the user with matching email to ADMIN and record an immutable audit log entry.
   * If an ADMIN already exists, this function does nothing and logs a notice.
   */
  public static async bootstrapAdminIfNeeded(): Promise<{ bootstrapped: boolean; reason?: string }> {
    const bootstrapEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
    if (!bootstrapEmail) {
      return { bootstrapped: false, reason: 'ADMIN_BOOTSTRAP_EMAIL not set' };
    }

    try {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      });

      if (adminCount > 0) {
        logger.info(`[AdminBootstrap] Skipped: ${adminCount} ADMIN account(s) already exist.`);
        return { bootstrapped: false, reason: 'Admin accounts already exist' };
      }

      const targetUser = await prisma.user.findUnique({
        where: { email: bootstrapEmail },
      });

      if (!targetUser) {
        logger.warn(`[AdminBootstrap] User with email ${bootstrapEmail} not found; cannot bootstrap.`);
        return { bootstrapped: false, reason: 'Target user not found' };
      }

      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: targetUser.id },
          data: { role: 'ADMIN', isVerified: true },
        });

        await tx.auditLog.create({
          data: {
            userId: targetUser.id,
            action: 'ADMIN_BOOTSTRAP_PROMOTION',
            resource: 'User',
            details: {
              email: targetUser.email,
              previousRole: targetUser.role,
              bootstrappedAt: new Date().toISOString(),
            },
          },
        });
      });

      logger.info(`[AdminBootstrap] Successfully bootstrapped initial ADMIN account: ${bootstrapEmail}`);
      return { bootstrapped: true };
    } catch (_err) {
      const err = _err as Error;
      logger.error('[AdminBootstrap:Error]', err.message);
      return { bootstrapped: false, reason: err.message };
    }
  }
}
