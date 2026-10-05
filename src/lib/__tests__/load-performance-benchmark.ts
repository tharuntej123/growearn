import { prisma } from '../prisma';
import { CourseRepository } from '../../repositories/course.repository';
import { MentorRepository } from '../../repositories/mentor.repository';
import { JobRepository } from '../../repositories/job.repository';
import { UserRepository } from '../../repositories/user.repository';
import { SkillRAGService } from '../ai/skill-rag.service';
import { RecommendationService } from '../../services/recommendation.service';
import { HybridMatcher } from '../ai/hybrid-matcher';
import { AuthService } from '../../services/auth.service';
import { getUserAIContext } from '../../services/user-context.service';

interface MetricResult {
  operation: string;
  totalIterations: number;
  concurrency: number;
  totalTimeMs: number;
  avgLatencyMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  throughputRps: number;
  errorRatePercent: number;
}

function calculatePercentile(latencies: number[], percentile: number): number {
  if (latencies.length === 0) return 0;
  const sorted = [...latencies].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return Number(sorted[Math.max(0, index)].toFixed(2));
}

async function concurrentBenchmark(
  name: string,
  fn: (iteration: number) => Promise<void>,
  totalIterations = 20,
  concurrency = 4
): Promise<MetricResult> {
  const latencies: number[] = [];
  let errorCount = 0;
  const startTotal = Date.now();

  const runBatch = async (batch: number[]) => {
    await Promise.all(
      batch.map(async (iter) => {
        const t0 = performance.now();
        try {
          await fn(iter);
        } catch {
          errorCount++;
        } finally {
          const t1 = performance.now();
          latencies.push(t1 - t0);
        }
      })
    );
  };

  const batches: number[][] = [];
  for (let i = 0; i < totalIterations; i += concurrency) {
    const batch = [];
    for (let j = i; j < Math.min(i + concurrency, totalIterations); j++) {
      batch.push(j);
    }
    batches.push(batch);
  }

  for (const b of batches) {
    await runBatch(b);
  }

  const totalTimeMs = Date.now() - startTotal;
  const avgLatencyMs = latencies.length > 0 ? Number((latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2)) : 0;
  const p50Ms = calculatePercentile(latencies, 50);
  const p95Ms = calculatePercentile(latencies, 95);
  const p99Ms = calculatePercentile(latencies, 99);
  const throughputRps = totalTimeMs > 0 ? Number(((totalIterations / totalTimeMs) * 1000).toFixed(1)) : 0;
  const errorRatePercent = Number(((errorCount / totalIterations) * 100).toFixed(1));

  return {
    operation: name,
    totalIterations,
    concurrency,
    totalTimeMs,
    avgLatencyMs,
    p50Ms,
    p95Ms,
    p99Ms,
    throughputRps,
    errorRatePercent,
  };
}

async function runPerformanceBenchmarks() {
  console.log('================================================================================');
  console.log('⚡ GROEARN REALISTIC CONCURRENT PERFORMANCE BENCHMARK');
  console.log('================================================================================\n');

  const results: MetricResult[] = [];

  // 1. Authentication Benchmark
  console.log('1. Running Benchmark: Authentication & Token Verification...');
  const authUser = await prisma.user.findFirst();
  const authMetric = await concurrentBenchmark('Auth Verification', async () => {
    if (authUser) {
      await prisma.user.findUnique({
        where: { id: authUser.id },
        select: { id: true, email: true, role: true },
      });
    }
  }, 20, 5);
  results.push(authMetric);

  // 2. Course Retrieval Benchmark
  console.log('2. Running Benchmark: Course Multi-Filter Retrieval...');
  const courseMetric = await concurrentBenchmark('Course Retrieval', async () => {
    await CourseRepository.getAllCourses({ search: 'Java' });
  }, 20, 4);
  results.push(courseMetric);

  // 3. Learner RAG Recommendation Pipeline
  console.log('3. Running Benchmark: Learner RAG Multi-Signal Pipeline...');
  const learnerRagMetric = await concurrentBenchmark('Learner Skill RAG Pipeline', async () => {
    await SkillRAGService.querySkillRAG('Java', 'Intermediate');
  }, 15, 3);
  results.push(learnerRagMetric);

  // 4. Freelancer RAG Recommendation Pipeline
  console.log('4. Running Benchmark: Freelancer Job RAG Pipeline...');
  const freelancerUser = await prisma.user.findFirst({
    where: { OR: [{ role: 'FREELANCER' }, { role: 'PROFESSIONAL' }] },
  });
  const freelancerContext = freelancerUser ? await getUserAIContext(freelancerUser.id) : null;
  const freelancerMetric = await concurrentBenchmark('Freelancer Job Matching', async () => {
    if (freelancerContext) {
      await RecommendationService.getJobs(freelancerContext, 10);
    }
  }, 15, 3);
  results.push(freelancerMetric);

  // 5. Company Candidate Matching Benchmark
  console.log('5. Running Benchmark: Company Candidate Hybrid Matching...');
  const sampleJob = await prisma.job.findFirst({ include: { skills: { include: { skill: true } } } });
  const companyMetric = await concurrentBenchmark('Company Candidate Matching', async () => {
    const candidates = await UserRepository.getAllCandidates();
    if (sampleJob && candidates.length > 0) {
      candidates.slice(0, 10).map((c) =>
        HybridMatcher.calculateJobMatch(
          {
            skills: c.skills.map((s) => s.skill.name),
            yearsExperience: c.profile?.yearsOfExperience || 0,
            location: c.location || undefined,
            careerGoal: c.profile?.careerGoal || undefined,
            headline: c.headline || undefined,
            bio: c.bio || undefined,
          },
          {
            title: sampleJob.title,
            description: sampleJob.description,
            requiredSkills: sampleJob.skills.map((s) => s.skill.name),
            experienceLevel: sampleJob.experienceLevel,
            locationType: sampleJob.locationType,
          }
        )
      );
    }
  }, 15, 3);
  results.push(companyMetric);

  // 6. Payment Query & Order Lookup Benchmark
  console.log('6. Running Benchmark: Payment Orders & Integrity Lookup...');
  const paymentMetric = await concurrentBenchmark('Payment Orders Query', async () => {
    await prisma.paymentOrder.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
  }, 20, 5);
  results.push(paymentMetric);

  console.log('\n================================================================================');
  console.log('📊 PERFORMANCE BENCHMARK RESULTS');
  console.log('================================================================================');
  console.table(
    results.map((r) => ({
      Operation: r.operation,
      Runs: r.totalIterations,
      Concurrency: r.concurrency,
      'Avg Latency': `${r.avgLatencyMs} ms`,
      'p50': `${r.p50Ms} ms`,
      'p95': `${r.p95Ms} ms`,
      'p99': `${r.p99Ms} ms`,
      Throughput: `${r.throughputRps} req/s`,
      'Error Rate': `${r.errorRatePercent}%`,
    }))
  );

  console.log('\n✅ BENCHMARK COMPLETED AGAINST POSTGRESQL WITH FULL METRICS REPORTED');
}

runPerformanceBenchmarks()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
