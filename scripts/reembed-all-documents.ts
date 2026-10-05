/**
 * @file reembed-all-documents.ts
 * @description Production script to re-embed all RAG entities in PostgreSQL using Local BGE-M3 (1024 dims).
 * 
 * Re-embeds:
 * 1. Technical Courses (metadata: courseId)
 * 2. Mentors (metadata: mentorProfileId, userId)
 * 3. Jobs (metadata: jobId)
 * 4. Roadmaps (metadata: roadmapId)
 * 5. Platform Ecosystem & Knowledge Documents
 * 
 * Strict Production Rules:
 * - 100% Real inference via local BGE-M3 model.
 * - Exact 1024-dimension vector verification.
 * - Zero synthetic / fake vectors.
 */

import { prisma } from '../src/lib/prisma';
import { generateEmbedding, EMBEDDING_DIMENSION, getEmbeddingProvider } from '../src/lib/ai/embeddings';
import { PRODUCTION_ROADMAPS_CATALOG } from '../src/lib/ai/roadmaps-catalog';
import { formatVectorForPg } from '../src/lib/ai/vector-store';

async function reembedAll() {
  console.log('================================================================================');
  console.log('🚀 GROEARN LOCAL BGE-M3 (1024-DIM) VECTOR RE-EMBEDDING PIPELINE');
  console.log('================================================================================\n');

  const provider = getEmbeddingProvider();
  console.log(`📡 Embedding Provider: ${provider.name}`);
  console.log(`🌐 Endpoint: ${provider.getBaseUrl()}`);
  console.log(`🧠 Model: ${provider.getModelName()}`);
  console.log(`📐 Target Dimension: ${EMBEDDING_DIMENSION}\n`);

  // Health check
  const health = await provider.checkHealth();
  if (!health.healthy) {
    throw new Error(`Local BGE-M3 embedding service is unhealthy: ${health.error}`);
  }
  console.log('✅ Local BGE-M3 service health check passed.\n');

  // 1. Clear existing chunks
  console.log('🧹 Clearing previous vector records from document_chunks...');
  await prisma.$executeRawUnsafe(`DELETE FROM document_chunks;`);
  console.log('✅ document_chunks cleared.\n');

  let totalIngested = 0;

  // 2. Re-embed Technical Courses
  console.log('📚 Re-embedding Technical Courses...');
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    include: { instructor: { select: { id: true, name: true } } },
  });

  for (const course of courses) {
    const text = `Course: ${course.title}\nLevel: ${course.level}\nCategory: ${course.category}\nSkills: ${course.skillsCovered || ''}\nInstructor: ${course.instructor?.name || ''}\nDescription: ${course.description}`;
    const embedding = await generateEmbedding(text);

    if (embedding.length !== 1024) {
      throw new Error(`Dimension mismatch: course ${course.id} produced ${embedding.length} dims, expected 1024`);
    }

    const vectorStr = formatVectorForPg(embedding);
    const metadataStr = JSON.stringify({
      courseId: course.id,
      title: course.title,
      level: course.level,
      category: course.category,
      skillsCovered: course.skillsCovered,
      rating: course.rating,
      price: course.price,
    });

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO document_chunks (id, content, source, source_type, metadata, embedding, created_at)
      VALUES (gen_random_uuid()::text, $1, $2, 'course', $3::jsonb, $4::vector, NOW())
      `,
      text,
      `course_${course.id}`,
      metadataStr,
      vectorStr
    );
    totalIngested++;
  }
  console.log(`✅ Re-embedded ${courses.length} courses into pgvector.\n`);

  // 3. Re-embed Mentors
  console.log('🤝 Re-embedding Mentors...');
  const mentors = await prisma.mentorProfile.findMany({
    where: { isAvailable: true },
    include: { user: { select: { id: true, name: true, headline: true } } },
  });

  for (const mentor of mentors) {
    const text = `Mentor: ${mentor.user.name}\nHeadline: ${mentor.user.headline || mentor.title || ''}\nExpertise: ${mentor.expertise}\nYears Experience: ${mentor.yearsExperience}\nHourly Rate: ₹${mentor.hourlyRate}/hr\nBio: ${mentor.bio}`;
    const embedding = await generateEmbedding(text);

    if (embedding.length !== 1024) {
      throw new Error(`Dimension mismatch: mentor ${mentor.id} produced ${embedding.length} dims, expected 1024`);
    }

    const vectorStr = formatVectorForPg(embedding);
    const metadataStr = JSON.stringify({
      mentorProfileId: mentor.id,
      userId: mentor.userId,
      name: mentor.user.name,
      expertise: mentor.expertise,
      hourlyRate: mentor.hourlyRate,
      yearsExperience: mentor.yearsExperience,
      rating: mentor.rating,
    });

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO document_chunks (id, content, source, source_type, metadata, embedding, created_at)
      VALUES (gen_random_uuid()::text, $1, $2, 'mentor', $3::jsonb, $4::vector, NOW())
      `,
      text,
      `mentor_${mentor.id}`,
      metadataStr,
      vectorStr
    );
    totalIngested++;
  }
  console.log(`✅ Re-embedded ${mentors.length} mentors into pgvector.\n`);

  // 4. Re-embed Jobs
  console.log('💼 Re-embedding Industry Jobs...');
  const jobs = await prisma.job.findMany({
    where: { status: 'OPEN' },
    include: {
      company: { select: { name: true } },
      skills: { include: { skill: true } },
    },
  });

  for (const job of jobs) {
    const skillNames = (job.skills || []).map((s) => s.skill?.name).filter(Boolean);
    const skillsStr = skillNames.join(', ');
    const text = `Job: ${job.title}\nCompany: ${job.company?.name || ''}\nLocation: ${job.locationType} (${job.city || ''}, ${job.country})\nExperience: ${job.experienceLevel}\nRequired Skills: ${skillsStr}\nDescription: ${job.description}`;
    const embedding = await generateEmbedding(text);

    if (embedding.length !== 1024) {
      throw new Error(`Dimension mismatch: job ${job.id} produced ${embedding.length} dims, expected 1024`);
    }

    const vectorStr = formatVectorForPg(embedding);
    const metadataStr = JSON.stringify({
      jobId: job.id,
      title: job.title,
      company: job.company?.name,
      requiredSkills: skillNames,
      experienceLevel: job.experienceLevel,
      locationType: job.locationType,
    });

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO document_chunks (id, content, source, source_type, metadata, embedding, created_at)
      VALUES (gen_random_uuid()::text, $1, $2, 'job', $3::jsonb, $4::vector, NOW())
      `,
      text,
      `job_${job.id}`,
      metadataStr,
      vectorStr
    );
    totalIngested++;
  }
  console.log(`✅ Re-embedded ${jobs.length} jobs into pgvector.\n`);

  // 5. Re-embed Roadmaps Catalog
  console.log('🗺️ Re-embedding Career Roadmaps...');
  for (const rm of PRODUCTION_ROADMAPS_CATALOG) {
    const text = `Career Roadmap: ${rm.title}\nCategory: ${rm.category}\nTarget Role: ${rm.targetRole}\nSummary: ${rm.summary}\nFinal Milestone: ${rm.finalMilestone}`;
    const embedding = await generateEmbedding(text);

    if (embedding.length !== 1024) {
      throw new Error(`Dimension mismatch: roadmap ${rm.id} produced ${embedding.length} dims, expected 1024`);
    }

    const vectorStr = formatVectorForPg(embedding);
    const metadataStr = JSON.stringify({
      roadmapId: rm.id,
      slug: rm.slug,
      title: rm.title,
      category: rm.category,
      targetRole: rm.targetRole,
    });

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO document_chunks (id, content, source, source_type, metadata, embedding, created_at)
      VALUES (gen_random_uuid()::text, $1, $2, 'roadmap', $3::jsonb, $4::vector, NOW())
      `,
      text,
      `roadmap_${rm.id}`,
      metadataStr,
      vectorStr
    );
    totalIngested++;
  }
  console.log(`✅ Re-embedded ${PRODUCTION_ROADMAPS_CATALOG.length} career roadmaps into pgvector.\n`);

  // 6. Platform Overview Knowledge
  console.log('🌐 Re-embedding Platform Ecosystem Overview...');
  const platformDoc = `GroEarn is a unified platform connecting 4 canonical profiles:
1. Learner: Discovers career roadmaps, enrolls in structured courses, books 1-on-1 mentorship sessions, and earns verifiable skill certificates.
2. Mentor: Instructs technical courses, provides 1-on-1 career coaching, guides learners, and earns marketplace payouts.
3. Freelancer: Discovers freelance gigs and full-time opportunities, submits proposals, builds portfolios, and delivers client projects.
4. Company: Posts verified jobs, sources matched candidates via vector search, reviews proposals, and hires verified talent.`;
  const platformEmb = await generateEmbedding(platformDoc);
  const platformVectorStr = formatVectorForPg(platformEmb);
  await prisma.$executeRawUnsafe(
    `
    INSERT INTO document_chunks (id, content, source, source_type, metadata, embedding, created_at)
    VALUES (gen_random_uuid()::text, $1, 'platform_ecosystem_overview', 'knowledge_base', $2::jsonb, $3::vector, NOW())
    `,
    platformDoc,
    JSON.stringify({ title: 'GroEarn Ecosystem Overview', type: 'knowledge' }),
    platformVectorStr
  );
  totalIngested++;

  // Verify stored records
  const countResult = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
    `SELECT COUNT(*)::int as count FROM document_chunks WHERE embedding IS NOT NULL;`
  );
  const finalCount = countResult[0]?.count || 0;

  console.log('================================================================================');
  console.log(`🎉 RE-EMBEDDING COMPLETE: ${finalCount} / ${totalIngested} CHUNKS EMBEDDED WITH REAL BGE-M3 (1024 DIMS)`);
  console.log('================================================================================\n');

  process.exit(0);
}

reembedAll().catch((err) => {
  console.error('Fatal Re-embedding Error:', err);
  process.exit(1);
});
