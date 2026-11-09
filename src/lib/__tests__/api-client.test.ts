import { apiClient } from '../api-client';
import { z } from 'zod';

async function runApiClientTests() {
  console.log('🧪 Running ApiClient Verification Tests...');

  // Mock global fetch
  const originalFetch = global.fetch;

  try {
    // 1. Success test with schema
    const testSchema = z.object({ id: z.string(), title: z.string() });
    global.fetch = async () =>
      new Response(JSON.stringify({ success: true, data: { id: 'c1', title: 'React 19' } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    const successRes = await apiClient('/api/courses/c1', { schema: testSchema });
    if (!successRes.ok || successRes.data.title !== 'React 19') {
      throw new Error(`Expected success with React 19, got ${JSON.stringify(successRes)}`);
    }
    console.log('  ✅ PASS: 200 OK parsed and validated against Zod schema');

    // 2. 401 Unauthorized
    global.fetch = async () =>
      new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });

    const unauthRes = await apiClient('/api/profile', { skipAuthRedirect: true });
    if (unauthRes.ok || unauthRes.status !== 401) {
      throw new Error(`Expected 401 unauth, got ${JSON.stringify(unauthRes)}`);
    }
    console.log('  ✅ PASS: 401 Unauthorized returns structured unauth error');

    // 3. 429 Rate limited with Retry-After
    global.fetch = async () =>
      new Response(JSON.stringify({ success: false, error: 'Too Many Requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json', 'Retry-After': '45' },
      });

    const rateRes = await apiClient('/api/ai/message');
    if (rateRes.ok || rateRes.status !== 429 || rateRes.retryAfter !== 45) {
      throw new Error(`Expected 429 with retryAfter 45, got ${JSON.stringify(rateRes)}`);
    }
    console.log('  ✅ PASS: 429 Rate limited extracts Retry-After header');

    // 4. 500 Server error
    global.fetch = async () =>
      new Response(JSON.stringify({ success: false, error: 'Internal Database Crash' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });

    const serverRes = await apiClient('/api/feed');
    if (serverRes.ok || serverRes.status !== 500) {
      throw new Error(`Expected 500 error, got ${JSON.stringify(serverRes)}`);
    }
    console.log('  ✅ PASS: 500 Internal error parsed cleanly without unhandled exception');

    console.log('\n🎉 All ApiClient unit tests passed successfully!\n');
  } finally {
    global.fetch = originalFetch;
  }
}

runApiClientTests().catch((err) => {
  console.error('❌ ApiClient test failed:', err);
  process.exit(1);
});
