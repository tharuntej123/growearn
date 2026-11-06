import { NextRequest } from 'next/server';
import { POST } from '@/app/api/ai/roadmap/agentic/route';
import { prisma } from '@/lib/prisma';

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

export async function runAgenticRoadmapTests() {
  (process.env as any).NODE_ENV = 'test';
  console.log('================================================================================');
  console.log('🤖 AGENTIC MULTI-AGENT ROADMAP INTEGRATION TEST SUITE');
  console.log('================================================================================\n');

  // Find or mock test learner and company users
  let learnerId = '00000000-0000-4000-8000-000000000001';
  let companyId = '00000000-0000-4000-8000-000000000002';

  try {
    const learner = await prisma.user.findFirst({ where: { role: 'LEARNER' } });
    if (learner?.id) learnerId = learner.id;
    const company = await prisma.user.findFirst({ where: { role: 'COMPANY' } });
    if (company?.id) companyId = company.id;
  } catch {
    // Database offline in unit test mode
  }

  // 1. Unauthenticated request returns 401
  {
    const req = new NextRequest('http://localhost:3000/api/ai/roadmap/agentic', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ targetRole: 'Frontend Engineer' }),
    });

    const res = await POST(req);
    assert(res.status === 401, 'Unauthenticated request rejected with 401');
  }

  // 2. Non-LEARNER role returns 403
  {
    const req = new NextRequest('http://localhost:3000/api/ai/roadmap/agentic', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mock-user-id': companyId,
        'x-mock-role': 'COMPANY',
      },
      body: JSON.stringify({ targetRole: 'Frontend Engineer' }),
    });

    const res = await POST(req);
    assert(res.status === 403, 'Non-LEARNER role rejected with 403 Forbidden');
  }

  // 3. Invalid payload returns 400
  {
    const req = new NextRequest('http://localhost:3000/api/ai/roadmap/agentic', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-mock-user-id': learnerId,
        'x-mock-role': 'LEARNER',
      },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    assert(res.status === 400, 'Empty target payload rejected with 400 Bad Request');
  }

  // 4. Fallback when Python service is down / unreachable
  {
    const originalFetch = global.fetch;
    // Mock fetch to simulate Python service network failure
    global.fetch = async (url: any, init?: any) => {
      if (typeof url === 'string' && url.includes('/roadmap')) {
        throw new Error('Connection refused: Python agent service offline');
      }
      return originalFetch(url, init);
    };

    try {
      const req = new NextRequest('http://localhost:3000/api/ai/roadmap/agentic', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-mock-user-id': learnerId,
          'x-mock-role': 'LEARNER',
        },
        body: JSON.stringify({
          targetRole: 'Full Stack Engineer',
          skill: 'Next.js 16',
          experienceLevel: 'intermediate',
          weeklyHours: 10,
        }),
      });

      const res = await POST(req);
      assert(res.status === 200, 'Fallback returns 200 OK when Python service is down');
      const data = await res.json();
      assert(Boolean(data.data), 'Fallback returned roadmap data');
      assert(Array.isArray(data.data?.phases), 'Fallback returned parsed phases array');
      assert(data.data?.phases?.length > 0, 'Fallback generated at least 1 roadmap phase');
      assert(Array.isArray(data.data?.agentTrace), 'Fallback returned agent execution trace');
      assert(
        data.data?.agentTrace?.some((t: any) => t.status === 'fallback' || t.status === 'completed' || t.agent === 'Researcher'),
        'Fallback agentTrace records agent trace'
      );
    } finally {
      global.fetch = originalFetch;
    }
  }

  // 5. Successful mock response from Python CrewAI service
  {
    const originalFetch = global.fetch;
    const mockCrewResponse = {
      title: 'Full Stack Engineer with Next.js 16 Career Roadmap',
      targetRole: 'Full Stack Engineer',
      durationWeeks: 12,
      phases: [
        {
          phase: 1,
          title: 'Foundations & Architecture',
          duration: 'Weeks 1-4',
          description: 'Master core Next.js 16 App Router principles and React 19 RSC.',
          milestones: ['Build SSR application', 'Integrate Postgres via Prisma'],
          recommendedCourses: [],
          recommendedMentors: [],
          tavilyResources: [{ title: 'Next.js Docs', url: 'https://nextjs.org', snippet: 'RSC guide' }],
        },
        {
          phase: 2,
          title: 'Advanced State & Data Mutation',
          duration: 'Weeks 5-8',
          description: 'Production Server Actions, caching, and optimistic UI updates.',
          milestones: ['Implement Server Actions with Zod', 'Set up Cashfree checkout'],
          recommendedCourses: [],
          recommendedMentors: [],
          tavilyResources: [],
        },
      ],
      agentTrace: [
        { agent: 'Researcher', status: 'completed', summary: 'Researched market demand using Tavily.' },
        { agent: 'Planner', status: 'completed', summary: 'Synthesized 2 structured roadmap phases.' },
        { agent: 'Reviewer', status: 'completed', summary: 'Verified curriculum feasibility and schema.' },
      ],
      disclaimer: 'AI-generated multi-agent roadmap grounded in live market data.',
    };

    global.fetch = async (url: any, init?: any) => {
      if (typeof url === 'string' && url.includes('/roadmap')) {
        return new Response(JSON.stringify(mockCrewResponse), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return originalFetch(url, init);
    };

    try {
      const req = new NextRequest('http://localhost:3000/api/ai/roadmap/agentic', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-mock-user-id': learnerId,
          'x-mock-role': 'LEARNER',
        },
        body: JSON.stringify({
          targetRole: 'Full Stack Engineer',
          skill: 'Next.js 16',
          experienceLevel: 'intermediate',
        }),
      });

      const res = await POST(req);
      assert(res.status === 200, 'Python service response returns 200 OK');
      const data = await res.json();
      assert(data.data?.targetRole === 'Full Stack Engineer', 'Target role matches input');
      assert(data.data?.phases?.length === 2, 'Roadmap contains exactly 2 mocked phases');
      assert(data.data?.agentTrace?.length === 3, 'Roadmap records 3 agent traces (Researcher, Planner, Reviewer)');
      assert(data.data?.agentTrace[0].agent === 'Researcher', 'First trace from Researcher agent');
    } finally {
      global.fetch = originalFetch;
    }
  }

  console.log(`\nAgentic Roadmap Test Summary: ${passedCount} passed, ${failedCount} failed\n`);
  if (failedCount > 0) {
    throw new Error(`${failedCount} agentic roadmap tests failed`);
  }
}

if (require.main === module || process.argv[1]?.includes('agentic-roadmap.test.ts')) {
  runAgenticRoadmapTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
