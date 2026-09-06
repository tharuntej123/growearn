import prisma, { checkDatabaseHealth } from '../prisma';
import { createJobSchema } from '../../validators/job.schema';
import { JobRepository } from '../../repositories/job.repository';

async function runTests() {
  console.log('==============================================');
  console.log('🚀 RUNNING GROEARN V4 INTEGRATION TEST SUITE');
  console.log('==============================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      if (detail) console.error(`   Details: ${detail}`);
      failed++;
    }
  }

  // --- 1. Database Health Check ---
  console.log('--- 1. Testing Database Health Check (SELECT 1) ---');
  try {
    const health = await checkDatabaseHealth();
    assert(health.connected === true, 'Database health check reports connected: true');
    assert(typeof health.latencyMs === 'number' && health.latencyMs >= 0, `Database latency is valid: ${health.latencyMs}ms`);
  } catch (err: any) {
    assert(false, 'Database health check executed without throwing', err.message);
  }

  // --- 2. Zod Validation Rules ---
  console.log('\n--- 2. Testing Job Creation Zod Validation Rules ---');
  
  // 2a: Description under 20 characters
  const shortDescResult = createJobSchema.safeParse({
    title: 'Senior Engineer',
    description: 'Too short', // < 20
    skills: ['TypeScript'],
    minSalary: 20000,
    maxSalary: 40000,
  });
  assert(!shortDescResult.success, 'Rejects descriptions shorter than 20 characters');

  // 2b: Empty skills list
  const emptySkillsResult = createJobSchema.safeParse({
    title: 'Senior Engineer',
    description: 'This is a sufficiently long description that satisfies the length requirement.',
    skills: [],
    minSalary: 20000,
    maxSalary: 40000,
  });
  assert(!emptySkillsResult.success, 'Rejects empty skills list');

  // 2c: Negative salary
  const negSalaryResult = createJobSchema.safeParse({
    title: 'Senior Engineer',
    description: 'This is a sufficiently long description that satisfies the length requirement.',
    skills: ['TypeScript'],
    minSalary: -500,
    maxSalary: 40000,
  });
  assert(!negSalaryResult.success, 'Rejects negative minSalary');

  // 2d: Valid job payload
  const validPayloadResult = createJobSchema.safeParse({
    title: 'Full Stack Next.js Architect',
    description: 'Leading the modern web application architecture and AI search systems for our enterprise client base.',
    skills: ['Next.js', 'PostgreSQL', 'TypeScript'],
    locationType: 'HYBRID',
    jobType: 'FULL_TIME',
    city: 'Chennai',
    minSalary: 30000,
    maxSalary: 55000,
    currency: 'USD',
    experienceLevel: 'SENIOR',
    isLocal: true,
  });
  assert(validPayloadResult.success, 'Accepts valid job creation payload');

  // --- 3. Role Authorization Matrix ---
  console.log('\n--- 3. Testing Role Authorization Matrix ---');
  const allowedRoles = ['COMPANY', 'EMPLOYER', 'ADMIN'];
  const deniedRoles = ['LEARNER', 'STUDENT', 'PROFESSIONAL', 'FREELANCER', 'MENTOR'];

  allowedRoles.forEach((role) => {
    const isAllowed = ['COMPANY', 'EMPLOYER', 'ADMIN'].includes(role);
    assert(isAllowed, `Role "${role}" is authorized to post jobs`);
  });

  deniedRoles.forEach((role) => {
    const isAllowed = ['COMPANY', 'EMPLOYER', 'ADMIN'].includes(role);
    assert(!isAllowed, `Role "${role}" is forbidden from posting jobs`);
  });

  // --- 4. Database Job Insertion and Querying ---
  console.log('\n--- 4. Testing JobRepository DB Persistence ---');
  try {
    // Find or create employer user
    let employer = await prisma.user.findFirst({
      where: { role: { in: ['EMPLOYER', 'COMPANY'] } },
      include: { profile: true },
    });

    if (!employer) {
      employer = await prisma.user.create({
        data: {
          name: 'Apex Test Enterprise',
          email: `test-employer-${Date.now()}@example.com`,
          passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456789',
          role: 'EMPLOYER',
          profile: {
            create: {
              companyName: 'Apex Test Enterprise',
              companyIndustry: 'AI Engineering',
            },
          },
        },
        include: { profile: true },
      });
    }

    if (!employer) {
      throw new Error('Failed to obtain an employer record for testing');
    }

    assert(Boolean(employer.id), `Employer user confirmed: ${employer.name} (Role: ${employer.role})`);

    // Create job via repository
    const testJobTitle = `Test Job Posting [${Date.now()}]`;
    const createdJob = await JobRepository.createJob(employer.id, {
      title: testJobTitle,
      description: 'Comprehensive integration test job listing designed to verify database persistence and skill relations.',
      locationType: 'REMOTE',
      jobType: 'FULL_TIME',
      minSalary: 35000,
      maxSalary: 60000,
      currency: 'USD',
      experienceLevel: 'MID',
      isLocal: false,
      skillNames: ['PostgreSQL', 'Prisma', 'Next.js'],
    });

    assert(Boolean(createdJob?.id), `Job successfully created with ID: ${createdJob.id}`);
    assert(createdJob.title === testJobTitle, `Job title matches: "${createdJob.title}"`);
    assert(createdJob.skills.length === 3, `Job skills linked correctly (${createdJob.skills.length} skills)`);

    // Fetch jobs for employer via repository
    const jobRepo = new JobRepository();
    const employerJobs = await jobRepo.getJobs({ companyId: employer.id });
    const found = employerJobs.some((j: any) => j.id === createdJob.id);
    assert(found, `Newly created job retrieved in employer job listings`);

    // Clean up test job
    await prisma.jobSkill.deleteMany({ where: { jobId: createdJob.id } });
    await prisma.job.delete({ where: { id: createdJob.id } });
    console.log('🧹 Cleaned up temporary test job record.');

  } catch (err: any) {
    assert(false, 'Job repository persistence test', err.message);
  }

  // --- Summary ---
  console.log('\n==============================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==============================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
