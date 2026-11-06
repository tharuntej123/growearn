import { BgeM3Embeddings } from '../ai/lc-embeddings';
import { executeRAGWithTracing } from '../ai/rag-chain';
import { completeStructured } from '../ai/llm-client';
import { z } from 'zod';

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

export async function runLangChainRAGTests() {
  console.log('================================================================================');
  console.log('🦜 LANGCHAIN RAG & EMBEDDINGS TEST SUITE');
  console.log('================================================================================\n');

  const originalFetch = global.fetch;

  // 1. BgeM3Embeddings.embedQuery against mocked Ollama
  {
    const mock1024Vector = Array.from({ length: 1024 }, (_, i) => Math.sin(i) * 0.05);

    global.fetch = async (url: any, init?: any) => {
      const urlStr = typeof url === 'string' ? url : url?.toString() || '';
      if (urlStr.includes('/api/embed') || urlStr.includes('/api/embeddings')) {
        return new Response(
          JSON.stringify({
            embeddings: [mock1024Vector, mock1024Vector],
            embedding: mock1024Vector,
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }
        );
      }
      return originalFetch(url, init);
    };

    try {
      const embeddings = new BgeM3Embeddings({ baseUrl: 'http://127.0.0.1:11434', model: 'bge-m3' });
      const queryVec = await embeddings.embedQuery('Next.js 16 full stack');
      assert(Array.isArray(queryVec), 'BgeM3Embeddings.embedQuery returns array');
      assert(queryVec.length === 1024, 'BgeM3Embeddings.embedQuery vector dimension is exactly 1024');

      const docsVecs = await embeddings.embedDocuments(['Doc 1', 'Doc 2']);
      assert(docsVecs.length === 2, 'BgeM3Embeddings.embedDocuments returned 2 vectors');
      assert(docsVecs[0].length === 1024, 'Document vector 1 dimension is 1024');
      assert(docsVecs[1].length === 1024, 'Document vector 2 dimension is 1024');
    } finally {
      global.fetch = originalFetch;
    }
  }

  // 2. BgeM3Embeddings rejects non-1024 dimension vectors fail-closed
  {
    const mock512Vector = Array.from({ length: 512 }, () => 0.1);

    global.fetch = async (url: any, init?: any) => {
      const urlStr = typeof url === 'string' ? url : url?.toString() || '';
      if (urlStr.includes('/api/embed') || urlStr.includes('/api/embeddings')) {
        return new Response(
          JSON.stringify({
            embeddings: [mock512Vector],
            embedding: mock512Vector,
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }
        );
      }
      return originalFetch(url, init);
    };

    try {
      const embeddings = new BgeM3Embeddings({ baseUrl: 'http://127.0.0.1:11434', model: 'bge-m3' });
      let caught = false;
      try {
        await embeddings.embedQuery('Should fail');
      } catch (err: any) {
        caught = true;
        assert(err.message.includes('1024'), 'Rejects non-1024 dimension vector with clear error');
      }
      assert(caught, 'BgeM3Embeddings threw an error on invalid dimension');
    } finally {
      global.fetch = originalFetch;
    }
  }

  // 3. RunnableSequence RAG Chain with Mocked Groq & Tracing
  {
    const mock1024Vector = Array.from({ length: 1024 }, (_, i) => Math.sin(i) * 0.05);
    const mockGroqResponse = {
      choices: [
        {
          message: {
            content: 'Next.js 16 introduces Server Components, Turbopack, and enhanced Server Actions.',
          },
        },
      ],
    };

    global.fetch = async (url: any, init?: any) => {
      const urlStr = typeof url === 'string' ? url : url?.toString() || '';
      if (urlStr.includes('groq.com')) {
        return new Response(JSON.stringify(mockGroqResponse), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      if (urlStr.includes('/api/embed') || urlStr.includes('/api/embeddings')) {
        return new Response(
          JSON.stringify({
            embeddings: [mock1024Vector],
            embedding: mock1024Vector,
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }
        );
      }
      return originalFetch(url, init);
    };

    try {
      process.env.LANGCHAIN_TRACING_ENABLED = 'true';
      const result = await executeRAGWithTracing({
        question: 'What are the main features of Next.js 16?',
        userContextSnippet: 'Learner profile: 1 year experience, targets Full Stack Engineer',
      });

      assert(typeof result === 'string', 'executeRAGWithTracing returns a string answer');
      assert(result.length > 0, 'Answer is non-empty');
      assert(result.includes('Next.js 16'), 'Answer mentions target subject');
    } finally {
      delete process.env.LANGCHAIN_TRACING_ENABLED;
      global.fetch = originalFetch;
    }
  }

  // 4. completeStructured with Zod schema validation
  {
    process.env.GROQ_API_KEY = 'gsk_mock_test_key_for_verification';
    const TestSchema = z.object({
      summary: z.string(),
      milestonesCount: z.number(),
      recommendedTopics: z.array(z.string()),
    });

    const parsedData = {
      summary: 'Structured learning roadmap for PostgreSQL performance',
      milestonesCount: 4,
      recommendedTopics: ['HNSW Indexes', 'VACUUM tuning', 'Connection Pooling'],
    };

    const mockStructuredPayload = {
      choices: [
        {
          message: {
            role: 'assistant',
            content: JSON.stringify(parsedData),
            tool_calls: [
              {
                id: 'call_1',
                type: 'function',
                function: {
                  name: 'extract',
                  arguments: JSON.stringify(parsedData),
                },
              },
            ],
          },
        },
      ],
    };

    global.fetch = async (url: any, init?: any) => {
      const urlStr = typeof url === 'string' ? url : url?.toString() || '';
      if (urlStr.includes('groq.com')) {
        return new Response(JSON.stringify(mockStructuredPayload), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      return originalFetch(url, init);
    };

    try {
      const parsed = await completeStructured(
        TestSchema,
        'Generate structured plan for PostgreSQL optimization'
      );
      assert(parsed !== null, 'completeStructured returned non-null');
      if (parsed) {
        assert(parsed.milestonesCount === 4, 'completeStructured parses typed number');
        assert(parsed.recommendedTopics.length === 3, 'completeStructured parses typed array');
        assert(typeof parsed.summary === 'string', 'completeStructured parses typed string');
      }
    } finally {
      global.fetch = originalFetch;
    }
  }

  console.log(`\nLangChain RAG Test Summary: ${passedCount} passed, ${failedCount} failed\n`);
  if (failedCount > 0) {
    throw new Error(`${failedCount} LangChain RAG tests failed`);
  }
}

if (require.main === module || process.argv[1]?.includes('langchain-rag.test.ts')) {
  runLangChainRAGTests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
