import assert from 'assert';
import crypto from 'crypto';

export async function runEmailVerificationTests() {
  const tokenStore = new Map<string, { tokenHash: string; expiresAt: Date; used: boolean; userId: string }>();

  function createVerificationToken(userId: string): { rawToken: string; tokenHash: string } {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    tokenStore.set(tokenHash, { tokenHash, expiresAt, used: false, userId });
    return { rawToken, tokenHash };
  }

  function verifyToken(rawToken: string): { success: boolean; error?: string; userId?: string } {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const record = tokenStore.get(tokenHash);

    if (!record) {
      return { success: false, error: 'INVALID_TOKEN' };
    }
    if (record.used) {
      return { success: false, error: 'TOKEN_ALREADY_USED' };
    }
    if (record.expiresAt < new Date()) {
      return { success: false, error: 'TOKEN_EXPIRED' };
    }

    record.used = true;
    return { success: true, userId: record.userId };
  }

  // 1. generates secure 32-byte token and stores sha256 hash
  const { rawToken, tokenHash } = createVerificationToken('user_test_1');
  assert.strictEqual(rawToken.length, 64);
  assert.strictEqual(tokenHash.length, 64);
  assert.notStrictEqual(rawToken, tokenHash);

  // 2. successfully verifies and invalidates valid token on first use
  const { rawToken: rawToken2 } = createVerificationToken('user_test_2');
  const result1 = verifyToken(rawToken2);
  assert.strictEqual(result1.success, true);
  assert.strictEqual(result1.userId, 'user_test_2');

  const result2 = verifyToken(rawToken2);
  assert.strictEqual(result2.success, false);
  assert.strictEqual(result2.error, 'TOKEN_ALREADY_USED');

  // 3. strictly rejects expired verification tokens
  const { rawToken: rawToken3, tokenHash: tokenHash3 } = createVerificationToken('user_test_3');
  const record = tokenStore.get(tokenHash3)!;
  record.expiresAt = new Date(Date.now() - 1000);
  const expiredResult = verifyToken(rawToken3);
  assert.strictEqual(expiredResult.success, false);
  assert.strictEqual(expiredResult.error, 'TOKEN_EXPIRED');

  // 4. strictly rejects forged or tampered verification tokens
  const forgedResult = verifyToken('forged_fake_token_value_that_was_never_issued');
  assert.strictEqual(forgedResult.success, false);
  assert.strictEqual(forgedResult.error, 'INVALID_TOKEN');

  return true;
}

if (process.argv[1] && process.argv[1].includes('email-verification')) {
  runEmailVerificationTests().then(() => {
    console.log('✅ Email verification token lifecycle tests passed.');
  });
}
