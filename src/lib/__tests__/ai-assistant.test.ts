/**
 * @file ai-assistant.test.ts
 * @description Production AI Assistant Test Suite validating RAG responses, intent classification, and vector search.
 */

import { AIAssistantService } from '../ai/ai-assistant.service';
import { IntentClassifier } from '../ai/intent-classifier';

async function runAITests() {
  console.log('==============================================');
  console.log('🚀 RUNNING GROWEARN PRODUCTION AI TEST SUITE');
  console.log('==============================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      if (detail) console.error(`   Details: ${detail}`);
      failed++;
    }
  }

  console.log('--- 1. Testing Intent Classification ---');
  try {
    const i1 = await IntentClassifier.classify('Give me a roadmap for Backend Developer');
    assert(i1.intent === 'roadmap', 'Classifies roadmap query as "roadmap"');

    const i2 = await IntentClassifier.classify('Who are the mentors for Java Spring Boot?');
    assert(i2.intent === 'mentor', 'Classifies mentor query as "mentor"');

    const i3 = await IntentClassifier.classify('Show me full-time jobs and salaries');
    assert(i3.intent === 'jobs', 'Classifies jobs query as "jobs"');

    const i4 = await IntentClassifier.classify('What is the syllabus for the PostgreSQL course?');
    assert(i4.intent === 'course', 'Classifies course query as "course"');
  } catch (err: any) {
    assert(false, 'Intent classification execution', err.message);
  }

  console.log('\n--- 2. Testing Grounded RAG Assistant Response ---');
  try {
    const q1 = await AIAssistantService.answer('What is a REST API?', null);
    assert(Boolean(q1.answer && q1.answer.length > 20), 'Returns substantive grounded answer');
    assert(q1.intent === 'general', 'Classifies technical question as general');
    assert(Array.isArray(q1.retrievedDocuments), 'Returns retrieved documents array');
    assert(typeof q1.similarity === 'number', 'Returns real vector similarity score');
    assert(Array.isArray(q1.sources), 'Returns sources citation array');
  } catch (err: any) {
    assert(false, 'RAG Assistant execution', err.message);
  }

  console.log('\n==============================================');
  console.log(`TOTAL: ${passed} Passed, ${failed} Failed`);
  console.log('==============================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAITests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
