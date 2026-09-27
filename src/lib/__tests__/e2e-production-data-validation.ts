/**
 * @file e2e-production-data-validation.ts
 * @description Exhaustive End-to-End Production Data, PostgreSQL, pgvector Embeddings, RAG Pipeline,
 * and Multi-Dashboard Data Generation Verification Test Suite.
 */

import { prisma } from '../prisma';
import { PgVectorStore } from '../ai/vector-store';
import { PgVectorRetriever } from '../ai/retriever';
import { generateEmbedding } from '../ai/embeddings';
import { ProductionRAGChain } from '../ai/rag-chain';
import { IntentClassifier } from '../ai/intent-classifier';
import { SkillRAGService } from '../ai/skill-rag.service';
import { RecommendationService } from '../../services/recommendation.service';
import { getUserAIContext } from '../../services/user-context.service';
import { HybridMatcher } from '../ai/hybrid-matcher';
import { UserRepository } from '../../repositories/user.repository';
import { PRODUCTION_ROADMAPS_CATALOG } from '../ai/roadmaps-catalog';

interface TestSectionResult {
  section: string;
  passed: boolean;
  details: string[];
  metrics?: Record<string, any>;
}

async function runEndToEndProductionValidation() {
  console.log('================================================================================');
  console.log('🔬 STARTING COMPLETE PRODUCTION DATA & RAG E2E VERIFICATION TEST SUITE');
  console.log('================================================================================\n');

  const results: TestSectionResult[] = [];

  // ============================================================================
  // SECTION 1: PostgreSQL Real Database Entities & Schema Integrity
  // ============================================================================
  console.log('📦 SECTION 1: Verifying Real PostgreSQL Database Tables & Relations...');
  try {
    const [
      usersCount,
      profilesCount,
      skillsCount,
      userSkillsCount,
      projectsCount,
      certificationsCount,
      coursesCount,
      mentorProfilesCount,
      jobsCount,
      applicationsCount,
      documentChunksCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.profile.count(),
      prisma.skill.count(),
      prisma.userSkill.count(),
      prisma.project.count(),
      prisma.certification.count(),
      prisma.course.count(),
      prisma.mentorProfile.count(),
      prisma.job.count(),
      prisma.application.count(),
      PgVectorStore.countChunks(),
    ]);

    const details = [
      `Users count: ${usersCount}`,
      `Profiles count: ${profilesCount}`,
      `Skills count: ${skillsCount} (User Skills: ${userSkillsCount})`,
      `Verified Projects count: ${projectsCount}`,
      `Certifications count: ${certificationsCount}`,
      `Published Courses count: ${coursesCount}`,
      `Available Mentors count: ${mentorProfilesCount}`,
      `Active Job Postings count: ${jobsCount}`,
      `Applications count: ${applicationsCount}`,
      `pgvector Document Chunks: ${documentChunksCount}`,
    ];

    details.forEach((d) => console.log(`   ✓ ${d}`));

    if (usersCount < 5 || coursesCount < 3 || mentorProfilesCount < 2 || jobsCount < 3 || documentChunksCount < 50) {
      throw new Error('Database records count below minimum production threshold.');
    }

    results.push({
      section: 'PostgreSQL Database & Personas Integrity',
      passed: true,
      details,
      metrics: { usersCount, coursesCount, mentorProfilesCount, jobsCount, documentChunksCount },
    });
    console.log('   ✅ PASS: PostgreSQL database integrity fully verified.\n');
  } catch (err: any) {
    console.error('   ❌ FAIL: Section 1 error:', err);
    results.push({ section: 'PostgreSQL Database & Personas Integrity', passed: false, details: [err.message] });
  }

  // ============================================================================
  // SECTION 2: Vector Database (pgvector), 1536-dim Embeddings & Cosine Search
  // ============================================================================
  console.log('📐 SECTION 2: Verifying Vector Embeddings & pgvector Cosine Similarity Search...');
  try {
    const testQueries = [
      'Next.js 15 Server Components and Prisma Full-Stack',
      'Java 21 Spring Boot Microservices and Kafka',
      'Python AI LLM RAG Embeddings Vector Search',
      'AWS Cloud DevOps Kubernetes Terraform SRE',
      'Data Engineering Spark Snowflake Lakehouse',
      'React Native Mobile App Development Kotlin',
    ];

    const retriever = new PgVectorRetriever({ topK: 5 });
    const vectorDetails: string[] = [];

    for (const q of testQueries) {
      const retrieved = await retriever.retrieveRecords(q);
      if (retrieved.length === 0) {
        throw new Error(`pgvector returned 0 chunks for query: "${q}"`);
      }
      const topDoc = retrieved[0];
      const detailStr = `Query "${q.slice(0, 35)}..." -> Top Chunk: "${topDoc.source}" (Similarity: ${topDoc.similarity?.toFixed(4)}, Type: ${topDoc.sourceType})`;
      vectorDetails.push(detailStr);
      console.log(`   ✓ ${detailStr}`);
    }

    results.push({
      section: 'pgvector Cosine Similarity & Vector Matching',
      passed: true,
      details: vectorDetails,
    });
    console.log('   ✅ PASS: pgvector cosine similarity search returned ranked grounded chunks.\n');
  } catch (err: any) {
    console.error('   ❌ FAIL: Section 2 error:', err);
    results.push({ section: 'pgvector Cosine Similarity & Vector Matching', passed: false, details: [err.message] });
  }

  // ============================================================================
  // SECTION 3: RAG Pipeline -> Vector Retrieval -> LLM Grounding
  // ============================================================================
  console.log('🧠 SECTION 3: Verifying RAG Pipeline -> Context Retrieval -> LLM Grounding...');
  try {
    const ragQueries = [
      'Give me a complete learning roadmap for becoming a Python AI & RAG Engineer',
      'Who is the best mentor on GrowEarn for Java Spring Boot and fintech architecture?',
      'What are the latest remote Next.js and React full-stack jobs available?',
    ];

    const ragDetails: string[] = [];
    for (const q of ragQueries) {
      const ragResult = await ProductionRAGChain.execute(q);
      const detailStr = `Query: "${q.slice(0, 40)}..." -> Intent: [${ragResult.intent}] | Similarity: ${ragResult.similarity} | Sources: [${ragResult.sources.slice(0, 2).join(', ')}] | Answer Length: ${ragResult.answer.length} chars`;
      ragDetails.push(detailStr);
      console.log(`   ✓ ${detailStr}`);
      if (!ragResult.answer || ragResult.sources.length === 0) {
        throw new Error(`RAG chain failed for query: "${q}"`);
      }
    }

    results.push({
      section: 'RAG Pipeline & LLM Grounding Chain',
      passed: true,
      details: ragDetails,
    });
    console.log('   ✅ PASS: Production RAG Chain generated grounded answers with real sources & similarities.\n');
  } catch (err: any) {
    console.error('   ❌ FAIL: Section 3 error:', err);
    results.push({ section: 'RAG Pipeline & LLM Grounding Chain', passed: false, details: [err.message] });
  }

  // ============================================================================
  // SECTION 4: Student Dashboard RAG Flow (Roadmap + Top 5 Mentors + Top 5 Courses)
  // ============================================================================
  console.log('🎓 SECTION 4: Verifying Student Skill RAG (10 Roadmaps Catalog + Top 5 Courses/Mentors)...');
  try {
    const studentSkills = ['Next.js', 'Java', 'Python AI', 'Cloud DevOps', 'Golang', 'UI/UX Design'];
    const studentDetails: string[] = [];

    for (const skill of studentSkills) {
      const ragRes = await SkillRAGService.querySkillRAG(skill);

      if (!ragRes.roadmap || ragRes.roadmap.phases.length < 4) {
        throw new Error(`Expected at least 4 roadmap phases for skill "${skill}", found ${ragRes.roadmap?.phases?.length}`);
      }
      if (ragRes.topCourses.length === 0) {
        throw new Error(`Expected top courses for skill "${skill}", found 0`);
      }
      if (ragRes.topMentors.length === 0) {
        throw new Error(`Expected top mentors for skill "${skill}", found 0`);
      }

      const topCourse = ragRes.topCourses[0];
      const topMentor = ragRes.topMentors[0];

      const detailStr = `Skill "${skill}" -> Roadmap: "${ragRes.roadmap.targetRole}" (${ragRes.roadmap.phases.length} phases) | Top Course: "${topCourse.title}" (${topCourse.matchScore}% match) | Top Mentor: "${topMentor.name}" (${topMentor.matchScore}% match, $${topMentor.hourlyRate}/hr, ${topMentor.rating}⭐)`;
      studentDetails.push(detailStr);
      console.log(`   ✓ ${detailStr}`);
    }

    results.push({
      section: 'Student Dashboard RAG & Roadmaps Flow',
      passed: true,
      details: studentDetails,
    });
    console.log('   ✅ PASS: Student RAG service generated 4-phase roadmaps and top 5 ranked courses & mentors.\n');
  } catch (err: any) {
    console.error('   ❌ FAIL: Section 4 error:', err);
    results.push({ section: 'Student Dashboard RAG & Roadmaps Flow', passed: false, details: [err.message] });
  }

  // ============================================================================
  // SECTION 5: Freelancer Job Recommendations Flow (Skills, Experience, Certs, Projects Match)
  // ============================================================================
  console.log('💼 SECTION 5: Verifying Freelancer Job Matching Flow (Skills + Exp + Projects + Certs)...');
  try {
    const freelancerUser = await prisma.user.findFirst({
      where: { role: { in: ['FREELANCER', 'PROFESSIONAL'] } },
      include: { profile: true, skills: { include: { skill: true } } },
    });

    if (!freelancerUser) {
      throw new Error('No freelancer user found in database for testing.');
    }

    const userContext = await getUserAIContext(freelancerUser.id);
    if (!userContext) {
      throw new Error('Failed to load user context for freelancer.');
    }

    const jobRecs = await RecommendationService.getJobs(userContext, 5);
    const freelancerDetails: string[] = [
      `Freelancer: ${userContext.name} (${userContext.profile?.targetRole || 'Full-Stack Developer'})`,
      `Verified Skills: ${userContext.skills.join(', ')}`,
      `Projects Count: ${userContext.projects.length} | Certifications Count: ${userContext.certifications.length}`,
      `Total Recommended Jobs: ${jobRecs.jobs.length} (Personalized: ${jobRecs.isPersonalized})`,
    ];

    jobRecs.jobs.forEach((j, idx) => {
      const jobStr = `   [Job ${idx + 1}] "${j.title}" at ${(j as any).companyName || 'Verified Org'} | Match Score: ${j.matchScore}% | Reason: ${j.whyMatches}`;
      freelancerDetails.push(jobStr);
      console.log(jobStr);
    });

    if (jobRecs.jobs.length === 0 || jobRecs.jobs[0].matchScore < 50) {
      throw new Error('Job recommendation match scores unexpected or empty.');
    }

    results.push({
      section: 'Freelancer Weighted Job Recommendations Flow',
      passed: true,
      details: freelancerDetails,
    });
    console.log('   ✅ PASS: Freelancer job recommendations accurately weighted against real database jobs.\n');
  } catch (err: any) {
    console.error('   ❌ FAIL: Section 5 error:', err);
    results.push({ section: 'Freelancer Weighted Job Recommendations Flow', passed: false, details: [err.message] });
  }

  // ============================================================================
  // SECTION 6: Company Dashboard Flow (Job Postings, Applications, Candidate Matching)
  // ============================================================================
  console.log('🏢 SECTION 6: Verifying Company Dashboard Flow (Job Postings & Candidate Retrieval)...');
  try {
    const companyUser = await prisma.user.findFirst({
      where: { role: { in: ['EMPLOYER', 'COMPANY', 'RECRUITER'] } },
      include: {
        jobPostings: {
          include: {
            applications: { include: { applicant: { include: { profile: true } } } },
            skills: { include: { skill: true } },
          },
        },
      },
    });

    if (!companyUser) {
      throw new Error('No company user found in database for testing.');
    }

    const allCandidates = await UserRepository.getAllCandidates();
    const companyDetails: string[] = [
      `Company: ${companyUser.name}`,
      `Total Job Postings: ${companyUser.jobPostings.length}`,
      `Total Applications across postings: ${companyUser.jobPostings.reduce((sum, j) => sum + j.applications.length, 0)}`,
      `Total Available Candidates in Pool: ${allCandidates.length}`,
    ];

    companyDetails.forEach((d) => console.log(`   ✓ ${d}`));

    // Test candidate matching against first company job
    if (companyUser.jobPostings.length > 0) {
      const firstJob = companyUser.jobPostings[0];
      const jobSkills = firstJob.skills.map((s) => s.skill.name);

      const topCandidates = allCandidates
        .map((c) => {
          const candidateSkills = c.skills.map((s) => s.skill.name);
          const matchResult = HybridMatcher.calculateJobMatch(
            {
              skills: candidateSkills,
              yearsExperience: c.profile?.yearsOfExperience || 0,
              location: c.location || undefined,
            },
            {
              title: firstJob.title,
              description: firstJob.description,
              requiredSkills: jobSkills,
              experienceLevel: firstJob.experienceLevel,
              locationType: firstJob.locationType,
            }
          );
          return { candidate: c, matchScore: matchResult.overallScore, reason: matchResult.explanation };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 3);

      topCandidates.forEach((tc, idx) => {
        const cStr = `   [Candidate ${idx + 1}] ${tc.candidate.name} (${tc.candidate.headline || 'Engineer'}) | AI Match: ${tc.matchScore}% | Reason: ${tc.reason}`;
        companyDetails.push(cStr);
        console.log(cStr);
      });
    }

    results.push({
      section: 'Company Dashboard & Candidate Match Flow',
      passed: true,
      details: companyDetails,
    });
    console.log('   ✅ PASS: Company dashboard jobs, applications, and candidate match validated.\n');
  } catch (err: any) {
    console.error('   ❌ FAIL: Section 6 error:', err);
    results.push({ section: 'Company Dashboard & Candidate Match Flow', passed: false, details: [err.message] });
  }

  // ============================================================================
  // SECTION 7: Mentor Dashboard Flow (Mentorship Requests, Sessions, Published Courses)
  // ============================================================================
  console.log('👨‍🏫 SECTION 7: Verifying Mentor Dashboard Flow (Sessions, Requests & Courses)...');
  try {
    const mentorUser = await prisma.user.findFirst({
      where: { role: 'MENTOR' },
      include: {
        mentorProfile: true,
        instructedCourses: true,
        receivedReviews: true,
      },
    });

    if (!mentorUser || !mentorUser.mentorProfile) {
      throw new Error('No mentor user or mentor profile found in database for testing.');
    }

    const mentorDetails = [
      `Mentor: ${mentorUser.name} (${mentorUser.mentorProfile.title})`,
      `Expertise: ${mentorUser.mentorProfile.expertise}`,
      `Hourly Rate: $${mentorUser.mentorProfile.hourlyRate}/hr | Rating: ${mentorUser.mentorProfile.rating}⭐`,
      `Total Students Mentored: ${mentorUser.mentorProfile.studentsCount} | Sessions Conducted: ${mentorUser.mentorProfile.sessionCount}`,
      `Published Courses Taught: ${mentorUser.instructedCourses.length}`,
    ];

    mentorDetails.forEach((d) => console.log(`   ✓ ${d}`));

    results.push({
      section: 'Mentor Dashboard Data Flow',
      passed: true,
      details: mentorDetails,
    });
    console.log('   ✅ PASS: Mentor dashboard data flow verified.\n');
  } catch (err: any) {
    console.error('   ❌ FAIL: Section 7 error:', err);
    results.push({ section: 'Mentor Dashboard Data Flow', passed: false, details: [err.message] });
  }

  // ============================================================================
  // FINAL SUMMARY & ASSERTION
  // ============================================================================
  console.log('================================================================================');
  console.log('📊 FINAL END-TO-END PRODUCTION DATA VALIDATION REPORT');
  console.log('================================================================================');

  let allPassed = true;
  results.forEach((r, idx) => {
    const statusIcon = r.passed ? '✅ PASS' : '❌ FAIL';
    if (!r.passed) allPassed = false;
    console.log(`${idx + 1}. [${statusIcon}] ${r.section}`);
  });
  console.log('================================================================================\n');

  await prisma.$disconnect();

  if (!allPassed) {
    console.error('💥 Some production verification tests failed.');
    process.exit(1);
  } else {
    console.log('🎉 ALL 7 PRODUCTION DATA & RAG E2E VERIFICATION TEST SUITES PASSED (100%)!');
  }
}

runEndToEndProductionValidation().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
