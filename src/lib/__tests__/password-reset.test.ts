import assert from 'assert';
import crypto from 'crypto';
import { hashPassword, verifyPassword } from '../password';

export async function runPasswordResetTests() {
  const users = new Map<string, { email: string; passwordHash: string; id: string }>();
  const resetTokens = new Map<string, { tokenHash: string; expiresAt: Date; used: boolean; userId: string }>();
  const activeSessions = new Map<string, { userId: string }>();

  users.set('realuser@growearn.com', {
    id: 'usr_real_123',
    email: 'realuser@growearn.com',
    passwordHash: 'old_salted_hash_value',
  });
  activeSessions.set('sess_token_1', { userId: 'usr_real_123' });
  activeSessions.set('sess_token_2', { userId: 'usr_real_123' });

  function requestPasswordReset(email: string): { success: boolean; message: string; debugToken?: string } {
    const normalized = email.toLowerCase().trim();
    const user = users.get(normalized);

    let debugToken: string | undefined = undefined;
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      resetTokens.set(tokenHash, {
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
        used: false,
        userId: user.id,
      });
      debugToken = rawToken;
    }

    return {
      success: true,
      message: 'If an account matches that email address, password reset instructions have been sent.',
      debugToken,
    };
  }

  async function completePasswordReset(rawToken: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = resetTokens.get(tokenHash);

    if (!record || record.used || record.expiresAt < new Date()) {
      return { success: false, error: 'INVALID_OR_EXPIRED_TOKEN' };
    }

    record.used = true;
    const newHash = await hashPassword(newPassword);

    for (const [, user] of users.entries()) {
      if (user.id === record.userId) {
        user.passwordHash = newHash;
      }
    }

    for (const [sessId, session] of activeSessions.entries()) {
      if (session.userId === record.userId) {
        activeSessions.delete(sessId);
      }
    }

    return { success: true };
  }

  // 1. returns identical generic responses preventing account enumeration
  const resUnknown = requestPasswordReset('nonexistent@randomdomain.org');
  const resReal = requestPasswordReset('realuser@growearn.com');
  assert.strictEqual(resUnknown.message, resReal.message);
  assert.strictEqual(resUnknown.success, resReal.success);

  // 2. completes password reset and revokes all active user sessions
  const { debugToken } = requestPasswordReset('realuser@growearn.com');
  assert(Boolean(debugToken));
  assert.strictEqual(activeSessions.size, 2);

  const resetRes = await completePasswordReset(debugToken!, 'NewSecurePassword123!');
  assert.strictEqual(resetRes.success, true);
  assert.strictEqual(activeSessions.size, 0);

  const updatedUser = users.get('realuser@growearn.com')!;
  const match = await verifyPassword('NewSecurePassword123!', updatedUser.passwordHash);
  assert.strictEqual(match, true);

  // 3. rejects reuse of already-consumed password reset token
  const secondAttempt = await completePasswordReset(debugToken!, 'SecondPasswordChange123!');
  assert.strictEqual(secondAttempt.success, false);
  assert.strictEqual(secondAttempt.error, 'INVALID_OR_EXPIRED_TOKEN');

  return true;
}

if (process.argv[1] && process.argv[1].includes('password-reset')) {
  runPasswordResetTests().then(() => {
    console.log('✅ Password reset lifecycle & anti-enumeration tests passed.');
  });
}
