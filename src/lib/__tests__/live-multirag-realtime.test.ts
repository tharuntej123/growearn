// Automated End-to-End Multi-RAG Real-Time Ingestion and Retrieval Verification Test.
// Verifies that new Mentors, Jobs, Courses, and Candidates are automatically embedded via BGE-M3 (1024 dims)
// and immediately discoverable across the platform.

import { prisma } from '../prisma';
import { JobRepository } from '../../repositories/job.repository';
import { MentorRepository } from '../../repositories/mentor.repository';
import { UserRepository } from '../../repositories/user.repository';
import { SkillRAGService } from '../ai/skill-rag.service';
import { PgVectorStore } from '../ai/vector-store';
import { generateEmbedding, isEmbeddingConfigured } from '../ai/embeddings';
import { RAGSyncService } from '../ai/rag-sync.service';

async function runLiveMultiRAGTest() {
  console.log('================================================================================');
  console.log('🚀 LIVE MULTI-RAG REAL-TIME INGESTION & DISCOVERY TEST (BGE-M3 1024 DIMS)');
  console.log('================================================================================\n');

  if (!isEmbeddingConfigured()) {
    throw new Error('Local BGE-M3 embedding service is not configured or not running on 127.0.0.1:11434');
  }

  const timestamp = Date.now();

  // --------------------------------------------------------------------------
  // 1. TEST REAL-TIME JOB INGESTION & RECOMMENDATION
  // --------------------------------------------------------------------------
  console.log('--- 1. TESTING REAL-TIME JOB INGESTION & FREELANCER DISCOVERY ---');
  let employer = await prisma.user.findFirst({ where: { role: 'COMPANY' } });
  if (!employer) {
    employer = await prisma.user.findFirst({ where: { role: 'EMPLOYER' } });
  }
  if (!employer) {
    employer = await prisma.user.create({
      data: {
        name: 'Quantum Systems Tech',
        email: `quantum-${timestamp}@test-multirag.internal`,
        passwordHash: 'TestHash123!Secure',
        role: 'COMPANY',
      },
    });
  }

  const uniqueJobTitle = `Principal Rust Distributed Architect ${timestamp}`;
  const testJob = await JobRepository.createJob(employer.id, {
    title: uniqueJobTitle,
    description: 'Design and deploy ultra-low latency distributed storage engines and consensus protocols using Rust, Tokio, Raft, and PostgreSQL.',
    locationType: 'REMOTE',
    jobType: 'FULL_TIME',
    minSalary: 160000,
    maxSalary: 220000,
    currency: 'USD',
    experienceLevel: 'LEAD',
    isLocal: false,
    country: 'United States',
    skillNames: ['Rust', 'Tokio', 'Raft Consensus', 'Distributed Systems', 'PostgreSQL'],
  });

  // Explicitly wait for sync completion
  await RAGSyncService.syncJob(testJob.id);

  // Verify vector chunk in PostgreSQL pgvector
  const jobChunks = await PgVectorStore.similaritySearch(
    await generateEmbedding('Rust Distributed Consensus Tokio Systems'),
    5,
    'job'
  );
  const matchedJobChunk = jobChunks.find((c) => c.source === `job_${testJob.id}`);
  console.log('  Job ID:', testJob.id);
  console.log('  Job Title:', testJob.title);
  console.log('  Vector Chunk Found in DB:', matchedJobChunk ? 'YES' : 'NO');
  console.log('  Cosine Similarity Score:', matchedJobChunk?.similarity ?? 'N/A');

  if (!matchedJobChunk) {
    throw new Error(`Real-time Job Ingestion failed: Chunk for job_${testJob.id} not found in document_chunks.`);
  }

  // --------------------------------------------------------------------------
  // 2. TEST REAL-TIME MENTOR INGESTION & STUDENT DISCOVERY
  // --------------------------------------------------------------------------
  console.log('\n--- 2. TESTING REAL-TIME MENTOR INGESTION & STUDENT RAG DISCOVERY ---');
  const mentorEmail = `mentor-rust-${timestamp}@test-multirag.internal`;
  const mentorUser = await UserRepository.create({
    name: `Dr. Vikram Shenoy ${timestamp.toString().slice(-4)}`,
    email: mentorEmail,
    passwordHash: 'TestHash123!Secure',
    role: 'MENTOR',
  });

  const mentorProfile = await MentorRepository.upsertMentorProfile(mentorUser.id, {
    title: 'Staff Rust & Linux Kernel Mentor',
    bio: '15+ years building Linux network drivers and high-throughput async systems in Rust and C++. Guiding engineers into senior infrastructure roles.',
    expertise: 'Rust, Linux Kernel, Async IO, Tokio, Systems Programming',
    hourlyRate: 110,
    yearsExperience: 15,
  });

  // Await mentor sync
  await RAGSyncService.syncMentor(mentorProfile.id);

  // Verify student skill RAG search finds this new mentor
  const mentorSearchResults = await SkillRAGService.searchMentors({
    skill: 'Rust Linux Kernel Tokio Systems',
    limit: 10,
  });

  const foundMentor = mentorSearchResults.mentors.find((m) => m.id === mentorProfile.id || m.userId === mentorUser.id);
  console.log('  Mentor ID:', mentorProfile.id);
  console.log('  Mentor Name:', mentorUser.name);
  console.log('  Discovered in RAG Search:', foundMentor ? 'YES' : 'NO');
  console.log('  Match Score:', foundMentor ? `${foundMentor.matchScore}%` : 'N/A');
  console.log('  Match Reason:', foundMentor?.matchReason || 'N/A');

  if (!foundMentor) {
    throw new Error(`Real-time Mentor Ingestion failed: Mentor ${mentorProfile.id} not discoverable via SkillRAGService.`);
  }

  // --------------------------------------------------------------------------
  // 3. TEST REAL-TIME COURSE INGESTION & LEARNER DISCOVERY
  // --------------------------------------------------------------------------
  console.log('\n--- 3. TESTING REAL-TIME COURSE INGESTION & LEARNER DISCOVERY ---');
  const uniqueCourseTitle = `Mastering Asynchronous Rust & Tokio Systems ${timestamp}`;
  const testCourse = await prisma.course.create({
    data: {
      instructorId: mentorUser.id,
      title: uniqueCourseTitle,
      slug: `rust-tokio-systems-${timestamp}`,
      description: 'Comprehensive deep dive into building production-grade event-driven microservices with Rust, Tokio, Tracing, and Tonic gRPC.',
      category: 'Systems Engineering',
      level: 'ADVANCED',
      price: 89,
      durationHours: 24,
      skillsCovered: 'Rust, Tokio, gRPC, Distributed Systems, Async Programming',
      isPublished: true,
    },
  });

  // Await course sync
  await RAGSyncService.syncCourse(testCourse.id);

  // Verify course search finds this new course
  const courseSearchResults = await SkillRAGService.searchCourses({
    skill: 'Rust Async Tokio Microservices',
    limit: 10,
  });

  const foundCourse = courseSearchResults.courses.find((c) => c.id === testCourse.id);
  console.log('  Course ID:', testCourse.id);
  console.log('  Course Title:', testCourse.title);
  console.log('  Discovered in RAG Search:', foundCourse ? 'YES' : 'NO');
  console.log('  Match Score:', foundCourse ? `${foundCourse.matchScore}%` : 'N/A');
  console.log('  Match Reason:', foundCourse?.matchReason || 'N/A');

  if (!foundCourse) {
    throw new Error(`Real-time Course Ingestion failed: Course ${testCourse.id} not discoverable via SkillRAGService.`);
  }

  // --------------------------------------------------------------------------
  // 4. TEST REAL-TIME CANDIDATE / FREELANCER INGESTION
  // --------------------------------------------------------------------------
  console.log('\n--- 4. TESTING REAL-TIME CANDIDATE INGESTION & EMPLOYER RAG MATCHING ---');
  const candidateEmail = `candidate-rust-${timestamp}@test-multirag.internal`;
  const candidateUser = await UserRepository.create({
    name: `Sneha Kulkarni ${timestamp.toString().slice(-4)}`,
    email: candidateEmail,
    passwordHash: 'TestHash123!Secure',
    role: 'FREELANCER',
  });

  await prisma.profile.update({
    where: { userId: candidateUser.id },
    data: {
      title: 'Senior Distributed Rust Engineer',
      yearsOfExperience: 6,
      careerGoal: 'Principal Infrastructure Engineer',
      hourlyRate: 85,
    },
  });

  await UserRepository.addSkill(candidateUser.id, 'Rust', 'EXPERT');
  await UserRepository.addSkill(candidateUser.id, 'Tokio', 'ADVANCED');
  await UserRepository.addSkill(candidateUser.id, 'Distributed Systems', 'ADVANCED');

  // Await candidate sync
  await RAGSyncService.syncCandidate(candidateUser.id);

  // Verify candidate chunk in vector store
  const candidateChunks = await PgVectorStore.similaritySearch(
    await generateEmbedding('Senior Distributed Rust Engineer Tokio Raft'),
    5,
    'candidate'
  );
  const matchedCandidateChunk = candidateChunks.find((c) => c.source === `candidate_${candidateUser.id}`);
  console.log('  Candidate ID:', candidateUser.id);
  console.log('  Candidate Name:', candidateUser.name);
  console.log('  Vector Chunk Found in DB:', matchedCandidateChunk ? 'YES' : 'NO');
  console.log('  Cosine Similarity Score:', matchedCandidateChunk?.similarity ?? 'N/A');

  if (!matchedCandidateChunk) {
    throw new Error(`Real-time Candidate Ingestion failed: Chunk for candidate_${candidateUser.id} not found.`);
  }

  // --------------------------------------------------------------------------
  // 5. TEST DELETION & CLEANUP OF VECTOR CHUNKS
  // --------------------------------------------------------------------------
  console.log('\n--- 5. TESTING VECTOR CHUNK CLEANUP ON ENTITY DELETION ---');
  await JobRepository.deleteJob(testJob.id);
  await MentorRepository.deleteMentorProfile(mentorProfile.id);
  await prisma.course.delete({ where: { id: testCourse.id } });
  await RAGSyncService.removeEntity('course', testCourse.id);
  await prisma.user.delete({ where: { id: candidateUser.id } });
  await RAGSyncService.removeEntity('candidate', candidateUser.id);
  await prisma.user.delete({ where: { id: mentorUser.id } });

  // Verify chunks were cleaned up
  const [deletedJobChunks, deletedMentorChunks, deletedCourseChunks, deletedCandidateChunks] = await Promise.all([
    PgVectorStore.similaritySearch(await generateEmbedding('Rust Distributed Consensus Tokio Systems'), 10, 'job'),
    PgVectorStore.similaritySearch(await generateEmbedding('Rust Linux Kernel Tokio Systems'), 10, 'mentor'),
    PgVectorStore.similaritySearch(await generateEmbedding('Rust Async Tokio Microservices'), 10, 'course'),
    PgVectorStore.similaritySearch(await generateEmbedding('Senior Distributed Rust Engineer Tokio'), 10, 'candidate'),
  ]);

  const jobStillExists = deletedJobChunks.some((c) => c.source === `job_${testJob.id}`);
  const mentorStillExists = deletedMentorChunks.some((c) => c.source === `mentor_${mentorProfile.id}`);
  const courseStillExists = deletedCourseChunks.some((c) => c.source === `course_${testCourse.id}`);
  const candidateStillExists = deletedCandidateChunks.some((c) => c.source === `candidate_${candidateUser.id}`);

  console.log('  Job Vector Cleaned Up:', !jobStillExists ? 'YES' : 'NO');
  console.log('  Mentor Vector Cleaned Up:', !mentorStillExists ? 'YES' : 'NO');
  console.log('  Course Vector Cleaned Up:', !courseStillExists ? 'YES' : 'NO');
  console.log('  Candidate Vector Cleaned Up:', !candidateStillExists ? 'YES' : 'NO');

  if (jobStillExists || mentorStillExists || courseStillExists || candidateStillExists) {
    throw new Error('Vector cleanup failed: One or more chunks still persist after entity deletion.');
  }

  await prisma.$disconnect();
  console.log('\n================================================================================');
  console.log('✅ ALL REAL-TIME MULTI-RAG AUTO-INGESTION & CLEANUP TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================================');
}

runLiveMultiRAGTest().catch((err) => {
  console.error('\n❌ MULTI-RAG TEST FAILED:', err);
  process.exit(1);
});
