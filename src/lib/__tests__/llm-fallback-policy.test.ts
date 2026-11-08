// LLM Resiliency & Fallback Policy Test Suite
// Verifies that 401/400 fail immediately while 429/5xx and timeouts trigger model fallback.

import assert from 'node:assert';
import { LLMFallbackPolicy } from '../ai/llm-fallback';

export async function runFallbackPolicyTests() {
  console.log('🔄 Testing LLM Selective Fallback Policy...');

  // 1. Errors that MUST trigger fallback
  const fallbackCodes = [429, 500, 502, 503, 504];
  for (const code of fallbackCodes) {
    assert.strictEqual(
      LLMFallbackPolicy.shouldTriggerFallback(code),
      true,
      `HTTP ${code} must trigger fallback`
    );
  }
  console.log('  ✅ 429 and 5xx transient server errors trigger fallback.');

  // 2. Errors that MUST NOT trigger fallback (fail immediately)
  const fatalCodes = [400, 401, 403, 404, 422];
  for (const code of fatalCodes) {
    assert.strictEqual(
      LLMFallbackPolicy.shouldTriggerFallback(code),
      false,
      `HTTP ${code} must NOT trigger fallback`
    );
  }
  console.log('  ✅ 400 and 401 client/auth errors fail immediately without fallback.');

  // 3. Error objects and exception messages
  assert.strictEqual(
    LLMFallbackPolicy.shouldTriggerFallback(new Error('Rate limit exceeded (429)')),
    true
  );
  assert.strictEqual(
    LLMFallbackPolicy.shouldTriggerFallback(new Error('Gateway timeout (504)')),
    true
  );
  assert.strictEqual(
    LLMFallbackPolicy.shouldTriggerFallback(new Error('Request timed out (ETIMEDOUT)')),
    true
  );
  assert.strictEqual(
    LLMFallbackPolicy.shouldTriggerFallback(new Error('Invalid API key (401 Unauthorized)')),
    false
  );
  assert.strictEqual(
    LLMFallbackPolicy.shouldTriggerFallback(new Error('Malformed JSON payload (400 Bad Request)')),
    false
  );
  console.log('  ✅ Error object parsing respects selective fallback rules.');

  console.log('✨ All LLM fallback policy tests passed successfully.');
}

if (require.main === module) {
  runFallbackPolicyTests()
    .catch((err) => {
      console.error('Fallback policy test failure:', err);
      process.exit(1);
    });
}

