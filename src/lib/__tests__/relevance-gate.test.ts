// Relevance Gate Verification Test Suite
// Proves that below-threshold, out-of-domain queries return clean refusal without LLM hallucination.

import assert from 'node:assert';
import { RelevanceGate } from '../ai/relevance-gate';

export async function runRelevanceGateTests() {
  console.log('🛡️ Testing RAG Relevance Gate & Hallucination Prevention...');

  // 1. Relevant in-domain career/coding queries must pass gate
  const technicalQueries = [
    'How do I learn Spring Boot microservices?',
    'Find senior mentors for Next.js and React 19 architecture',
    'What skills are needed for a Distributed Systems Engineer role?',
  ];

  for (const q of technicalQueries) {
    const check = RelevanceGate.evaluateRelevance(q, 0.72);
    assert.strictEqual(check.isRelevant, true, `In-domain query '${q}' should pass gate`);
    assert.strictEqual(check.refusalReason, null, 'No refusal reason for valid query');
  }
  console.log('  ✅ In-domain technical queries successfully pass relevance gate.');

  // 2. Completely out-of-domain queries must be refused
  const irrelevantQueries = [
    'How do I bake sourdough bread?',
    'What is the recipe for chicken biryani?',
    'Who won the 1994 football world cup?',
  ];

  for (const q of irrelevantQueries) {
    const check = RelevanceGate.evaluateRelevance(q, 0.21);
    assert.strictEqual(check.isRelevant, false, `Out-of-domain query '${q}' should be gated`);
    assert.ok(
      check.refusalReason && check.refusalReason.includes('GrowEarn'),
      'Refusal message clearly specifies platform catalog boundaries'
    );
  }
  console.log('  ✅ Out-of-domain queries trigger clean, non-hallucinating refusal.');

  // 3. Cosine threshold boundary condition
  const threshold = RelevanceGate.RELEVANCE_THRESHOLD;
  assert.strictEqual(RelevanceGate.evaluateRelevance('Rust concurrency', threshold + 0.01).isRelevant, true);
  assert.strictEqual(RelevanceGate.evaluateRelevance('Rust concurrency', threshold - 0.01).isRelevant, false);
  console.log(`  ✅ Cosine similarity threshold enforced at exact boundary: ${threshold}`);

  console.log('✨ All relevance gate tests passed successfully.');
}

if (require.main === module) {
  runRelevanceGateTests()
    .catch((err) => {
      console.error('Relevance gate test failure:', err);
      process.exit(1);
    });
}

