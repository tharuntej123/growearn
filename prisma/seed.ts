import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed for Unified Freelancing Platform...');

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

  const demoStudent = await prisma.user.create({
    data: {
      email: 'student@example.com',
      passwordHash: demoPasswordHash,
      name: 'Alex Chen',
      role: 'STUDENT',
      headline: 'Computer Science Student & Aspiring Full Stack Developer',
      location: 'Chennai, Tamil Nadu, India',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Chennai',
      bio: 'Enthusiastic CS student eager to master modern distributed systems, Spring Boot, and Next.js. Active open source learner seeking mentorship and entry-level projects.',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
      profile: {
        create: {
          title: 'Aspiring Full Stack Engineer',
          careerGoal: 'Backend Software Engineer',
          targetRole: 'Backend Developer',
          experienceLevel: 'Beginner',
          isOnboarded: true,
          aiScore: 82,
          yearsOfExperience: 1,
          githubUrl: 'https://github.com/alexchen',
          linkedinUrl: 'https://linkedin.com/in/alexchen',
        },
      },
    },
  });

  const demoMentor = await prisma.user.create({
    data: {
      email: 'mentor@example.com',
      passwordHash: demoPasswordHash,
      name: 'Dr. Marcus Vance',
      role: 'MENTOR',
      headline: 'Principal Distributed Systems Architect @ CloudScale (10+ Yrs Exp)',
      location: 'Bangalore, Karnataka, India',
      country: 'India',
      state: 'Karnataka',
      city: 'Bangalore',
      bio: 'Passionate about engineering leadership, high-throughput microservices, and coaching the next generation of software engineers. Over 150+ students mentored.',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
      profile: {
        create: {
          title: 'Principal Systems Architect',
          yearsOfExperience: 10,
          hourlyRate: 85,
          aiScore: 98,
          githubUrl: 'https://github.com/marcusvance',
          linkedinUrl: 'https://linkedin.com/in/marcusvance',
        },
      },
      mentorProfile: {
        create: {
          hourlyRate: 85,
          bio: '10+ years architecting fault-tolerant distributed backends with Java Spring Boot, Go, and Kafka. Let us optimize your system design and accelerate your career.',
          expertise: 'Java, Spring Boot, System Design, PostgreSQL, Kubernetes, Kafka',
          yearsExperience: 10,
          company: 'CloudScale Technologies',
          title: 'Principal Architect',
          rating: 4.95,
          studentsCount: 142,
          sessionCount: 260,
          isAvailable: true,
          availability: 'Weekdays 7 PM - 10 PM IST, Weekends Flexible',
        },
      },
    },
  });

  const demoProfessional = await prisma.user.create({
    data: {
      email: 'professional@example.com',
      passwordHash: demoPasswordHash,
      name: 'Elena Rostova',
      role: 'PROFESSIONAL',
      headline: 'Senior Full Stack & Generative AI Application Developer',
      location: 'Chennai, Tamil Nadu, India',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Chennai',
      bio: 'Specialist in building high-conversion SaaS web apps, Next.js full-stack architectures, and custom LLM integrations. 100% job success rate across 35+ contracts.',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
      profile: {
        create: {
          title: 'Senior Full Stack & AI Specialist',
          hourlyRate: 65,
          yearsOfExperience: 6,
          aiScore: 94,
          careerGoal: 'AI Application Engineering Consultant',
          targetRole: 'Full Stack AI Developer',
          experienceLevel: 'Advanced',
          isOnboarded: true,
          portfolioUrl: 'https://elena-portfolio.dev',
          githubUrl: 'https://github.com/elenarostova',
          linkedinUrl: 'https://linkedin.com/in/elenarostova',
        },
      },
    },
  });

  const demoCompany = await prisma.user.create({
    data: {
      email: 'company@example.com',
      passwordHash: demoPasswordHash,
      name: 'Nexus Dynamics Inc.',
      role: 'EMPLOYER',
      headline: 'Next-Gen Cloud & AI Enterprise Software Innovations',
      location: 'Chennai, Tamil Nadu, India',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Chennai',
      bio: 'Leading innovator building automated enterprise workflows, intelligent data pipelines, and scalable cloud solutions for Fortune 500 organizations.',
      avatarUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
      profile: {
        create: {
          title: 'Enterprise Technology Provider',
          companyName: 'Nexus Dynamics Inc.',
          companyIndustry: 'Enterprise Software & Artificial Intelligence',
          companyWebsite: 'https://nexusdynamics.io',
          companySize: '250-500 Employees',
        },
      },
    },
  });

  const additionalUsers = [
    { name: 'Rahul Sharma', email: 'rahul.sharma@example.com', role: 'LEARNER', city: 'Chennai', state: 'Tamil Nadu', title: 'React & Node.js Enthusiast' },
    { name: 'Priya Sundaram', email: 'priya.sundaram@example.com', role: 'PROFESSIONAL', city: 'Chennai', state: 'Tamil Nadu', title: 'Mobile Developer (Flutter & React Native)' },
    { name: 'Vikram Patel', email: 'vikram.patel@example.com', role: 'MENTOR', city: 'Bangalore', state: 'Karnataka', title: 'Senior AI/ML Lead @ NeuralLabs' },
    { name: 'Sarah Jenkins', email: 'sarah.j@example.com', role: 'PROFESSIONAL', city: 'San Francisco', state: 'CA', country: 'United States', title: 'UI/UX & Product Design Specialist' },
    { name: 'Apex Software Labs', email: 'careers@apexsoftware.com', role: 'EMPLOYER', city: 'Chennai', state: 'Tamil Nadu', title: 'High-growth FinTech Startup' },
    { name: 'David Kim', email: 'david.kim@example.com', role: 'LEARNER', city: 'Hyderabad', state: 'Telangana', title: 'Python & Data Engineering Student' },
    { name: 'Ananya Deshmukh', email: 'ananya.d@example.com', role: 'MENTOR', city: 'Mumbai', state: 'Maharashtra', title: 'Staff Frontend Engineer @ DevCore' },
    { name: 'Quantix Cloud Solutions', email: 'talent@quantix.io', role: 'EMPLOYER', city: 'Bangalore', state: 'Karnataka', title: 'Cloud Infrastructure & DevOps Enterprise' },
    { name: 'Karthik Raja', email: 'karthik.raja@example.com', role: 'PROFESSIONAL', city: 'Chennai', state: 'Tamil Nadu', title: 'PostgreSQL & Database Optimization Consultant' },
    { name: 'Jessica Miller', email: 'jessica.m@example.com', role: 'MENTOR', city: 'Austin', state: 'TX', country: 'United States', title: 'Engineering Manager & Career Coach' },
  ];

  const userIds: Record<string, string> = {
    student: demoStudent.id,
    mentor: demoMentor.id,
    professional: demoProfessional.id,
    company: demoCompany.id,
  };

  for (const u of additionalUsers) {
    const created = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash: demoPasswordHash,
        name: u.name,
        role: u.role,
        headline: u.title,
        location: `${u.city}, ${u.state}, ${u.country || 'India'}`,
        country: u.country || 'India',
        state: u.state,
        city: u.city,
        bio: `Professional profile for ${u.name}. Passionate about technology, career growth, and quality software craft.`,
        isVerified: true,
        profile: {
          create: {
            title: u.title,
            yearsOfExperience: u.role === 'MENTOR' ? 8 : u.role === 'FREELANCER' ? 4 : 1,
            hourlyRate: u.role === 'MENTOR' ? 75 : u.role === 'FREELANCER' ? 50 : undefined,
            aiScore: 85,
            companyName: u.role === 'COMPANY' ? u.name : undefined,
          },
        },
        ...(u.role === 'MENTOR'
          ? {
              mentorProfile: {
                create: {
                  hourlyRate: 70,
                  bio: `Experienced engineering coach with a proven track record of guiding professionals into top-tier tech roles.`,
                  expertise: 'System Design, React, Node.js, Cloud Architecture',
                  yearsExperience: 8,
                  title: u.title,
                  rating: 4.88,
                  studentsCount: 65,
                  sessionCount: 110,
                  isAvailable: true,
                },
              },
            }
          : {}),
      },
    });
    userIds[u.email] = created.id;
  }
  console.log(`✅ Seeded demo accounts and ${additionalUsers.length} active users.`);

  const studentSkills = ['Java', 'PostgreSQL', 'TypeScript', 'React'];
  for (const sk of studentSkills) {
    if (createdSkills[sk]) {
      await prisma.userSkill.create({
        data: {
          userId: demoStudent.id,
          skillId: createdSkills[sk],
          proficiencyLevel: sk === 'Java' ? 'INTERMEDIATE' : 'BEGINNER',
          isVerified: true,
        },
      });
    }
  }

  const professionalSkills = ['TypeScript', 'React', 'Next.js', 'Tailwind CSS', 'Node.js', 'PostgreSQL', 'LLM Engineering', 'Docker'];
  for (const sk of professionalSkills) {
    if (createdSkills[sk]) {
      await prisma.userSkill.create({
        data: {
          userId: demoProfessional.id,
          skillId: createdSkills[sk],
          proficiencyLevel: 'EXPERT',
          isVerified: true,
          endorsementsCount: 14,
        },
      });
    }
  }

  const mentorSkills = ['Java', 'Spring Boot', 'System Design', 'PostgreSQL', 'Kubernetes', 'Docker', 'AWS', 'CI/CD Pipelines'];
  for (const sk of mentorSkills) {
    if (createdSkills[sk]) {
      await prisma.userSkill.create({
        data: {
          userId: demoMentor.id,
          skillId: createdSkills[sk],
          proficiencyLevel: 'EXPERT',
          isVerified: true,
          endorsementsCount: 28,
        },
      });
    }
  }

  const coursesData = [
    {
      instructorId: demoMentor.id,
      title: 'Spring Boot 3 & Enterprise Microservices Architecture',
      slug: 'spring-boot-3-microservices',
      description: 'Master production-ready backend architecture using Java 21, Spring Boot 3, Spring Security, Docker, and Kafka.',
      category: 'Backend',
      level: 'INTERMEDIATE',
      price: 49.99,
      durationHours: 24,
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'Java, Spring Boot, System Design, PostgreSQL, Docker',
      rating: 4.9,
      reviewsCount: 84,
      modules: [
        {
          title: 'Module 1: Spring Boot 3 Architecture & REST APIs',
          lessons: [
            { title: 'Modern Spring Boot Architecture & Dependency Injection', durationMinutes: 20 },
            { title: 'Designing Clean RESTful Controller Endpoints & Validation', durationMinutes: 25 },
            { title: 'Data Persistence with Spring Data JPA & PostgreSQL', durationMinutes: 30 },
          ],
        },
        {
          title: 'Module 2: Security, JWT & Authentication',
          lessons: [
            { title: 'Spring Security 6 with Stateless JWT Filter Chain', durationMinutes: 35 },
            { title: 'Role-Based Access Control & Method Level Security', durationMinutes: 25 },
          ],
        },
        {
          title: 'Module 3: Containerization & Cloud Deployment',
          lessons: [
            { title: 'Multi-stage Docker Builds for Java Applications', durationMinutes: 20 },
            { title: 'Deploying Microservices to Kubernetes Cluster', durationMinutes: 40 },
          ],
        },
      ],
    },
    {
      instructorId: demoProfessional.id,
      title: 'Next.js 15 & Generative AI Applications Masterclass',
      slug: 'nextjs-15-generative-ai',
      description: 'Build full-stack AI SaaS applications with Next.js App Router, Server Actions, Tailwind CSS, and LangChain.',
      category: 'Full Stack',
      level: 'ADVANCED',
      price: 59.99,
      durationHours: 18,
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'Next.js, React, TypeScript, LLM Engineering, Tailwind CSS',
      rating: 4.95,
      reviewsCount: 112,
      modules: [
        {
          title: 'Module 1: Next.js 15 Foundations',
          lessons: [
            { title: 'Server Components vs Client Components Deep Dive', durationMinutes: 25 },
            { title: 'Server Actions, Form Mutations & Zod Validation', durationMinutes: 30 },
          ],
        },
        {
          title: 'Module 2: AI & LLM Integration',
          lessons: [
            { title: 'Streaming LLM Responses with Vercel AI SDK', durationMinutes: 30 },
            { title: 'Building Retrieval-Augmented Generation (RAG) Workflows', durationMinutes: 45 },
          ],
        },
      ],
    },
    {
      instructorId: demoMentor.id,
      title: 'Complete PostgreSQL & Relational Database Optimization',
      slug: 'postgresql-database-optimization',
      description: 'From schema normalization to indexing strategies, query execution plans, and high-concurrency scaling.',
      category: 'Database & Architecture',
      level: 'INTERMEDIATE',
      price: 39.99,
      durationHours: 12,
      thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'PostgreSQL, Redis, System Design',
      rating: 4.88,
      reviewsCount: 65,
    },
    {
      instructorId: demoProfessional.id,
      title: 'Full Stack TypeScript: From Zero to Production',
      slug: 'fullstack-typescript-zero-to-production',
      description: 'End-to-end type safety from database schemas to client components with Next.js, Prisma, and Zod.',
      category: 'Full Stack',
      level: 'BEGINNER',
      price: 29.99,
      durationHours: 16,
      thumbnail: 'https://images.unsplash.com/photo-1516116211227-bbc1552a4e92?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'TypeScript, React, Node.js, Prisma',
      rating: 4.85,
      reviewsCount: 42,
    },
    {
      instructorId: demoMentor.id,
      title: 'System Design for Senior & Principal Engineers',
      slug: 'system-design-senior-principal',
      description: 'Ace FAANG-level system design interviews: Caching, Sharding, Eventual Consistency, CAP Theorem, and Microservices.',
      category: 'Database & Architecture',
      level: 'ADVANCED',
      price: 79.99,
      durationHours: 20,
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      skillsCovered: 'System Design, Kubernetes, Kafka, AWS',
      rating: 4.97,
      reviewsCount: 156,
    },
  ];

  for (const c of coursesData) {
    const course = await prisma.course.create({
      data: {
        instructorId: c.instructorId,
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

    if (c.modules) {
      for (let i = 0; i < c.modules.length; i++) {
        const m = c.modules[i];
        const module = await prisma.courseModule.create({
          data: {
            courseId: course.id,
            title: m.title,
            orderIndex: i + 1,
          },
        });

        for (let j = 0; j < m.lessons.length; j++) {
          const l = m.lessons[j];
          await prisma.lesson.create({
            data: {
              moduleId: module.id,
              title: l.title,
              durationMinutes: l.durationMinutes,
              orderIndex: j + 1,
              content: `Comprehensive interactive lesson content for "${l.title}". Covers practical coding examples, production best practices, and hands-on exercises.`,
              videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            },
          });
        }
      }
    }
  }
  console.log(`✅ Seeded ${coursesData.length} courses with full modules & lessons.`);

  const firstCourse = await prisma.course.findFirst({ where: { slug: 'spring-boot-3-microservices' } });
  if (firstCourse) {
    await prisma.enrollment.create({
      data: {
        studentId: demoStudent.id,
        courseId: firstCourse.id,
        progressPercent: 45,
        isCompleted: false,
      },
    });
  }

  const jobsData = [
    {
      companyId: demoCompany.id,
      title: 'Senior Java & Spring Boot Backend Architect',
      description: 'We are seeking an experienced Backend Architect to design high-throughput microservices, optimize PostgreSQL data queries, and lead our enterprise cloud migration.',
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
      skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker', 'System Design'],
    },
    {
      companyId: demoCompany.id,
      title: 'Next.js & AI Web Application Engineer',
      description: 'Build responsive client dashboards, integrate streaming LLM endpoints, and create polished user experiences with Next.js 15, Tailwind CSS, and TypeScript.',
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
      companyId: demoCompany.id,
      title: 'Local Freelance: PostgreSQL Database Query Tuning',
      description: 'Short-term consulting gig to audit index health, optimize slow query execution plans, and configure connection pooling for a local Chennai e-commerce platform.',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Chennai',
      locationType: 'ONSITE',
      jobType: 'CONTRACT',
      minSalary: 1200,
      maxSalary: 2500,
      currency: 'USD',
      experienceLevel: 'SENIOR',
      isLocal: true,
      skills: ['PostgreSQL', 'Redis', 'System Design'],
    },
    {
      companyId: demoCompany.id,
      title: 'Junior Full Stack Developer (Internship to Hire)',
      description: 'Great entry-level opportunity for ambitious students and recent graduates skilled in React, Node.js, and SQL. Mentorship from senior architects provided.',
      country: 'India',
      state: 'Tamil Nadu',
      city: 'Chennai',
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
      companyId: demoCompany.id,
      title: 'Cloud DevOps & CI/CD Engineer',
      description: 'Setup automated deployment pipelines using GitHub Actions, containerize microservices with Docker, and manage Kubernetes clusters on AWS.',
      country: 'United States',
      locationType: 'REMOTE',
      jobType: 'CONTRACT',
      minSalary: 5000,
      maxSalary: 8000,
      currency: 'USD',
      experienceLevel: 'MID',
      isLocal: false,
      skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD Pipelines'],
    },
  ];

  for (const j of jobsData) {
    const job = await prisma.job.create({
      data: {
        companyId: j.companyId,
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
  }
  console.log(`✅ Seeded ${jobsData.length} realistic jobs with skills.`);

  const postsData = [
    {
      authorId: demoProfessional.id,
      postType: 'PROJECT',
      content: '🚀 Excited to share that I just completed a full-scale AI platform contract in record time using Next.js 15, Prisma, and Tailwind CSS! Clean server actions and hybrid scoring algorithm delivered 95%+ client satisfaction. #FullStack #Nextjs #AI #Professional',
      mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      likesCount: 38,
      commentsCount: 6,
    },
    {
      authorId: demoMentor.id,
      postType: 'ACHIEVEMENT',
      content: '🎉 Proud to announce that over 150+ learners in our Distributed Backend Architecture mentorship program have successfully transitioned into Senior & Lead engineering roles this quarter. Keep building, keep learning! #Mentorship #CareerGrowth #Java #SystemDesign',
      likesCount: 64,
      commentsCount: 12,
    },
    {
      authorId: demoStudent.id,
      postType: 'LEARNING_MILESTONE',
      content: '📚 Just finished Module 1 of "Spring Boot 3 & Enterprise Microservices"! Built my first secure stateless REST API with JPA persistence. Huge shoutout to my mentor @DrMarcusVance for the architectural code review. Onward to JWT security! 🚀',
      likesCount: 19,
      commentsCount: 4,
    },
    {
      authorId: demoCompany.id,
      postType: 'HIRING',
      content: '🌟 WE ARE HIRING in Chennai & Remote! Looking for 3 Senior Backend Architects (Java / Spring Boot / PostgreSQL) and 2 Full Stack Next.js Specialists. Check out our open positions on the Jobs tab or submit an AI-matched proposal! #Hiring #TechJobs #ChennaiJobs',
      likesCount: 45,
      commentsCount: 9,
    },
    {
      authorId: demoProfessional.id,
      postType: 'CERTIFICATE',
      content: '🏆 Verified Certification achieved: "Advanced LLM Orchestration & Prompt Engineering". Excited to leverage vector databases and RAG workflows for enterprise client contracts.',
      likesCount: 27,
      commentsCount: 3,
    },
  ];

  for (const p of postsData) {
    const post = await prisma.post.create({
      data: {
        authorId: p.authorId,
        content: p.content,
        postType: p.postType,
        mediaUrl: p.mediaUrl,
        likesCount: p.likesCount,
        commentsCount: p.commentsCount,
      },
    });

    await prisma.comment.create({
      data: {
        postId: post.id,
        authorId: demoStudent.id,
        content: 'Inspiring journey! Thank you for sharing your architecture insights.',
      },
    });
  }
  console.log(`✅ Seeded ${postsData.length} professional social feed posts with comments.`);

  await prisma.aIProfile.create({
    data: {
      userId: demoStudent.id,
      careerGoal: 'Backend Software Engineer',
      currentLevel: 'Intermediate',
      skillSummary: 'Solid foundation in Java and SQL; currently developing Spring Boot and REST API mastery.',
      strengthsJson: JSON.stringify(['Java', 'SQL / PostgreSQL', 'TypeScript']),
      gapAnalysisJson: JSON.stringify(['Spring Security', 'System Design', 'Docker & Containerization', 'Microservices']),
      suggestedRolesJson: JSON.stringify(['Backend Developer', 'Java Software Engineer', 'API Architect']),
    },
  });

  const roadmap = await prisma.careerRoadmap.create({
    data: {
      userId: demoStudent.id,
      targetRole: 'Backend Developer',
      currentLevel: 'Intermediate',
      summary: 'Structured 5-stage roadmap from core Java competencies to job-ready backend engineering.',
    },
  });

  const roadmapNodes = [
    { title: 'Core Java & Data Structures Mastery', description: 'Advanced multithreading, collections, and streams.', milestoneType: 'SKILL', isCompleted: true },
    { title: 'Spring Boot 3 & REST API Development', description: 'Build enterprise endpoints with Spring Data JPA.', milestoneType: 'COURSE', isCompleted: false },
    { title: 'PostgreSQL Query Tuning & Database Architecture', description: 'Indexes, transactions, and schema normalization.', milestoneType: 'SKILL', isCompleted: false },
    { title: 'System Design & 1-on-1 Architecture Mentorship', description: 'Mock interview and code review with Dr. Marcus Vance.', milestoneType: 'MENTOR', isCompleted: false },
    { title: 'Apply to Curated Junior/Mid Backend Job Postings', description: 'Submit high-match applications with AI proposals.', milestoneType: 'JOB', isCompleted: false },
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
  console.log(`✅ Seeded AI Profile and structured Career Roadmap for Alex Chen.`);

  const mentorProfile = await prisma.mentorProfile.findUnique({ where: { userId: demoMentor.id } });
  if (mentorProfile) {
    const req = await prisma.mentorshipRequest.create({
      data: {
        studentId: demoStudent.id,
        mentorId: mentorProfile.id,
        topic: 'Spring Security 6 Architecture & JWT Review',
        message: 'Hi Dr. Marcus, I am building my capstone project and would love your guidance on securing distributed microservices endpoints.',
        status: 'ACCEPTED',
      },
    });

    await prisma.mentorshipBooking.create({
      data: {
        requestId: req.id,
        studentId: demoStudent.id,
        mentorId: mentorProfile.id,
        scheduledAt: new Date(Date.now() + 86400000 * 2),
        durationMinutes: 60,
        price: 85,
        status: 'SCHEDULED',
      },
    });
  }

  await prisma.review.create({
    data: {
      authorId: demoStudent.id,
      targetUserId: demoMentor.id,
      rating: 5,
      comment: 'Dr. Marcus explained distributed transaction boundaries with immense clarity. Completely transformed how I structure my backend services!',
      reviewType: 'MENTOR',
    },
  });

  await prisma.review.create({
    data: {
      authorId: demoCompany.id,
      targetUserId: demoProfessional.id,
      rating: 5,
      comment: 'Elena delivered our full-stack Next.js web application 3 days ahead of schedule. Exceptional code quality and proactive communication.',
      reviewType: 'PROFESSIONAL',
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: demoStudent.id,
        title: 'Mentorship Session Confirmed',
        message: 'Dr. Marcus Vance accepted your mentorship request for "Spring Security Architecture".',
        link: '/messages',
        notificationType: 'MENTORSHIP_REQUEST',
      },
      {
        userId: demoStudent.id,
        title: 'AI Recommendation: New Course Match',
        message: 'New course "Spring Boot 3 & Microservices" matches 94% of your Backend Developer career goals.',
        link: '/courses',
        notificationType: 'AI_RECOMMENDATION',
      },
      {
        userId: demoProfessional.id,
        title: 'High-Match Job Alert',
        message: 'Nexus Dynamics posted "Next.js & AI Web Application Engineer" (95% Skill Match).',
        link: '/jobs',
        notificationType: 'JOB_APPLICATION',
      },
    ],
  });

  console.log('✨ Seed complete! Demo accounts ready:');
  console.log('   👨‍🎓 Learner:      student@example.com (Password: Demo1234!)');
  console.log('   👨‍🏫 Mentor:       mentor@example.com  (Password: Demo1234!)');
  console.log('   💼 Professional: professional@example.com (Password: Demo1234!)');
  console.log('   🏢 Employer:     company@example.com (Password: Demo1234!)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
