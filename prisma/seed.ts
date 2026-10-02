/**
 * @file seed.ts
 * @description Production Database Seed Script for GrowEarn Platform.
 * 
 * Generates:
 * - 12 Mentors (Realistic Indian Professionals with bio, skills, experience, LinkedIn, hourly rate)
 * - 10 Companies (Realistic fictional tech companies)
 * - 20 Technical Courses (Real curriculum with modules and lessons)
 * - 25 Industry Job Postings (Realistic salaries, locations, skill requirements)
 * - Active Learner and Professional demo accounts
 * - Ingests all platform knowledge, mentors, courses, and jobs into PostgreSQL pgvector (document_chunks)
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateEmbedding } from '../src/lib/ai/embeddings';
import { PRODUCTION_ROADMAPS_CATALOG } from '../src/lib/ai/roadmaps-catalog';

const prisma = new PrismaClient();

function formatVectorForPg(vector: number[]): string {
  return `[${vector.join(',')}]`;
}

async function insertChunk(
  content: string,
  source: string,
  sourceType: string,
  metadata: Record<string, any> = {}
) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim().length === 0) {
    return;
  }
  try {
    const embedding = await generateEmbedding(content);
    const vectorStr = formatVectorForPg(embedding);
    const metadataStr = JSON.stringify(metadata);

    await prisma.$executeRawUnsafe(
      `
      INSERT INTO document_chunks (id, content, source, source_type, metadata, embedding, created_at)
      VALUES (gen_random_uuid()::text, $1, $2, $3, $4::jsonb, $5::vector, NOW())
      `,
      content,
      source,
      sourceType,
      metadataStr,
      vectorStr
    );
  } catch (err: any) {
    console.warn(`Vector chunk insert skipped for ${source}:`, err.message);
  }
}

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
    console.error('⛔ FATAL: Database seed execution blocked in PRODUCTION environment.');
    console.error('To override for initial provisioning, set ALLOW_PRODUCTION_SEED=true explicitly.');
    process.exit(1);
  }

  console.log('🌱 Starting GrowEarn Database Seed (Development/Staging Provisioning)...');

  // Clean existing records
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE document_chunks CASCADE;`).catch(() => {});
  await prisma.notification.deleteMany();
  await prisma.aIInteraction.deleteMany();
  await prisma.aIRecommendation.deleteMany();
  await prisma.roadmapItem.deleteMany();
  await prisma.careerRoadmap.deleteMany();
  await prisma.aIProfile.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.application.deleteMany();
  await prisma.jobSkill.deleteMany();
  await prisma.job.deleteMany();
  await prisma.mentorshipBooking.deleteMany();
  await prisma.mentorshipRequest.deleteMany();
  await prisma.mentorProfile.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.lesson.deleteMany();
  await prisma.courseModule.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.project.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.education.deleteMany();
  await prisma.experience.deleteMany();
  await prisma.userSkill.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  const demoPasswordHash = await bcrypt.hash('Demo1234!', 10);

  // 1. Technical Skills (30 In-Demand Skills)
  const skillsData = [
    { name: 'TypeScript', category: 'Frontend' },
    { name: 'React', category: 'Frontend' },
    { name: 'Next.js', category: 'Frontend' },
    { name: 'Tailwind CSS', category: 'Frontend' },
    { name: 'Vue.js', category: 'Frontend' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'Express.js', category: 'Backend' },
    { name: 'Java', category: 'Backend' },
    { name: 'Spring Boot', category: 'Backend' },
    { name: 'Python', category: 'Backend' },
    { name: 'Django', category: 'Backend' },
    { name: 'FastAPI', category: 'Backend' },
    { name: 'Go (Golang)', category: 'Backend' },
    { name: 'PostgreSQL', category: 'Database & Architecture' },
    { name: 'MongoDB', category: 'Database & Architecture' },
    { name: 'Redis', category: 'Database & Architecture' },
    { name: 'System Design', category: 'Database & Architecture' },
    { name: 'Docker', category: 'DevOps & Cloud' },
    { name: 'Kubernetes', category: 'DevOps & Cloud' },
    { name: 'AWS', category: 'DevOps & Cloud' },
    { name: 'Google Cloud Platform', category: 'DevOps & Cloud' },
    { name: 'CI/CD Pipelines', category: 'DevOps & Cloud' },
    { name: 'Machine Learning', category: 'AI / Machine Learning' },
    { name: 'Deep Learning', category: 'AI / Machine Learning' },
    { name: 'LLM Engineering', category: 'AI / Machine Learning' },
    { name: 'LangChain & RAG', category: 'AI / Machine Learning' },
    { name: 'React Native', category: 'Mobile Development' },
    { name: 'Flutter', category: 'Mobile Development' },
    { name: 'UI/UX Design (Figma)', category: 'UI/UX Design' },
    { name: 'GraphQL', category: 'Backend' },
  ];

  const createdSkills: Record<string, string> = {};
  for (const s of skillsData) {
    const created = await prisma.skill.create({ data: s });
    createdSkills[s.name] = created.id;
  }
  console.log(`✅ Seeded ${skillsData.length} technical skills.`);

  // Helper to assign user skills
  async function assignSkillsToUser(userId: string, skillNames: string[]) {
    for (const sName of skillNames) {
      if (createdSkills[sName]) {
        await prisma.userSkill.upsert({
          where: { userId_skillId: { userId, skillId: createdSkills[sName] } },
          update: {},
          create: {
            userId,
            skillId: createdSkills[sName],
            proficiencyLevel: 'ADVANCED',
            isVerified: true,
          },
        });
      }
    }
  }

  // 2. Demo Learner Account (Alex Chen)
  const demoStudent = await prisma.user.create({
    data: {
      email: 'student@example.com',
      passwordHash: demoPasswordHash,
      name: 'Alex Chen',
      role: 'LEARNER',
      headline: 'Computer Science Student & Aspiring Full Stack Developer',
      location: 'Chennai, Tamil Nadu, India',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Chennai',
      bio: 'Enthusiastic CS learner eager to master modern distributed backends, Spring Boot, and Next.js. Seeking 1-on-1 mentorship and full-stack projects.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
      profile: {
        create: {
          title: 'Aspiring Full Stack Engineer',
          careerGoal: 'Backend Software Engineer',
          targetRole: 'Backend Developer',
          experienceLevel: 'Beginner',
          isOnboarded: true,
          aiScore: 84,
          yearsOfExperience: 1,
          githubUrl: 'https://github.com/alexchen',
          linkedinUrl: 'https://linkedin.com/in/alexchen',
        },
      },
    },
  });
  await assignSkillsToUser(demoStudent.id, ['Java', 'Spring Boot', 'PostgreSQL', 'TypeScript', 'React']);

  // 3. Demo Professional Freelancer (Pooja Verma)
  const demoProfessional = await prisma.user.create({
    data: {
      email: 'professional@example.com',
      passwordHash: demoPasswordHash,
      name: 'Pooja Verma',
      role: 'PROFESSIONAL',
      headline: 'Senior Mobile & Full Stack Specialist',
      location: 'Bangalore, Karnataka, India',
      country: 'India',
      state: 'Karnataka',
      city: 'Bangalore',
      bio: 'Specialist in building high-conversion SaaS web apps, Next.js full-stack architectures, and cross-platform mobile apps. 100% job success rate across 35+ contracts.',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
      profile: {
        create: {
          title: 'Senior Mobile & Full Stack Specialist',
          hourlyRate: 65,
          yearsOfExperience: 7,
          aiScore: 95,
          careerGoal: 'Full Stack & Mobile Engineering Consultant',
          targetRole: 'Senior Full Stack Specialist',
          experienceLevel: 'Advanced',
          isOnboarded: true,
          portfolioUrl: 'https://pooja-verma.dev',
          githubUrl: 'https://github.com/poojaverma',
          linkedinUrl: 'https://linkedin.com/in/pooja-verma-mobile',
        },
      },
    },
  });
  await assignSkillsToUser(demoProfessional.id, ['React', 'Next.js', 'TypeScript', 'Flutter', 'React Native', 'Java', 'Spring Boot', 'PostgreSQL']);

  // Additional Indian Freelancers / Professionals
  const additionalProfessionals = [
    {
      name: 'Ananya Iyer',
      email: 'ananya.iyer@example.com',
      headline: 'Senior Java & Spring Boot Cloud Architect',
      location: 'Chennai, Tamil Nadu, India',
      city: 'Chennai',
      state: 'Tamil Nadu',
      bio: '8+ years designing fault-tolerant Java 21 microservices, PostgreSQL query tuning, and distributed Docker clusters.',
      hourlyRate: 70,
      yearsExp: 8,
      aiScore: 96,
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker', 'System Design', 'Kubernetes'],
    },
    {
      name: 'Rahul Mehta',
      email: 'rahul.mehta@example.com',
      headline: 'Full Stack Engineer (React 19, Node.js, Next.js)',
      location: 'Bangalore, Karnataka, India',
      city: 'Bangalore',
      state: 'Karnataka',
      bio: 'Full-stack developer building scalable web products, TypeScript APIs, and automated CI/CD pipelines on AWS.',
      hourlyRate: 55,
      yearsExp: 6,
      aiScore: 92,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      skills: ['React', 'Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
    },
    {
      name: 'Siddharth Nair',
      email: 'siddharth.nair@example.com',
      headline: 'DevOps & Site Reliability Specialist (AWS, K8s)',
      location: 'Hyderabad, Telangana, India',
      city: 'Hyderabad',
      state: 'Telangana',
      bio: 'DevOps consultant specializing in Kubernetes orchestration, Docker containerization, and automated Terraform deployments.',
      hourlyRate: 65,
      yearsExp: 7,
      aiScore: 94,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD Pipelines', 'Python', 'PostgreSQL'],
    },
    {
      name: 'Meera Joshi',
      email: 'meera.joshi@example.com',
      headline: 'Generative AI & Python LLM Pipeline Engineer',
      location: 'Pune, Maharashtra, India',
      city: 'Pune',
      state: 'Maharashtra',
      bio: 'Hands-on AI engineer building production RAG pipelines, LangChain agents, pgvector search, and FastAPI backends.',
      hourlyRate: 60,
      yearsExp: 5,
      aiScore: 93,
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      skills: ['Python', 'LangChain & RAG', 'LLM Engineering', 'PostgreSQL', 'FastAPI', 'Machine Learning'],
    },
    {
      name: 'Kavita Reddy',
      email: 'kavita.reddy@example.com',
      headline: 'Cross-Platform Mobile Engineer (Flutter & React Native)',
      location: 'Chennai, Tamil Nadu, India',
      city: 'Chennai',
      state: 'Tamil Nadu',
      bio: 'Mobile application developer with 12+ published apps on App Store and Google Play using Flutter and React Native.',
      hourlyRate: 50,
      yearsExp: 4,
      aiScore: 89,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      skills: ['Flutter', 'React Native', 'TypeScript', 'GraphQL', 'UI/UX Design (Figma)'],
    },
  ];

  const seededProfessionalMap: Record<string, string> = {
    'Pooja Verma': demoProfessional.id,
  };

  for (const prof of additionalProfessionals) {
    const profUser = await prisma.user.create({
      data: {
        email: prof.email,
        passwordHash: demoPasswordHash,
        name: prof.name,
        role: 'PROFESSIONAL',
        headline: prof.headline,
        location: prof.location,
        country: 'India',
        state: prof.state,
        city: prof.city,
        bio: prof.bio,
        avatarUrl: prof.avatarUrl,
        isVerified: true,
        profile: {
          create: {
            title: prof.headline,
            hourlyRate: prof.hourlyRate,
            yearsOfExperience: prof.yearsExp,
            aiScore: prof.aiScore,
            careerGoal: prof.headline,
            targetRole: prof.headline,
            experienceLevel: 'Advanced',
            isOnboarded: true,
          },
        },
      },
    });
    seededProfessionalMap[prof.name] = profUser.id;
    await assignSkillsToUser(profUser.id, prof.skills);

    // Seed Projects and Certifications for Freelancers
    if (prof.name === 'Ananya Iyer') {
      await prisma.project.createMany({
        data: [
          {
            userId: profUser.id,
            title: 'Enterprise Core Banking Microservices Architecture',
            description: 'Fault-tolerant distributed microservices built with Java 21, Spring Boot 3, and PostgreSQL processing 25,000 tx/sec.',
            skillsUsed: 'Java, Spring Boot, PostgreSQL, Docker, System Design',
            projectUrl: 'https://github.com/ananyaiyer/core-banking',
          },
          {
            userId: profUser.id,
            title: 'High-Throughput Distributed Payment Gateway',
            description: 'Event-driven payment processing engine with Apache Kafka and Redis distributed locks.',
            skillsUsed: 'Java, Spring Boot, Kafka, Redis, PostgreSQL',
            projectUrl: 'https://github.com/ananyaiyer/payment-gateway',
          },
        ],
      });
      await prisma.certification.createMany({
        data: [
          {
            userId: profUser.id,
            title: 'Oracle Certified Professional: Java SE 17/21 Developer',
            issuer: 'Oracle Corporation',
            issueDate: new Date('2023-08-15'),
            credentialUrl: 'https://oracle.com/certs/ananya-iyer',
          },
          {
            userId: profUser.id,
            title: 'Spring Certified Enterprise Integration Specialist',
            issuer: 'VMware Spring Academy',
            issueDate: new Date('2024-02-10'),
            credentialUrl: 'https://spring.io/certs/ananya-iyer',
          },
        ],
      });
    } else if (prof.name === 'Rahul Mehta') {
      await prisma.project.create({
        data: {
          userId: profUser.id,
          title: 'Real-Time Collaborative Code Editor & Workspace',
          description: 'Full stack real-time developer workspace with Next.js 15, WebSockets, and PostgreSQL.',
          skillsUsed: 'React, Next.js, TypeScript, Node.js, PostgreSQL, Docker',
          projectUrl: 'https://github.com/rahulmehta/collab-code',
        },
      });
      await prisma.certification.create({
        data: {
          userId: profUser.id,
          title: 'AWS Certified Solutions Architect – Associate',
          issuer: 'Amazon Web Services',
          issueDate: new Date('2024-01-20'),
          credentialUrl: 'https://aws.amazon.com/verification',
        },
      });
    } else if (prof.name === 'Siddharth Nair') {
      await prisma.project.create({
        data: {
          userId: profUser.id,
          title: 'Multi-Cloud Kubernetes Deployment Automation Pipeline',
          description: 'Automated Terraform and GitHub Actions pipeline provisioning AWS EKS clusters with zero downtime.',
          skillsUsed: 'Docker, Kubernetes, AWS, CI/CD Pipelines, Terraform',
          projectUrl: 'https://github.com/siddharthnair/k8s-automation',
        },
      });
      await prisma.certification.create({
        data: {
          userId: profUser.id,
          title: 'Certified Kubernetes Administrator (CKA)',
          issuer: 'Cloud Native Computing Foundation (CNCF)',
          issueDate: new Date('2024-03-01'),
          credentialUrl: 'https://cncf.io/verify/cka',
        },
      });
    } else if (prof.name === 'Meera Joshi') {
      await prisma.project.create({
        data: {
          userId: profUser.id,
          title: 'Enterprise Document Intelligence & RAG Chatbot',
          description: 'Production vector search pipeline using LangChain, PostgreSQL pgvector, and async FastAPI.',
          skillsUsed: 'Python, LangChain & RAG, LLM Engineering, PostgreSQL, FastAPI',
          projectUrl: 'https://github.com/meerajoshi/doc-rag',
        },
      });
      await prisma.certification.create({
        data: {
          userId: profUser.id,
          title: 'DeepLearning.AI LangChain & Generative AI Specialist',
          issuer: 'DeepLearning.AI',
          issueDate: new Date('2024-04-15'),
          credentialUrl: 'https://deeplearning.ai/verify',
        },
      });
    }

    // Ingest professional into pgvector chunks for semantic RAG search
    await insertChunk(
      `Professional Profile: ${prof.name}\nHeadline: ${prof.headline}\nLocation: ${prof.location}\nHourly Rate: $${prof.hourlyRate}/hr\nExperience: ${prof.yearsExp} years\nSkills: ${prof.skills.join(', ')}\nBio: ${prof.bio}`,
      `Professional: ${prof.name}`,
      'professional',
      { userId: profUser.id, name: prof.name, skills: prof.skills, hourlyRate: prof.hourlyRate }
    );
  }

  // Seed Projects & Certifications for Demo Professional Pooja Verma
  await prisma.project.createMany({
    data: [
      {
        userId: demoProfessional.id,
        title: 'Cross-Platform FinTech Mobile Banking SuperApp',
        description: 'Native performance mobile app built with Flutter and React Native with 500k+ active downloads.',
        skillsUsed: 'Flutter, React Native, TypeScript, Firebase, GraphQL',
        projectUrl: 'https://pooja-verma.dev/projects/fintech',
      },
      {
        userId: demoProfessional.id,
        title: 'Full Stack SaaS Analytics & Dashboard Platform',
        description: 'Modern Next.js 15 App Router web application with PostgreSQL persistence and real-time charts.',
        skillsUsed: 'Next.js, React, TypeScript, PostgreSQL, Tailwind CSS',
        projectUrl: 'https://pooja-verma.dev/projects/saas-analytics',
      },
    ],
  });
  await prisma.certification.createMany({
    data: [
      {
        userId: demoProfessional.id,
        title: 'Meta Certified React Native & Mobile Specialist',
        issuer: 'Meta',
        issueDate: new Date('2023-11-10'),
        credentialUrl: 'https://meta.com/certs/pooja-verma',
      },
      {
        userId: demoProfessional.id,
        title: 'AWS Certified Cloud Practitioner',
        issuer: 'Amazon Web Services',
        issueDate: new Date('2023-05-22'),
        credentialUrl: 'https://aws.amazon.com/verify',
      },
    ],
  });

  // 4. Seed 10 Realistic Companies
  const companiesData = [
    {
      name: 'NovaTech Solutions',
      email: 'careers@novatech-solutions.io',
      city: 'Bangalore',
      state: 'Karnataka',
      industry: 'Enterprise Cloud & FinTech Platforms',
      size: '250-500 Employees',
      website: 'https://novatech-solutions.io',
      headline: 'Next-Generation Distributed Cloud & Financial Systems',
      bio: 'Leading innovator building high-throughput microservices, banking APIs, and scalable distributed data platforms.',
      avatarUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'PixelForge Labs',
      email: 'talent@pixelforgelabs.dev',
      city: 'Chennai',
      state: 'Tamil Nadu',
      industry: 'Modern Web Applications & Design Systems',
      size: '50-100 Employees',
      website: 'https://pixelforgelabs.dev',
      headline: 'Next.js, UI/UX Design Systems & High-Conversion Digital Products',
      bio: 'Digital product studio crafting accessible design systems, real-time collaboration tools, and modern web platforms.',
      avatarUrl: 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'CloudVista Systems',
      email: 'hiring@cloudvistasystems.com',
      city: 'Hyderabad',
      state: 'Telangana',
      industry: 'Cloud Infrastructure & SRE Automation',
      size: '100-250 Employees',
      website: 'https://cloudvistasystems.com',
      headline: 'Multi-Cloud Architecture, Kubernetes Orchestration & SRE Consulting',
      bio: 'Empowering enterprises to scale reliably with automated CI/CD pipelines, Kubernetes clusters, and zero-trust cloud security.',
      avatarUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'DataSphere Analytics',
      email: 'careers@datasphere-analytics.io',
      city: 'Pune',
      state: 'Maharashtra',
      industry: 'High-Volume Data Engineering & Business Intelligence',
      size: '100-250 Employees',
      website: 'https://datasphere-analytics.io',
      headline: 'Real-time Telemetry, Data Warehousing & PostgreSQL Optimization',
      bio: 'Building mission-critical data pipelines, real-time analytics dashboards, and optimized PostgreSQL architectures.',
      avatarUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'HyperScale Networks',
      email: 'team@hyperscalenetworks.net',
      city: 'Mumbai',
      state: 'Maharashtra',
      industry: 'Distributed Networking & High-Throughput Infrastructure',
      size: '500-1000 Employees',
      website: 'https://hyperscalenetworks.net',
      headline: 'Low-Latency Event Streaming & High-Availability Network Backends',
      bio: 'Developing resilient distributed networking hardware and high-throughput Apache Kafka streaming engines.',
      avatarUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'NextWave Digital',
      email: 'careers@nextwavedigital.co',
      city: 'Bangalore',
      state: 'Karnataka',
      industry: 'Full Stack Digital Products & SaaS Accelerators',
      size: '50-100 Employees',
      website: 'https://nextwavedigital.co',
      headline: 'Modern React 19, TypeScript & Cloud Native SaaS Platforms',
      bio: 'Engineering scalable full-stack applications with high reliability, test-driven development, and clean architecture.',
      avatarUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'QuantumLeap Innovations',
      email: 'join@quantumleap-tech.io',
      city: 'Chennai',
      state: 'Tamil Nadu',
      industry: 'Event-Driven Microservices & Real-time Telemetry',
      size: '100-250 Employees',
      website: 'https://quantumleap-tech.io',
      headline: 'Golang, Distributed Transactions & Microservices Innovation',
      bio: 'Engineering high-concurrency microservices, gRPC backends, and distributed streaming engines.',
      avatarUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'Synthetix AI',
      email: 'careers@synthetix-ai.org',
      city: 'Bangalore',
      state: 'Karnataka',
      industry: 'Enterprise Large Language Models & Vector Search',
      size: '50-100 Employees',
      website: 'https://synthetix-ai.org',
      headline: 'Production RAG Architectures, Vector Databases & LLM Agents',
      bio: 'Pioneering production-grade AI search, vector embeddings, and LangChain orchestration for enterprise software.',
      avatarUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'ZenPulse Technologies',
      email: 'talent@zenpulse.tech',
      city: 'Hyderabad',
      state: 'Telangana',
      industry: 'HealthTech Software & Intelligent Care Platforms',
      size: '100-250 Employees',
      website: 'https://zenpulse.tech',
      headline: 'Secure Medical Data Systems & Asynchronous FastAPI Backends',
      bio: 'Creating HIPAA-compliant medical software, real-time diagnostic telemetry, and secure cloud storage.',
      avatarUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=150&auto=format&fit=crop&q=80',
    },
    {
      name: 'UrbanByte Systems',
      email: 'careers@urbanbyte.in',
      city: 'Chennai',
      state: 'Tamil Nadu',
      industry: 'Smart Mobility & Cross-Platform Mobile Solutions',
      size: '50-100 Employees',
      website: 'https://urbanbyte.in',
      headline: 'Cross-Platform Mobile Apps with Flutter & React Native',
      bio: 'Connecting millions of urban commuters with high-performance mobile apps, geolocation tracking, and instant payments.',
      avatarUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=150&auto=format&fit=crop&q=80',
    },
  ];

  const companyUserIds: Record<string, string> = {};
  for (const c of companiesData) {
    const user = await prisma.user.create({
      data: {
        email: c.email,
        passwordHash: demoPasswordHash,
        name: c.name,
        role: 'EMPLOYER',
        headline: c.headline,
        location: `${c.city}, ${c.state}, India`,
        country: 'India',
        state: c.state,
        city: c.city,
        bio: c.bio,
        avatarUrl: c.avatarUrl,
        isVerified: true,
        profile: {
          create: {
            title: c.industry,
            companyName: c.name,
            companyIndustry: c.industry,
            companyWebsite: c.website,
            companySize: c.size,
          },
        },
      },
    });
    companyUserIds[c.name] = user.id;
  }
  console.log(`✅ Seeded ${companiesData.length} realistic tech companies.`);

  // 5. Seed 12 Indian Mentors
  const mentorsData = [
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      title: 'Senior Backend Engineer',
      company: 'NovaTech Solutions',
      city: 'Bangalore',
      state: 'Karnataka',
      expertise: 'Java, Spring Boot, PostgreSQL, Microservices, System Design',
      hourlyRate: 65,
      yearsExperience: 8,
      rating: 4.95,
      studentsCount: 142,
      sessionCount: 280,
      bio: 'Senior backend architect with 8+ years designing fault-tolerant microservices, high-concurrency message queues, and enterprise SQL databases in FinTech.',
      linkedin: 'https://linkedin.com/in/priya-sharma-backend',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      availability: 'Weekdays 7 PM - 10 PM IST, Weekends Flexible',
    },
    {
      name: 'Arjun Nair',
      email: 'arjun.nair@example.com',
      title: 'Principal Cloud Architect',
      company: 'CloudVista Systems',
      city: 'Hyderabad',
      state: 'Telangana',
      expertise: 'AWS, Docker, Kubernetes, Terraform, CI/CD Pipelines',
      hourlyRate: 85,
      yearsExperience: 11,
      rating: 4.98,
      studentsCount: 195,
      sessionCount: 360,
      bio: 'Certified AWS Solutions Architect with over a decade of experience designing scalable multi-region cloud infrastructures, Kubernetes orchestration, and automated DevOps pipelines.',
      linkedin: 'https://linkedin.com/in/arjun-nair-cloud',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      availability: 'Weekdays 6 PM - 9 PM IST, Saturday Mornings',
    },
    {
      name: 'Sneha Iyer',
      email: 'sneha.iyer@example.com',
      title: 'Lead Data Scientist & AI Engineer',
      company: 'Synthetix AI',
      city: 'Bangalore',
      state: 'Karnataka',
      expertise: 'Python, Machine Learning, Deep Learning, PyTorch, LangChain & RAG',
      hourlyRate: 75,
      yearsExperience: 7,
      rating: 4.92,
      studentsCount: 128,
      sessionCount: 220,
      bio: 'Specializing in modern Large Language Model pipelines, vector database architectures, Retrieval-Augmented Generation, and PyTorch deep neural networks.',
      linkedin: 'https://linkedin.com/in/sneha-iyer-ai',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      availability: 'Tuesday, Thursday & Saturday Evenings',
    },
    {
      name: 'Vikram Patel',
      email: 'vikram.patel@example.com',
      title: 'Senior Full Stack Architect',
      company: 'PixelForge Labs',
      city: 'Chennai',
      state: 'Tamil Nadu',
      expertise: 'React, Next.js, TypeScript, Node.js, Tailwind CSS',
      hourlyRate: 60,
      yearsExperience: 8,
      rating: 4.90,
      studentsCount: 110,
      sessionCount: 190,
      bio: 'Full-stack engineer passionate about React Server Components, high-performance web applications, and resilient Node.js backends.',
      linkedin: 'https://linkedin.com/in/vikram-patel-fullstack',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      availability: 'Weekdays 7 PM - 10 PM IST',
    },
    {
      name: 'Ananya Deshmukh',
      email: 'ananya.deshmukh@example.com',
      title: 'Staff Frontend Engineer & Design Systems Lead',
      company: 'NextWave Digital',
      city: 'Mumbai',
      state: 'Maharashtra',
      expertise: 'React, TypeScript, UI/UX Design (Figma), Next.js, Tailwind CSS',
      hourlyRate: 55,
      yearsExperience: 6,
      rating: 4.88,
      studentsCount: 95,
      sessionCount: 165,
      bio: 'Focused on creating accessible, scalable UI/UX token systems, motion animations, and enterprise frontend codebases with Next.js and Figma.',
      linkedin: 'https://linkedin.com/in/ananya-deshmukh-frontend',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      availability: 'Monday to Friday 6 PM - 9 PM IST',
    },
    {
      name: 'Karthik Raja',
      email: 'karthik.raja@example.com',
      title: 'Principal Database & Storage Architect',
      company: 'DataSphere Analytics',
      city: 'Chennai',
      state: 'Tamil Nadu',
      expertise: 'PostgreSQL, Redis, MongoDB, System Design, Database & Architecture',
      hourlyRate: 80,
      yearsExperience: 10,
      rating: 4.96,
      studentsCount: 160,
      sessionCount: 310,
      bio: 'Database performance specialist with deep expertise in B-tree indexing, query plan optimization, sharding, and high-throughput Redis caching.',
      linkedin: 'https://linkedin.com/in/karthik-raja-db',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      availability: 'Weekends 10 AM - 6 PM IST',
    },
    {
      name: 'Rohan Gupta',
      email: 'rohan.gupta@example.com',
      title: 'Lead Site Reliability Engineer & DevOps Coach',
      company: 'HyperScale Networks',
      city: 'Pune',
      state: 'Maharashtra',
      expertise: 'Kubernetes, Docker, CI/CD Pipelines, Google Cloud Platform, AWS',
      hourlyRate: 70,
      yearsExperience: 9,
      rating: 4.91,
      studentsCount: 120,
      sessionCount: 210,
      bio: 'SRE leader experienced in zero-downtime deployments, observability metrics, Kubernetes cluster management, and incident response automation.',
      linkedin: 'https://linkedin.com/in/rohan-gupta-sre',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      availability: 'Weekdays 8 PM - 10 PM IST',
    },
    {
      name: 'Pooja Verma',
      email: 'pooja.verma@example.com',
      title: 'Senior Mobile Solutions Architect',
      company: 'UrbanByte Systems',
      city: 'Bangalore',
      state: 'Karnataka',
      expertise: 'Flutter, React Native, Mobile Development, TypeScript, GraphQL',
      hourlyRate: 60,
      yearsExperience: 7,
      rating: 4.89,
      studentsCount: 105,
      sessionCount: 180,
      bio: 'Built and published over 15+ cross-platform mobile apps on Google Play and Apple App Store using Flutter and React Native.',
      linkedin: 'https://linkedin.com/in/pooja-verma-mobile',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      availability: 'Wednesday & Friday Evenings, Saturday Afternoons',
    },
    {
      name: 'Aditya Roy',
      email: 'aditya.roy@example.com',
      title: 'Distributed Systems & Go Backend Engineer',
      company: 'QuantumLeap Innovations',
      city: 'Kolkata',
      state: 'West Bengal',
      expertise: 'Go (Golang), Kafka, Microservices, PostgreSQL, System Design',
      hourlyRate: 75,
      yearsExperience: 8,
      rating: 4.93,
      studentsCount: 130,
      sessionCount: 240,
      bio: 'Architecting low-latency Go microservices and event-driven data streaming pipelines with Apache Kafka and PostgreSQL.',
      linkedin: 'https://linkedin.com/in/aditya-roy-golang',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      availability: 'Weekdays 7 PM - 10 PM IST',
    },
    {
      name: 'Neha Kulkarni',
      email: 'neha.kulkarni@example.com',
      title: 'Senior AI Application Engineer',
      company: 'ZenPulse Technologies',
      city: 'Pune',
      state: 'Maharashtra',
      expertise: 'LLM Engineering, LangChain & RAG, Python, FastAPI, TypeScript',
      hourlyRate: 70,
      yearsExperience: 6,
      rating: 4.94,
      studentsCount: 115,
      sessionCount: 205,
      bio: 'Hands-on practitioner designing enterprise generative AI copilots, custom RAG indexing pipelines, and high-speed async FastAPI backends.',
      linkedin: 'https://linkedin.com/in/neha-kulkarni-ai',
      avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
      availability: 'Monday, Wednesday & Saturday Evenings',
    },
    {
      name: 'Suresh Menon',
      email: 'suresh.menon@example.com',
      title: 'Cybersecurity & Cloud Defense Architect',
      company: 'NovaTech Solutions',
      city: 'Kochi',
      state: 'Kerala',
      expertise: 'Cybersecurity, Spring Security, System Design, Docker, AWS',
      hourlyRate: 80,
      yearsExperience: 10,
      rating: 4.92,
      studentsCount: 140,
      sessionCount: 260,
      bio: 'Security consultant helping startups and enterprises audit OWASP Top 10 vulnerabilities, configure OAuth2/OIDC, and implement zero-trust architectures.',
      linkedin: 'https://linkedin.com/in/suresh-menon-security',
      avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
      availability: 'Weekdays 6 PM - 9 PM IST',
    },
    {
      name: 'Divya Krishnan',
      email: 'divya.krishnan@example.com',
      title: 'Machine Learning & NLP Research Engineer',
      company: 'Synthetix AI',
      city: 'Chennai',
      state: 'Tamil Nadu',
      expertise: 'Machine Learning, Deep Learning, Python, PyTorch, LangChain & RAG',
      hourlyRate: 75,
      yearsExperience: 7,
      rating: 4.95,
      studentsCount: 125,
      sessionCount: 230,
      bio: 'NLP and ML engineer specializing in text embedding spaces, semantic search algorithms, transformer fine-tuning, and model quantization.',
      linkedin: 'https://linkedin.com/in/divya-krishnan-nlp',
      avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
      availability: 'Weekdays 7 PM - 10 PM IST, Weekends Flexible',
    },
  ];

  const mentorUserIds: Record<string, string> = {};
  for (const m of mentorsData) {
    const user = await prisma.user.create({
      data: {
        email: m.email,
        passwordHash: demoPasswordHash,
        name: m.name,
        role: 'MENTOR',
        headline: `${m.title} @ ${m.company} (${m.yearsExperience}+ Yrs Exp)`,
        location: `${m.city}, ${m.state}, India`,
        country: 'India',
        state: m.state,
        city: m.city,
        bio: m.bio,
        avatarUrl: m.avatarUrl,
        isVerified: true,
        profile: {
          create: {
            title: m.title,
            yearsOfExperience: m.yearsExperience,
            hourlyRate: m.hourlyRate,
            aiScore: 96,
            githubUrl: `https://github.com/${m.name.toLowerCase().replace(/\s+/g, '')}`,
            linkedinUrl: m.linkedin,
          },
        },
        mentorProfile: {
          create: {
            hourlyRate: m.hourlyRate,
            bio: m.bio,
            expertise: m.expertise,
            yearsExperience: m.yearsExperience,
            company: m.company,
            title: m.title,
            rating: m.rating,
            studentsCount: m.studentsCount,
            sessionCount: m.sessionCount,
            isAvailable: true,
            availability: m.availability,
          },
        },
      },
    });
    mentorUserIds[m.name] = user.id;
    await assignSkillsToUser(user.id, m.expertise.split(',').map((s) => s.trim()));

    // Ingest mentor profile into pgvector
    await insertChunk(
      `Mentor Profile: ${m.name}\nTitle: ${m.title} at ${m.company}\nLocation: ${m.city}, ${m.state}, India\nExpertise: ${m.expertise}\nHourly Rate: $${m.hourlyRate}/hr\nRating: ${m.rating} ⭐\nExperience: ${m.yearsExperience} years\nBio: ${m.bio}\nAvailability: ${m.availability}`,
      `Mentor: ${m.name}`,
      'mentor',
      { mentorId: user.id, name: m.name, expertise: m.expertise, hourlyRate: m.hourlyRate }
    );
  }
  console.log(`✅ Seeded ${mentorsData.length} Indian mentors with pgvector chunk embeddings.`);

  // 6. Seed 20 Real Technical Courses
  const coursesData = [
    {
      mentorName: 'Priya Sharma',
      title: 'Core Java 21 for Beginners: OOP, Collections & Problem Solving',
      slug: 'core-java-21-beginners-oop',
      description: 'Start programming in Java from scratch: variables, primitive data types, control flow, Object-Oriented Programming (OOP 4 pillars), exception handling, and Java Collections Framework.',
      category: 'Backend',
      level: 'BEGINNER',
      price: 29.99,
      durationHours: 20,
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'Java, Core Java OOP, Problem Solving, Data Structures',
      rating: 4.96,
      reviewsCount: 220,
    },
    {
      mentorName: 'Priya Sharma',
      title: 'Spring Boot 3 & RESTful Web APIs: Zero to Hero for Beginners',
      slug: 'spring-boot-3-rest-apis-zero-to-hero',
      description: 'Build your first web backend with Spring Boot 3: Dependency Injection, Spring MVC, REST Controllers, request validation, and connecting PostgreSQL with Spring Data JPA.',
      category: 'Backend',
      level: 'BEGINNER',
      price: 39.99,
      durationHours: 18,
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'Java, Spring Boot, REST APIs, PostgreSQL',
      rating: 4.93,
      reviewsCount: 165,
    },
    {
      mentorName: 'Priya Sharma',
      title: 'Spring Boot 3 & Enterprise Microservices Architecture',
      slug: 'spring-boot-3-microservices',
      description: 'Master production-ready backend architecture using Java 21, Spring Boot 3, Spring Security, Docker, and Kafka.',
      category: 'Backend',
      level: 'INTERMEDIATE',
      price: 49.99,
      durationHours: 24,
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'Java, Spring Boot, System Design, PostgreSQL, Docker',
      rating: 4.95,
      reviewsCount: 142,
    },
    {
      mentorName: 'Vikram Patel',
      title: 'Next.js 15 & Generative AI Applications Masterclass',
      slug: 'nextjs-15-generative-ai',
      description: 'Build full-stack AI SaaS applications with Next.js App Router, Server Actions, Tailwind CSS, and LangChain.',
      category: 'Full Stack',
      level: 'ADVANCED',
      price: 59.99,
      durationHours: 18,
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'Next.js, React, TypeScript, LLM Engineering, Tailwind CSS',
      rating: 4.96,
      reviewsCount: 168,
    },
    {
      mentorName: 'Karthik Raja',
      title: 'PostgreSQL & Relational Database Query Optimization',
      slug: 'postgresql-database-optimization',
      description: 'From schema normalization to B-tree indexing strategies, query execution plans, and high-concurrency scaling.',
      category: 'Database & Architecture',
      level: 'INTERMEDIATE',
      price: 39.99,
      durationHours: 12,
      thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'PostgreSQL, Redis, System Design, Database & Architecture',
      rating: 4.92,
      reviewsCount: 94,
    },
    {
      mentorName: 'Vikram Patel',
      title: 'Full Stack TypeScript: From Zero to Production',
      slug: 'fullstack-typescript-zero-to-production',
      description: 'End-to-end type safety from database schemas to client components with Next.js, Prisma, and Zod.',
      category: 'Full Stack',
      level: 'BEGINNER',
      price: 29.99,
      durationHours: 16,
      thumbnail: 'https://images.unsplash.com/photo-1516116211227-bbc1552a4e92?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'TypeScript, React, Node.js, Next.js',
      rating: 4.88,
      reviewsCount: 76,
    },
    {
      mentorName: 'Priya Sharma',
      title: 'System Design & Distributed Systems for Senior Engineers',
      slug: 'system-design-distributed-systems',
      description: 'Ace technical system design interviews: Caching, Sharding, Eventual Consistency, CAP Theorem, and Microservices.',
      category: 'Database & Architecture',
      level: 'ADVANCED',
      price: 79.99,
      durationHours: 20,
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'System Design, Kubernetes, AWS, PostgreSQL',
      rating: 4.98,
      reviewsCount: 210,
    },
    {
      mentorName: 'Sneha Iyer',
      title: 'Python for Machine Learning & Deep Learning with PyTorch',
      slug: 'python-machine-learning-pytorch',
      description: 'Hands-on practical machine learning: vectorized data wrangling with NumPy/Pandas, Scikit-Learn pipelines, and PyTorch deep neural networks.',
      category: 'AI / Machine Learning',
      level: 'INTERMEDIATE',
      price: 54.99,
      durationHours: 22,
      thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'Python, Machine Learning, Deep Learning, PyTorch',
      rating: 4.94,
      reviewsCount: 135,
    },
    {
      mentorName: 'Divya Krishnan',
      title: 'Production Generative AI: LangChain, pgvector & RAG Pipelines',
      slug: 'generative-ai-rag-langchain',
      description: 'Architect resilient enterprise RAG systems with vector embeddings, semantic search, PostgreSQL pgvector, and autonomous agent chains.',
      category: 'AI / Machine Learning',
      level: 'ADVANCED',
      price: 69.99,
      durationHours: 19,
      thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'LangChain & RAG, LLM Engineering, Python, PostgreSQL',
      rating: 4.97,
      reviewsCount: 180,
    },
    {
      mentorName: 'Arjun Nair',
      title: 'Docker, Kubernetes & AWS Cloud DevOps Pipeline Mastery',
      slug: 'docker-kubernetes-aws-devops',
      description: 'Deploy resilient containerized workloads with Docker multi-stage builds, Kubernetes Helm charts, AWS EKS, and automated GitHub Actions.',
      category: 'DevOps & Cloud',
      level: 'INTERMEDIATE',
      price: 64.99,
      durationHours: 26,
      thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'Docker, Kubernetes, AWS, CI/CD Pipelines',
      rating: 4.93,
      reviewsCount: 122,
    },
    {
      mentorName: 'Ananya Deshmukh',
      title: 'Modern React 19 & Next.js App Router Architecture',
      slug: 'modern-react-19-nextjs-architecture',
      description: 'Master React Server Components, Server Actions, suspense boundaries, custom hooks, and Tailwind CSS design systems.',
      category: 'Frontend',
      level: 'INTERMEDIATE',
      price: 44.99,
      durationHours: 15,
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'React, Next.js, TypeScript, Tailwind CSS',
      rating: 4.91,
      reviewsCount: 155,
    },
    {
      mentorName: 'Priya Sharma',
      title: 'Enterprise Java 21 & High-Performance Concurrency',
      slug: 'enterprise-java-21-concurrency',
      description: 'Deep dive into Java 21 Virtual Threads, Project Loom, memory models, garbage collection tuning, and lock-free data structures.',
      category: 'Backend',
      level: 'ADVANCED',
      price: 59.99,
      durationHours: 18,
      thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'Java, Spring Boot, System Design, PostgreSQL',
      rating: 4.90,
      reviewsCount: 88,
    },
    {
      mentorName: 'Neha Kulkarni',
      title: 'FastAPI & Python Microservices: High-Throughput Async APIs',
      slug: 'fastapi-python-async-microservices',
      description: 'Build asynchronous microservices with FastAPI, Pydantic v2, SQLAlchemy 2.0, Redis caching, and Docker containerization.',
      category: 'Backend',
      level: 'INTERMEDIATE',
      price: 39.99,
      durationHours: 14,
      thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'Python, FastAPI, Redis, Docker, PostgreSQL',
      rating: 4.89,
      reviewsCount: 72,
    },
    {
      mentorName: 'Pooja Verma',
      title: 'Mobile App Development with Flutter & Dart: Zero to App Store',
      slug: 'flutter-dart-mobile-development',
      description: 'Build cross-platform iOS and Android mobile apps from a single codebase with Flutter, Dart, Riverpod state management, and Firebase.',
      category: 'Mobile Development',
      level: 'BEGINNER',
      price: 49.99,
      durationHours: 21,
      thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'Flutter, Mobile Development, Firebase',
      rating: 4.92,
      reviewsCount: 110,
    },
    {
      mentorName: 'Pooja Verma',
      title: 'Cross-Platform Mobile Apps with React Native & Expo Router',
      slug: 'react-native-expo-mastery',
      description: 'Develop performant native mobile applications using React Native, TypeScript, Expo Router, and native device hardware APIs.',
      category: 'Mobile Development',
      level: 'INTERMEDIATE',
      price: 45.99,
      durationHours: 17,
      thumbnail: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'React Native, TypeScript, Mobile Development, React',
      rating: 4.88,
      reviewsCount: 94,
    },
    {
      mentorName: 'Suresh Menon',
      title: 'Cybersecurity, OAuth2 & Zero-Trust API Defense',
      slug: 'cybersecurity-oauth2-api-defense',
      description: 'Protect modern web applications against OWASP Top 10 vulnerabilities, implement OAuth2/OIDC, and audit JWT tokens.',
      category: 'Backend',
      level: 'ADVANCED',
      price: 54.99,
      durationHours: 16,
      thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'Cybersecurity, Spring Security, System Design',
      rating: 4.95,
      reviewsCount: 98,
    },
    {
      mentorName: 'Ananya Deshmukh',
      title: 'Advanced UI/UX Design System with Figma & Tailwind CSS',
      slug: 'ui-ux-design-system-figma-tailwind',
      description: 'Design comprehensive UI/UX token design systems in Figma, structure design handoffs, and implement in Tailwind CSS.',
      category: 'UI/UX Design',
      level: 'BEGINNER',
      price: 34.99,
      durationHours: 13,
      thumbnail: 'https://images.unsplash.com/photo-1581291518655-9523c932edcf?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'UI/UX Design (Figma), Tailwind CSS, React',
      rating: 4.96,
      reviewsCount: 130,
    },
    {
      mentorName: 'Aditya Roy',
      title: 'Golang Microservices & Distributed Event Systems with Kafka',
      slug: 'golang-microservices-kafka',
      description: 'Build ultra-fast backend microservices in Go (Golang), implement gRPC communication, and process high-volume Kafka streaming pipelines.',
      category: 'Backend',
      level: 'ADVANCED',
      price: 64.99,
      durationHours: 20,
      thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'Go (Golang), System Design, Docker, PostgreSQL',
      rating: 4.94,
      reviewsCount: 104,
    },
    {
      mentorName: 'Karthik Raja',
      title: 'Redis Caching Strategies & Low-Latency In-Memory Storage',
      slug: 'redis-caching-strategies',
      description: 'Master Redis data structures, distributed locking with Redlock, pub/sub messaging, and caching strategies for high-load systems.',
      category: 'Database & Architecture',
      level: 'INTERMEDIATE',
      price: 39.99,
      durationHours: 10,
      thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'Redis, System Design, PostgreSQL',
      rating: 4.91,
      reviewsCount: 68,
    },
    {
      mentorName: 'Rohan Gupta',
      title: 'Cloud Native CI/CD Pipelines with GitHub Actions & Terraform',
      slug: 'cicd-github-actions-terraform',
      description: 'Automate build, test, and zero-downtime deployment pipelines for microservices using Infrastructure as Code (IaC).',
      category: 'DevOps & Cloud',
      level: 'INTERMEDIATE',
      price: 49.99,
      durationHours: 15,
      thumbnail: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'CI/CD Pipelines, Docker, Kubernetes, AWS',
      rating: 4.90,
      reviewsCount: 82,
    },
    {
      mentorName: 'Vikram Patel',
      title: 'GraphQL API Architecture with Apollo Server & TypeScript',
      slug: 'graphql-api-architecture-apollo',
      description: 'Design type-safe, flexible, and performant GraphQL schemas, query resolvers, DataLoader batching, and subscriptions.',
      category: 'Backend',
      level: 'INTERMEDIATE',
      price: 44.99,
      durationHours: 14,
      thumbnail: 'https://images.unsplash.com/photo-1555066931-bf19f8fd1085?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'GraphQL, TypeScript, Node.js, PostgreSQL',
      rating: 4.87,
      reviewsCount: 64,
    },
    {
      mentorName: 'Priya Sharma',
      title: 'Practical Data Structures, Algorithms & Technical Interview Prep',
      slug: 'dsa-technical-interview-prep',
      description: 'Ace coding interviews with systematic pattern recognition in dynamic programming, graph traversal, and tree problems.',
      category: 'Backend',
      level: 'BEGINNER',
      price: 39.99,
      durationHours: 25,
      thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'Java, Python, System Design',
      rating: 4.97,
      reviewsCount: 240,
    },
  ];

  for (const c of coursesData) {
    const instructorId = mentorUserIds[c.mentorName] || demoProfessional.id;
    const course = await prisma.course.create({
      data: {
        instructorId,
        title: c.title,
        slug: c.slug,
        description: c.description,
        category: c.category,
        level: c.level,
        price: c.price,
        durationHours: c.durationHours,
        thumbnail: c.thumbnail,
        skillsCovered: c.skillsCovered,
        rating: c.rating,
        reviewsCount: c.reviewsCount,
        isPublished: true,
      },
    });

    // Create 3 standard modules with lessons
    const module1 = await prisma.courseModule.create({
      data: { courseId: course.id, title: 'Module 1: Architecture Foundations & Setup', orderIndex: 1 },
    });
    await prisma.lesson.createMany({
      data: [
        { moduleId: module1.id, title: '1.1 System Overview & Architecture Design', durationMinutes: 25, orderIndex: 1, content: `Introduction to ${c.title}. Covers architecture patterns, best practices, and project structure.` },
        { moduleId: module1.id, title: '1.2 Hands-On Setup & Core Implementation', durationMinutes: 30, orderIndex: 2, content: `Step-by-step coding lab and baseline implementation for ${c.title}.` },
      ],
    });

    const module2 = await prisma.courseModule.create({
      data: { courseId: course.id, title: 'Module 2: Advanced Integration & Testing', orderIndex: 2 },
    });
    await prisma.lesson.createMany({
      data: [
        { moduleId: module2.id, title: '2.1 Data Flow, API Contracts & Validation', durationMinutes: 35, orderIndex: 1, content: `Deep dive into data structures, validation schemas, and persistence strategies.` },
        { moduleId: module2.id, title: '2.2 Unit & Integration Testing Strategy', durationMinutes: 25, orderIndex: 2, content: `Comprehensive test suite design with automated regression tests.` },
      ],
    });

    const module3 = await prisma.courseModule.create({
      data: { courseId: course.id, title: 'Module 3: Production Deployment & Capstone', orderIndex: 3 },
    });
    await prisma.lesson.createMany({
      data: [
        { moduleId: module3.id, title: '3.1 Containerization & CI/CD Pipelines', durationMinutes: 30, orderIndex: 1, content: `Production packaging with Docker and automated delivery pipelines.` },
        { moduleId: module3.id, title: '3.2 End-to-End Capstone Project Review', durationMinutes: 45, orderIndex: 2, content: `Final architectural walkthrough, performance optimization, and certificate checklist.` },
      ],
    });

    // Ingest course into pgvector
    await insertChunk(
      `Course: ${c.title}\nCategory: ${c.category}\nLevel: ${c.level}\nInstructor: ${c.mentorName}\nPrice: $${c.price}\nDuration: ${c.durationHours} hours\nRating: ${c.rating} ⭐ (${c.reviewsCount} reviews)\nSkills Covered: ${c.skillsCovered}\nDescription: ${c.description}`,
      `Course: ${c.title}`,
      'course',
      { courseId: course.id, title: c.title, category: c.category, level: c.level, skills: c.skillsCovered }
    );
  }
  console.log(`✅ Seeded ${coursesData.length} technical courses with pgvector chunk embeddings.`);

  // 7. Seed 25 Industry Job Postings
  const jobsData = [
    {
      companyName: 'NovaTech Solutions',
      title: 'Senior Java & Spring Boot Backend Architect',
      description: 'Lead the design of high-throughput financial microservices, optimize PostgreSQL data queries, and guide cloud migration strategies.',
      country: 'India',
      state: 'Karnataka',
      city: 'Bangalore',
      locationType: 'HYBRID',
      jobType: 'FULL_TIME',
      minSalary: 28000,
      maxSalary: 42000,
      currency: 'USD',
      experienceLevel: 'SENIOR',
      isLocal: false,
      skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker', 'System Design'],
    },
    {
      companyName: 'PixelForge Labs',
      title: 'Next.js 15 & AI Web Application Engineer',
      description: 'Build responsive web client dashboards, integrate streaming LLM endpoints, and create polished user experiences with Next.js and TypeScript.',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Chennai',
      locationType: 'REMOTE',
      jobType: 'FREELANCE',
      minSalary: 4500,
      maxSalary: 7500,
      currency: 'USD',
      experienceLevel: 'MID',
      isLocal: false,
      skills: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'LLM Engineering'],
    },
    {
      companyName: 'DataSphere Analytics',
      title: 'PostgreSQL Database Performance Consultant',
      description: 'Short-term consulting gig to audit index health, optimize slow query execution plans, and configure connection pooling for an e-commerce platform.',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Chennai',
      locationType: 'ONSITE',
      jobType: 'CONTRACT',
      minSalary: 2000,
      maxSalary: 4000,
      currency: 'USD',
      experienceLevel: 'SENIOR',
      isLocal: true,
      skills: ['PostgreSQL', 'Redis', 'System Design'],
    },
    {
      companyName: 'NextWave Digital',
      title: 'Junior Full Stack Developer (Internship to Hire)',
      description: 'Great entry-level opportunity for ambitious graduates skilled in React, Node.js, and SQL. Direct mentorship from senior architects.',
      country: 'India',
      state: 'Karnataka',
      city: 'Bangalore',
      locationType: 'HYBRID',
      jobType: 'INTERNSHIP',
      minSalary: 800,
      maxSalary: 1500,
      currency: 'USD',
      experienceLevel: 'ENTRY',
      isLocal: true,
      skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
    },
    {
      companyName: 'CloudVista Systems',
      title: 'Cloud DevOps & AWS Infrastructure Engineer',
      description: 'Setup automated deployment pipelines using GitHub Actions, containerize microservices with Docker, and manage Kubernetes clusters on AWS.',
      country: 'India',
      state: 'Telangana',
      city: 'Hyderabad',
      locationType: 'REMOTE',
      jobType: 'CONTRACT',
      minSalary: 5000,
      maxSalary: 8500,
      currency: 'USD',
      experienceLevel: 'MID',
      isLocal: false,
      skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD Pipelines'],
    },
    {
      companyName: 'Synthetix AI',
      title: 'Generative AI & RAG Pipeline Engineer',
      description: 'Design and deploy production vector search systems, implement chunking pipelines, and fine-tune prompt templates with LangChain and pgvector.',
      country: 'India',
      state: 'Karnataka',
      city: 'Bangalore',
      locationType: 'HYBRID',
      jobType: 'FULL_TIME',
      minSalary: 32000,
      maxSalary: 48000,
      currency: 'USD',
      experienceLevel: 'SENIOR',
      isLocal: false,
      skills: ['LangChain & RAG', 'Python', 'LLM Engineering', 'PostgreSQL', 'FastAPI'],
    },
    {
      companyName: 'QuantumLeap Innovations',
      title: 'Golang Distributed Microservices Developer',
      description: 'Build ultra low-latency microservices, write gRPC handlers, and process real-time streaming data with Apache Kafka and PostgreSQL.',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Chennai',
      locationType: 'REMOTE',
      jobType: 'FULL_TIME',
      minSalary: 26000,
      maxSalary: 40000,
      currency: 'USD',
      experienceLevel: 'MID',
      isLocal: false,
      skills: ['Go (Golang)', 'PostgreSQL', 'System Design', 'Docker'],
    },
    {
      companyName: 'UrbanByte Systems',
      title: 'Senior Flutter Mobile App Developer',
      description: 'Architect cross-platform mobile apps for iOS and Android with Flutter, Riverpod, clean architecture, and Firebase push notifications.',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Chennai',
      locationType: 'HYBRID',
      jobType: 'FULL_TIME',
      minSalary: 22000,
      maxSalary: 34000,
      currency: 'USD',
      experienceLevel: 'SENIOR',
      isLocal: true,
      skills: ['Flutter', 'Mobile Development', 'TypeScript', 'GraphQL'],
    },
    {
      companyName: 'HyperScale Networks',
      title: 'Kubernetes Cluster & Site Reliability Engineer',
      description: 'Maintain 99.99% uptime across production Kubernetes clusters, configure Prometheus/Grafana alerts, and automate zero-downtime rollouts.',
      country: 'India',
      state: 'Maharashtra',
      city: 'Pune',
      locationType: 'REMOTE',
      jobType: 'FULL_TIME',
      minSalary: 30000,
      maxSalary: 45000,
      currency: 'USD',
      experienceLevel: 'SENIOR',
      isLocal: false,
      skills: ['Kubernetes', 'Docker', 'CI/CD Pipelines', 'AWS'],
    },
    {
      companyName: 'ZenPulse Technologies',
      title: 'FastAPI & Async Python Backend Specialist',
      description: 'Develop high-throughput RESTful endpoints and medical telemetry processing engines using Python, FastAPI, and Redis caching.',
      country: 'India',
      state: 'Telangana',
      city: 'Hyderabad',
      locationType: 'HYBRID',
      jobType: 'CONTRACT',
      minSalary: 4000,
      maxSalary: 7000,
      currency: 'USD',
      experienceLevel: 'MID',
      isLocal: false,
      skills: ['Python', 'FastAPI', 'Redis', 'PostgreSQL', 'Docker'],
    },
    {
      companyName: 'PixelForge Labs',
      title: 'Lead UI/UX Design System Specialist',
      description: 'Create cohesive Figma token libraries, design accessible React component primitives, and lead design reviews for SaaS products.',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Chennai',
      locationType: 'REMOTE',
      jobType: 'FULL_TIME',
      minSalary: 24000,
      maxSalary: 36000,
      currency: 'USD',
      experienceLevel: 'LEAD',
      isLocal: false,
      skills: ['UI/UX Design (Figma)', 'Tailwind CSS', 'React', 'TypeScript'],
    },
    {
      companyName: 'NovaTech Solutions',
      title: 'Cybersecurity & OAuth2 Integration Consultant',
      description: 'Audit REST APIs for OWASP vulnerabilities, implement Spring Security OAuth2 token introspection, and harden container environments.',
      country: 'India',
      state: 'Karnataka',
      city: 'Bangalore',
      locationType: 'CONTRACT',
      jobType: 'CONTRACT',
      minSalary: 3500,
      maxSalary: 6500,
      currency: 'USD',
      experienceLevel: 'SENIOR',
      isLocal: false,
      skills: ['Cybersecurity', 'Spring Boot', 'Docker', 'System Design'],
    },
    {
      companyName: 'DataSphere Analytics',
      title: 'Data Engineer (Python & PostgreSQL ETL Pipelines)',
      description: 'Build automated data extraction and transformation pipelines, optimize partitioned SQL tables, and generate business intelligence metrics.',
      country: 'India',
      state: 'Maharashtra',
      city: 'Pune',
      locationType: 'HYBRID',
      jobType: 'FULL_TIME',
      minSalary: 20000,
      maxSalary: 32000,
      currency: 'USD',
      experienceLevel: 'MID',
      isLocal: false,
      skills: ['Python', 'PostgreSQL', 'Redis', 'System Design'],
    },
    {
      companyName: 'NextWave Digital',
      title: 'Frontend React & TypeScript Developer',
      description: 'Deliver responsive, performant user interfaces with React 19, Next.js App Router, Tailwind CSS, and TanStack React Query.',
      country: 'India',
      state: 'Karnataka',
      city: 'Bangalore',
      locationType: 'REMOTE',
      jobType: 'FULL_TIME',
      minSalary: 18000,
      maxSalary: 28000,
      currency: 'USD',
      experienceLevel: 'MID',
      isLocal: false,
      skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    },
    {
      companyName: 'Synthetix AI',
      title: 'Machine Learning Research Engineer (PyTorch & NLP)',
      description: 'Train and fine-tune transformer models, implement tokenization routines, and evaluate model latency on GPU clusters.',
      country: 'India',
      state: 'Karnataka',
      city: 'Bangalore',
      locationType: 'FULL_TIME',
      jobType: 'FULL_TIME',
      minSalary: 35000,
      maxSalary: 52000,
      currency: 'USD',
      experienceLevel: 'SENIOR',
      isLocal: false,
      skills: ['Machine Learning', 'Deep Learning', 'PyTorch', 'Python'],
    },
    {
      companyName: 'UrbanByte Systems',
      title: 'React Native Cross-Platform Mobile Engineer',
      description: 'Develop performant iOS and Android mobile features with React Native, Expo Router, TypeScript, and offline SQLite caching.',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Chennai',
      locationType: 'HYBRID',
      jobType: 'CONTRACT',
      minSalary: 3000,
      maxSalary: 5500,
      currency: 'USD',
      experienceLevel: 'MID',
      isLocal: true,
      skills: ['React Native', 'TypeScript', 'React', 'Mobile Development'],
    },
    {
      companyName: 'CloudVista Systems',
      title: 'Terraform & Cloud Automation Engineer',
      description: 'Write reusable Terraform modules to provision AWS VPCs, EKS clusters, and RDS PostgreSQL instances with automated testing.',
      country: 'India',
      state: 'Telangana',
      city: 'Hyderabad',
      locationType: 'REMOTE',
      jobType: 'FREELANCE',
      minSalary: 2500,
      maxSalary: 5000,
      currency: 'USD',
      experienceLevel: 'MID',
      isLocal: false,
      skills: ['AWS', 'CI/CD Pipelines', 'Docker', 'Kubernetes'],
    },
    {
      companyName: 'QuantumLeap Innovations',
      title: 'Event Streaming & Apache Kafka Engineer',
      description: 'Design distributed event streams, write partition rebalancing logic, and guarantee exactly-once processing semantics.',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Chennai',
      locationType: 'HYBRID',
      jobType: 'FULL_TIME',
      minSalary: 28000,
      maxSalary: 42000,
      currency: 'USD',
      experienceLevel: 'SENIOR',
      isLocal: true,
      skills: ['Go (Golang)', 'System Design', 'PostgreSQL', 'Docker'],
    },
    {
      companyName: 'HyperScale Networks',
      title: 'Network Systems & Low-Latency C++ / Go Engineer',
      description: 'Optimize high-throughput network packet processing, write custom memory allocators, and profile lock contention.',
      country: 'India',
      state: 'Maharashtra',
      city: 'Mumbai',
      locationType: 'HYBRID',
      jobType: 'FULL_TIME',
      minSalary: 34000,
      maxSalary: 50000,
      currency: 'USD',
      experienceLevel: 'LEAD',
      isLocal: false,
      skills: ['Go (Golang)', 'System Design', 'Docker'],
    },
    {
      companyName: 'ZenPulse Technologies',
      title: 'Full Stack HealthTech Web Developer',
      description: 'Build intuitive patient management dashboards using Next.js App Router, Tailwind CSS, PostgreSQL, and secure REST APIs.',
      country: 'India',
      state: 'Telangana',
      city: 'Hyderabad',
      locationType: 'REMOTE',
      jobType: 'FULL_TIME',
      minSalary: 22000,
      maxSalary: 35000,
      currency: 'USD',
      experienceLevel: 'MID',
      isLocal: false,
      skills: ['Next.js', 'React', 'TypeScript', 'PostgreSQL', 'FastAPI'],
    },
    {
      companyName: 'NovaTech Solutions',
      title: 'Microservices Architect & Tech Lead',
      description: 'Drive architectural roadmaps for distributed core banking services, mentor engineering pods, and establish code quality standards.',
      country: 'India',
      state: 'Karnataka',
      city: 'Bangalore',
      locationType: 'HYBRID',
      jobType: 'FULL_TIME',
      minSalary: 40000,
      maxSalary: 60000,
      currency: 'USD',
      experienceLevel: 'LEAD',
      isLocal: false,
      skills: ['Java', 'Spring Boot', 'System Design', 'Kubernetes', 'PostgreSQL'],
    },
    {
      companyName: 'PixelForge Labs',
      title: 'Frontend Performance & Core Web Vitals Specialist',
      description: 'Audit client websites for bundle size, image optimizations, and server-side rendering performance using Next.js 15.',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Chennai',
      locationType: 'FREELANCE',
      jobType: 'FREELANCE',
      minSalary: 2000,
      maxSalary: 4500,
      currency: 'USD',
      experienceLevel: 'SENIOR',
      isLocal: false,
      skills: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
    },
    {
      companyName: 'DataSphere Analytics',
      title: 'Redis Cache Layer Optimization Engineer',
      description: 'Configure high-availability Redis Sentinel clusters, audit key eviction policies, and reduce PostgreSQL read pressure.',
      country: 'India',
      state: 'Maharashtra',
      city: 'Pune',
      locationType: 'CONTRACT',
      jobType: 'CONTRACT',
      minSalary: 2200,
      maxSalary: 4200,
      currency: 'USD',
      experienceLevel: 'MID',
      isLocal: false,
      skills: ['Redis', 'PostgreSQL', 'System Design'],
    },
    {
      companyName: 'NextWave Digital',
      title: 'GraphQL API Integration Engineer',
      description: 'Integrate Apollo GraphQL server with existing REST microservices, implement caching resolvers, and write schema contracts.',
      country: 'India',
      state: 'Karnataka',
      city: 'Bangalore',
      locationType: 'REMOTE',
      jobType: 'CONTRACT',
      minSalary: 3200,
      maxSalary: 5800,
      currency: 'USD',
      experienceLevel: 'MID',
      isLocal: false,
      skills: ['GraphQL', 'TypeScript', 'Node.js', 'React'],
    },
    {
      companyName: 'UrbanByte Systems',
      title: 'Mobile App QA & Automated UI Testing Specialist',
      description: 'Write automated end-to-end test suites for Flutter and React Native mobile apps using Appium, Maestro, and CI workflows.',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Chennai',
      locationType: 'HYBRID',
      jobType: 'FULL_TIME',
      minSalary: 16000,
      maxSalary: 25000,
      currency: 'USD',
      experienceLevel: 'ENTRY',
      isLocal: true,
      skills: ['Flutter', 'React Native', 'CI/CD Pipelines', 'Mobile Development'],
    },
  ];

  for (const j of jobsData) {
    const companyId = companyUserIds[j.companyName] || Object.values(companyUserIds)[0];
    const job = await prisma.job.create({
      data: {
        companyId,
        title: j.title,
        description: j.description,
        country: j.country,
        state: j.state,
        city: j.city,
        locationType: j.locationType,
        jobType: j.jobType,
        minSalary: j.minSalary,
        maxSalary: j.maxSalary,
        currency: j.currency,
        experienceLevel: j.experienceLevel,
        isLocal: j.isLocal,
        status: 'OPEN',
      },
    });

    for (const skName of j.skills) {
      if (createdSkills[skName]) {
        await prisma.jobSkill.create({
          data: {
            jobId: job.id,
            skillId: createdSkills[skName],
            isRequired: true,
          },
        });
      }
    }

    // Ingest job posting into pgvector
    await insertChunk(
      `Job Opening: ${j.title}\nCompany: ${j.companyName}\nLocation: ${j.city}, ${j.state}, ${j.country} (${j.locationType})\nType: ${j.jobType}\nSalary: $${j.minSalary} - $${j.maxSalary} ${j.currency}\nExperience: ${j.experienceLevel}\nRequired Skills: ${j.skills.join(', ')}\nDescription: ${j.description}`,
      `Job: ${j.title} at ${j.companyName}`,
      'job',
      { jobId: job.id, title: j.title, company: j.companyName, location: j.city, skills: j.skills }
    );
  }
  console.log(`✅ Seeded ${jobsData.length} industry job postings with pgvector chunk embeddings.`);

  // 7b. Seed Applications & Proposals for NovaTech Solutions & PixelForge Labs
  const javaJob = await prisma.job.findFirst({ where: { title: { contains: 'Java & Spring Boot' } } });
  const aiJob = await prisma.job.findFirst({ where: { title: { contains: 'Next.js 15 & AI' } } });
  const pgJob = await prisma.job.findFirst({ where: { title: { contains: 'PostgreSQL Database Performance' } } });

  if (javaJob) {
    if (seededProfessionalMap['Ananya Iyer']) {
      await prisma.application.create({
        data: {
          jobId: javaJob.id,
          applicantId: seededProfessionalMap['Ananya Iyer'],
          status: 'REVIEWING',
          matchScore: 96,
          matchExplanation: '96% Match — Full coverage of Java 21, Spring Boot, PostgreSQL, Docker, and System Design with 8+ years experience.',
          coverLetter: 'I have 8+ years architecting enterprise Java and Spring Boot microservices with PostgreSQL optimization and Docker containerization. Excited to contribute to NovaTech.',
          resumeUrl: 'https://ananya-iyer.dev/resume.pdf',
        },
      });
    }

    if (seededProfessionalMap['Pooja Verma']) {
      await prisma.application.create({
        data: {
          jobId: javaJob.id,
          applicantId: seededProfessionalMap['Pooja Verma'],
          status: 'SHORTLISTED',
          matchScore: 92,
          matchExplanation: '92% Match — Strong backend integration skills with Java, Spring Boot, and PostgreSQL with extensive API architecture background.',
          coverLetter: 'Experienced full stack and mobile consultant with strong Java/Spring backend API design skills. Available for hybrid or contract engagement.',
          resumeUrl: 'https://pooja-verma.dev/resume.pdf',
        },
      });
    }

    await prisma.application.create({
      data: {
        jobId: javaJob.id,
        applicantId: demoStudent.id,
        status: 'INTERVIEW',
        matchScore: 84,
        matchExplanation: '84% Match — Demonstrates core Java fundamentals, SQL, and eager to grow into production Spring Boot systems under senior guidance.',
        coverLetter: 'Computer Science graduate with deep enthusiasm for Java backend systems and database indexing. Seeking to contribute and learn in a fast-paced environment.',
        resumeUrl: 'https://github.com/alexchen',
      },
    });
  }

  if (aiJob && seededProfessionalMap['Rahul Mehta']) {
    await prisma.application.create({
      data: {
        jobId: aiJob.id,
        applicantId: seededProfessionalMap['Rahul Mehta'],
        status: 'REVIEWING',
        matchScore: 94,
        matchExplanation: '94% Match — High domain alignment in Next.js 15, TypeScript, React 19, and Tailwind CSS design systems.',
        coverLetter: 'Full-stack developer with hands-on experience building production React/Next.js SaaS applications and AI streaming interfaces.',
        resumeUrl: 'https://rahul-mehta.dev/resume.pdf',
      },
    });
  }

  if (pgJob && seededProfessionalMap['Siddharth Nair']) {
    await prisma.proposal.create({
      data: {
        jobId: pgJob.id,
        professionalId: seededProfessionalMap['Siddharth Nair'],
        status: 'PENDING',
        coverLetter: 'I specialize in PostgreSQL database query performance auditing, connection pooling, and Dockerized database deployments.',
        proposedRate: 65,
        estimatedDays: 14,
        milestonesJson: JSON.stringify([
          { title: 'Schema & Index Audit', days: 4, amount: 1000 },
          { title: 'Slow Query Optimization & Connection Tuning', days: 10, amount: 2000 },
        ]),
      },
    });
  }
  console.log(`✅ Seeded realistic candidate applications & proposals.`);

  // 8. Ingest 10 Production Roadmaps into pgvector
  for (const r of PRODUCTION_ROADMAPS_CATALOG) {
    const phasesSummary = r.phases
      .map((p) => `Phase ${p.phaseNumber}: ${p.title} (${p.durationWeeks} wks) - ${p.objective} [Skills: ${p.skills.join(', ')}]`)
      .join('\n');

    await insertChunk(
      `Career Roadmap: ${r.title}\nRole: ${r.targetRole}\nCategory: ${r.category}\nLevel: ${r.level}\nDuration: ${r.estimatedDurationWeeks} weeks\nSummary: ${r.summary}\nKey Skills: ${r.primarySkills.join(', ')}\n\nCurriculum Phases:\n${phasesSummary}\n\nFinal Milestone: ${r.finalMilestone}`,
      `Roadmap: ${r.title}`,
      'roadmap',
      { roadmapId: r.id, slug: r.slug, title: r.title, category: r.category, skills: r.primarySkills }
    );
  }
  console.log(`✅ Seeded ${PRODUCTION_ROADMAPS_CATALOG.length} production career roadmaps with pgvector chunk embeddings.`);

  // 8b. Ingest Platform Ecosystem Overview into pgvector
  await insertChunk(
    `GrowEarn Platform Overview & Capabilities:
GrowEarn is a production-grade talent ecosystem, mentorship marketplace, and career development platform connecting 4 key user roles:
1. Learner: Discovers market-aligned courses, requests structured 4-phase AI career roadmaps, tracks verified skills, and books 1-on-1 mentorship sessions.
2. Mentor: Senior industry architects providing 1-on-1 coaching, code reviews, system design interview prep, and authoring courses with lesson materials.
3. Professional: Freelance and full-time job marketplace with 1-Click AI Proposal Generator, smart contract escrow, and project bidding.
4. Employer / Company: Posts verified jobs, sources matched candidates via vector search, reviews proposals, and hires verified talent.
Community Feed: Cross-role knowledge sharing with verified role badges on every post.`,
    'GrowEarn Platform Overview',
    'knowledge_base',
    { type: 'platform_documentation' }
  );

  // 9. Initial Career Roadmap & AI Profile for Demo Student Alex Chen
  await prisma.aIProfile.create({
    data: {
      userId: demoStudent.id,
      careerGoal: 'Backend Software Engineer',
      currentLevel: 'Intermediate',
      skillSummary: 'Solid foundation in Java, TypeScript, and SQL; advancing in Spring Boot microservices and system design.',
      strengthsJson: JSON.stringify(['Java', 'PostgreSQL', 'TypeScript']),
      gapAnalysisJson: JSON.stringify(['Spring Security', 'System Design', 'Docker', 'Kubernetes']),
      suggestedRolesJson: JSON.stringify(['Backend Developer', 'Java Microservices Engineer', 'API Architect']),
    },
  });

  const roadmap = await prisma.careerRoadmap.create({
    data: {
      userId: demoStudent.id,
      targetRole: 'Backend Developer',
      currentLevel: 'Intermediate',
      summary: 'Structured 5-stage milestone roadmap from core Java fundamentals to production backend engineering.',
    },
  });

  const roadmapNodes = [
    { title: 'Core Java 21 & Concurrency Fundamentals', description: 'Master multithreading, virtual threads, collections, and stream pipelines.', milestoneType: 'SKILL', isCompleted: true },
    { title: 'Spring Boot 3 & REST API Development', description: 'Build enterprise controller endpoints with Spring Data JPA and validation.', milestoneType: 'COURSE', isCompleted: false },
    { title: 'PostgreSQL Query Optimization & Indexing', description: 'B-tree index tuning, transaction isolation levels, and execution plans.', milestoneType: 'SKILL', isCompleted: false },
    { title: 'System Design 1-on-1 Architecture Review', description: 'Mock interview and code review with mentor Priya Sharma.', milestoneType: 'MENTOR', isCompleted: false },
    { title: 'Apply to Curated Junior/Mid Backend Jobs', description: 'Submit verified proposals for open positions at NovaTech Solutions.', milestoneType: 'JOB', isCompleted: false },
  ];

  for (let i = 0; i < roadmapNodes.length; i++) {
    await prisma.roadmapItem.create({
      data: {
        roadmapId: roadmap.id,
        orderIndex: i + 1,
        title: roadmapNodes[i].title,
        description: roadmapNodes[i].description,
        milestoneType: roadmapNodes[i].milestoneType,
        isCompleted: roadmapNodes[i].isCompleted,
      },
    });
  }

  // 10. Mentorship Booking for Demo Student with Priya Sharma
  const priyaUser = await prisma.user.findUnique({ where: { email: 'priya.sharma@example.com' } });
  const priyaMentor = await prisma.mentorProfile.findFirst({ where: { userId: priyaUser?.id } });
  if (priyaMentor && priyaUser) {
    const req = await prisma.mentorshipRequest.create({
      data: {
        studentId: demoStudent.id,
        mentorId: priyaMentor.id,
        topic: 'Spring Security 6 Architecture & JWT Review',
        message: 'Hi Priya, I am building my capstone project and would love your guidance on securing distributed microservices endpoints.',
        status: 'ACCEPTED',
      },
    });

    await prisma.mentorshipBooking.create({
      data: {
        requestId: req.id,
        studentId: demoStudent.id,
        mentorId: priyaMentor.id,
        scheduledAt: new Date(Date.now() + 86400000 * 2),
        durationMinutes: 60,
        price: 65,
        status: 'SCHEDULED',
      },
    });
  }

  console.log('✨ Seed complete! Demo accounts ready:');
  console.log('   👨‍🎓 Learner:      student@example.com      (Password: Demo1234!)');
  console.log('   💼 Professional: professional@example.com (Password: Demo1234!)');
  console.log('   👨‍🏫 Mentor:       priya.sharma@example.com (Password: Demo1234!)');
  console.log('   🏢 Employer:     careers@novatech-solutions.io (Password: Demo1234!)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
