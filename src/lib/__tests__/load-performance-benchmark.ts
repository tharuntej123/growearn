import { prisma } from '../prisma';
import { CourseRepository } from '../../repositories/course.repository';
import { MentorRepository } from '../../repositories/mentor.repository';
import { JobRepository } from '../../repositories/job.repository';
import { PgVectorStore } from '../ai/vector-store';
import { SkillRAGService } from '../ai/skill-rag.service';
import { EMBEDDING_DIMENSION } from '../ai/embeddings';

interface MetricResult {
  operation: string;
  totalIterations: number;
  totalTimeMs: number;
  avgLatencyMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  throughputRps: number;
}

function calculatePercentile(latencies: number[], percentile: number): number {
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return Number(sorted[Math.max(0, index)].toFixed(2));
}

async function benchmark(name: string, fn: () => Promise<void>, iterations = 20): Promise<MetricResult> {
  const latencies: number[] = [];
  const startTotal = Date.now();

  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    await fn();
    const t1 = performance.now();
    latencies.push(t1 - t0);
  }

  const totalTimeMs = Date.now() - startTotal;
  const avgLatencyMs = Number((latencies.reduce((a, b) => a + b, 0) / iterations).toFixed(2));
  const p50Ms = calculatePercentile(latencies, 50);
  const p95Ms = calculatePercentile(latencies, 95);
  const p99Ms = calculatePercentile(latencies, 99);
  const throughputRps = Number(((iterations / totalTimeMs) * 1000).toFixed(1));

  return {
    operation: name,
    totalIterations: iterations,
    totalTimeMs,
    avgLatencyMs,
    p50Ms,
    p95Ms,
    p99Ms,
    throughputRps,
  };
}

async function runPerformanceBenchmarks() {
  console.log('================================================================================');
  console.log('⚡ GROEARN LIVE PERFORMANCE & THROUGHPUT BENCHMARK');
  console.log('================================================================================\n');

  const testEmbedding = new Array(EMBEDDING_DIMENSION).fill(0.025);
  const results: MetricResult[] = [];

  // 1. Course Retrieval Benchmark
  console.log('Running Benchmark: Course Retrieval...');
  const courseMetric = await benchmark('Course Retrieval (Multi-filter)', async () => {
    await CourseRepository.getAllCourses({ search: 'Java' });
  }, 20);
  results.push(courseMetric);

  // 2. Mentor Retrieval Benchmark
  console.log('Running Benchmark: Mentor Retrieval...');
  const mentorMetric = await benchmark('Mentor Retrieval (Multi-filter)', async () => {
    await MentorRepository.getAllMentors({ search: 'Java' });
  }, 20);
  results.push(mentorMetric);

  // 3. Vector Similarity Search Benchmark (pgvector <=> HNSW)
  console.log('Running Benchmark: pgvector HNSW Cosine Search...');
  const vectorMetric = await benchmark('pgvector HNSW Cosine Search', async () => {
    await PgVectorStore.similaritySearch(testEmbedding, 5);
  }, 20);
  results.push(vectorMetric);

  // 4. Job Search Benchmark
  console.log('Running Benchmark: Job Search & Filters...');
  const jobRepo = new JobRepository();
  const jobMetric = await benchmark('Job Search (Multi-filter)', async () => {
    await jobRepo.getJobs({ query: 'Engineer' });
  }, 20);
  results.push(jobMetric);

  // 5. Full Multi-Signal Skill RAG Endpoint Benchmark
  console.log('Running Benchmark: Skill RAG Multi-Signal Pipeline...');
  const ragMetric = await benchmark('Skill RAG Recommendation Pipeline', async () => {
    await SkillRAGService.querySkillRAG('Java', 'Intermediate');
  }, 15);
  results.push(ragMetric);

  console.log('\n================================================================================');
  console.log('📊 PERFORMANCE BENCHMARK RESULTS');
  console.log('================================================================================');
  console.table(
    results.map((r) => ({
      Operation: r.operation,
      Runs: r.totalIterations,
      'Avg (ms)': `${r.avgLatencyMs} ms`,
      'p50 (ms)': `${r.p50Ms} ms`,
      'p95 (ms)': `${r.p95Ms} ms`,
      'p99 (ms)': `${r.p99Ms} ms`,
      Throughput: `${r.throughputRps} req/s`,
    }))
  );

  console.log('\n✅ PERFORMANCE LOAD TEST COMPLETED ACCURATELY AGAINST LIVE POSTGRESQL');
}

runPerformanceBenchmarks()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
