import 'dotenv/config';
import { prisma } from '../src/lib/prisma';
import { RoadmapRepository } from '../src/repositories/roadmap.repository';
import { SkillRAGService } from '../src/lib/ai/skill-rag.service';
import { isEmbeddingConfigured, generateEmbedding } from '../src/lib/ai/embeddings';
import { PgVectorStore } from '../src/lib/ai/vector-store';

async function measureRAGPipeline() {
  console.log('================================================================================');
  console.log('⏱️ REAL RAG PIPELINE TIMING BREAKDOWN (MEASURED)');
  console.log('================================================================================\n');

  const query = 'Java';
  const level = 'Intermediate';

  // 1. Embedding Timing
  let embeddingTimeMs = 0;
  if (isEmbeddingConfigured()) {
    const t0 = performance.now();
    await generateEmbedding(query);
    embeddingTimeMs = performance.now() - t0;
  }
  console.log(`1. Embedding Generation: ${embeddingTimeMs.toFixed(2)} ms (${isEmbeddingConfigured() ? 'OpenAI API' : 'BLOCKED - Key Absent'})`);

  // 2. Roadmap DB Retrieval Timing
  const tRoadmap0 = performance.now();
  const dbRoadmap = await RoadmapRepository.findRoadmapBySkill(query);
  const roadmapTimeMs = performance.now() - tRoadmap0;
  console.log(`2. Roadmap DB Retrieval: ${roadmapTimeMs.toFixed(2)} ms (PostgreSQL neon)`);

  // 3. Candidate Courses & Mentors DB Retrieval Timing
  const tDb0 = performance.now();
  const [courses, mentors, totalCourses, totalMentors] = await Promise.all([
    prisma.course.findMany({ where: { isPublished: true }, take: 50 }),
    prisma.mentorProfile.findMany({ where: { isAvailable: true }, include: { user: true }, take: 50 }),
    prisma.course.count({ where: { isPublished: true } }),
    prisma.mentorProfile.count({ where: { isAvailable: true } }),
  ]);
  const dbRetrievalTimeMs = performance.now() - tDb0;
  console.log(`3. DB Candidates Retrieval: ${dbRetrievalTimeMs.toFixed(2)} ms (${courses.length} courses, ${mentors.length} mentors)`);

  // 4. pgvector Cosine Query Timing
  let pgvectorTimeMs = 0;
  if (isEmbeddingConfigured()) {
    const tPg0 = performance.now();
    const vec = await generateEmbedding(query);
    await PgVectorStore.similaritySearch(vec, 10);
    pgvectorTimeMs = performance.now() - tPg0;
  }
  console.log(`4. pgvector HNSW Query: ${pgvectorTimeMs.toFixed(2)} ms (${isEmbeddingConfigured() ? 'Executed' : 'BLOCKED - Key Absent'})`);

  // 5. Multi-Signal Ranking Timing
  const tRank0 = performance.now();
  const coursesResult = await SkillRAGService.searchCourses({ skill: query, level, limit: 5 });
  const mentorsResult = await SkillRAGService.searchMentors({ skill: query, limit: 5 });
  const rankingTimeMs = performance.now() - tRank0;
  console.log(`5. Multi-Signal Ranking Time: ${rankingTimeMs.toFixed(2)} ms`);

  // 6. Full End-to-End SkillRAGService.querySkillRAG Timing
  const tE2E0 = performance.now();
  const fullResult = await SkillRAGService.querySkillRAG(query, level);
  const fullE2ETimeMs = performance.now() - tE2E0;
  console.log(`6. Full End-to-End querySkillRAG: ${fullE2ETimeMs.toFixed(2)} ms`);

  // 7. JSON Serialization Timing
  const tJson0 = performance.now();
  const jsonStr = JSON.stringify(fullResult);
  const serializationTimeMs = performance.now() - tJson0;
  console.log(`7. JSON Serialization: ${serializationTimeMs.toFixed(2)} ms (${jsonStr.length} bytes)`);

  console.log('\n--------------------------------------------------------------------------------');
  console.log('SUMMARY LATENCY PROFILE:');
  console.log(`- Network / DB Retrieval: ~${(roadmapTimeMs + dbRetrievalTimeMs).toFixed(2)} ms (Neon Serverless PostgreSQL connection latency)`);
  console.log(`- In-Memory Algorithm / Ranking: ~${rankingTimeMs.toFixed(2)} ms`);
  console.log(`- External LLM / Embedding (when enabled): ~${embeddingTimeMs.toFixed(2)} ms`);
  console.log(`- Total Pipeline: ~${fullE2ETimeMs.toFixed(2)} ms`);
  console.log('--------------------------------------------------------------------------------\n');
}

measureRAGPipeline()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
