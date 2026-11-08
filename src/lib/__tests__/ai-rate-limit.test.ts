import { NextRequest } from 'next/server';
import { GET as coursesGet } from '@/app/api/ai/courses/route';
import { GET as mentorsGet } from '@/app/api/ai/mentors/route';
import { POST as messagePost } from '@/app/api/ai/message/route';
import { POST as skillAnalysisPost } from '@/app/api/ai/skill-analysis/route';
import { POST as agenticPost } from '@/app/api/ai/roadmap/agentic/route';
import { prisma } from '../prisma';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, failureMessage?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName} - ${failureMessage || 'Assertion failed'}`);
    failedCount++;
  }
}

export async function runAIRateLimitTests() {
  (process.env as any).NODE_ENV = 'test';
  console.log('================================================================================');
  console.log('⏱️ AI ROUTES RATE LIMITING & SECURITY TEST SUITE');
  console.log('================================================================================\n');

  // Find or mock test user
  let userId = '00000000-0000-4000-8000-000000000001';
  try {
    const user = await prisma.user.findFirst();
    if (user?.id) userId = user.id;
  } catch {
    // Database offline in unit test mode; fallback to deterministic mock ID
  }

  const testIp = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;

  // Helper to construct request with isolated identity
  function makeReq(path: string, body?: any, method = 'POST', testUser = userId) {
    return new NextRequest(`http://localhost:3000${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-mock-user-id': testUser,
        'x-mock-role': 'LEARNER',
        'x-forwarded-for': testIp,
        'x-test-rate-limit': 'true',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  // 1. Hammer /api/ai/courses
  {
    const u1 = 'rate-test-courses-' + Math.random().toString(36).slice(2);
    let sawRateLimit = false;
    for (let i = 0; i < 35; i++) {
      const res = await coursesGet(makeReq('/api/ai/courses?skill=React', undefined, 'GET', u1));
      if (res.status === 429 || res.status === 503) {
        sawRateLimit = true;
        break;
      }
    }
    assert(sawRateLimit, 'GET /api/ai/courses returns 429/503 when rate limit exceeded or fail-closed');
  }

  // 2. Hammer /api/ai/mentors
  {
    const u2 = 'rate-test-mentors-' + Math.random().toString(36).slice(2);
    let sawRateLimit = false;
    for (let i = 0; i < 35; i++) {
      const res = await mentorsGet(makeReq('/api/ai/mentors?skill=Next.js', undefined, 'GET', u2));
      if (res.status === 429 || res.status === 503) {
        sawRateLimit = true;
        break;
      }
    }
    assert(sawRateLimit, 'GET /api/ai/mentors returns 429/503 when rate limit exceeded or fail-closed');
  }

  // 3. Hammer /api/ai/message
  {
    const u3 = 'rate-test-message-' + Math.random().toString(36).slice(2);
    let sawRateLimit = false;
    for (let i = 0; i < 35; i++) {
      const res = await messagePost(makeReq('/api/ai/message', { message: 'Hello AI' }, 'POST', u3));
      if (res.status === 429 || res.status === 503) {
        sawRateLimit = true;
        break;
      }
    }
    assert(sawRateLimit, 'POST /api/ai/message returns 429/503 when rate limit exceeded or fail-closed');
  }

  // 4. Hammer /api/ai/skill-analysis
  {
    const u4 = 'rate-test-skills-' + Math.random().toString(36).slice(2);
    let sawRateLimit = false;
    for (let i = 0; i < 35; i++) {
      const res = await skillAnalysisPost(
        makeReq('/api/ai/skill-analysis', { targetRole: 'Backend Engineer' }, 'POST', u4)
      );
      if (res.status === 429 || res.status === 503) {
        sawRateLimit = true;
        break;
      }
    }
    assert(sawRateLimit, 'POST /api/ai/skill-analysis returns 429/503 when rate limit exceeded or fail-closed');
  }

  // 5. Hammer /api/ai/roadmap/agentic
  {
    const u5 = userId;
    let sawRateLimit = false;
    for (let i = 0; i < 35; i++) {
      const res = await agenticPost(
        makeReq('/api/ai/roadmap/agentic', { targetRole: 'DevOps Engineer' }, 'POST', u5)
      );
      if (res.status === 429 || res.status === 503) {
        sawRateLimit = true;
        break;
      }
    }
    assert(sawRateLimit, 'POST /api/ai/roadmap/agentic returns 429/503 when rate limit exceeded or fail-closed');
  }

  console.log(`\nAI Rate Limit Test Summary: ${passedCount} passed, ${failedCount} failed\n`);
  if (failedCount > 0) {
    throw new Error(`${failedCount} AI rate limit tests failed`);
  }
}

if (require.main === module || process.argv[1]?.includes('ai-rate-limit.test.ts')) {
  runAIRateLimitTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
