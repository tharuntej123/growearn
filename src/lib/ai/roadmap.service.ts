import { roadmapSchema, RoadmapOutput, RoadmapPhaseOutput } from './schemas';
import { SkillAnalysisService } from './skill-analysis.service';

export class CareerRoadmapService {
  /**
   * Generates a structured multi-phase career roadmap based on actual user profile:
   * Current Skills + Target Role + Experience Level + Identified Skill Gaps.
   */
  static generate(
    skills: string[],
    targetRole?: string | null,
    experienceLevel?: string | null,
    careerGoal?: string | null
  ): RoadmapOutput {
    const cleanSkills = skills.map((s) => s.trim()).filter(Boolean);
    const target = (targetRole || careerGoal || 'Full Stack Developer').trim();
    const exp = experienceLevel || 'Beginner';

    // Step 1: Run grounded skill gap analysis
    const analysis = SkillAnalysisService.analyze(cleanSkills, target, exp);
    const targetLower = target.toLowerCase();

    // If 0 skills provided, generate foundational onboarding roadmap
    if (cleanSkills.length === 0) {
      const rawOutput = {
        targetRole: target,
        summary: `Foundational learning roadmap to transition into ${target}. Add your skills to unlock customized phase pacing.`,
        currentLevel: 'Beginner',
        estimatedDurationWeeks: 16,
        currentSkills: [],
        skillGaps: analysis.skillGaps,
        phases: [
          {
            phaseNumber: 1,
            title: 'Core Programming & Computational Foundations',
            objective: 'Master variables, data structures, OOP principles, and basic algorithmic problem solving.',
            durationWeeks: 4,
            skills: ['Programming Fundamentals', 'Git', 'Data Structures'],
            topics: ['Syntax & Types', 'Control Flow', 'Functions & OOP', 'Version Control with GitHub'],
            resources: ['Interactive Coding Exercises', 'Algorithms Guide'],
            practiceTasks: ['Build 5 algorithmic problems daily', 'Create GitHub portfolio repository'],
            projects: ['CLI Task Tracker Application'],
            milestone: 'Solid grasp of core programming and Git',
          },
          {
            phaseNumber: 2,
            title: 'Modern Web Architecture & Frameworks',
            objective: `Build scalable applications using modern industry frameworks required for ${target}.`,
            durationWeeks: 4,
            skills: ['Modern Frameworks', 'REST APIs', 'HTTP Protocol'],
            topics: ['Routing & Controller Architecture', 'CRUD Operations', 'State Management'],
            resources: ['Official Framework Docs', 'Interactive Platform Courses'],
            practiceTasks: ['Implement 3 RESTful endpoints', 'Connect frontend and backend'],
            projects: ['Full Stack Inventory Management Portal'],
            milestone: 'Able to build and test end-to-end full stack applications',
          },
          {
            phaseNumber: 3,
            title: 'Database Design & Production Deployment',
            objective: 'Design relational database schemas and deploy applications with containerization.',
            durationWeeks: 4,
            skills: ['PostgreSQL', 'Docker', 'Cloud Hosting'],
            topics: ['Schema Normalization', 'SQL Joins & Indexing', 'Dockerfiles', 'CI/CD Pipelines'],
            resources: ['SQL Mastery Labs', 'Docker Hands-On Workshop'],
            practiceTasks: ['Write complex SQL joins and transactions', 'Dockerize full application'],
            projects: ['Containerized E-Commerce Application with Database'],
            milestone: 'Database mastery and deployment pipeline verified',
          },
          {
            phaseNumber: 4,
            title: 'Portfolio Review & Interview Preparation',
            objective: 'Complete capstone project and conduct 1-on-1 mock interviews with industry mentors.',
            durationWeeks: 4,
            skills: ['System Design', 'Code Review', 'Interview Prep'],
            topics: ['High-level System Architecture', 'Behavioral & Technical Mock Interviews', 'Resume Polishing'],
            resources: ['Platform Mentor Directory', 'System Design Cheatsheet'],
            practiceTasks: ['Book 1-on-1 mentor session for architecture audit', 'Submit 5 tailored applications'],
            projects: ['Production-Grade Capstone SaaS Platform'],
            milestone: `Job-Ready for ${target}`,
          },
        ],
        finalMilestone: `Certified ${target} Candidate`,
      };

      return roadmapSchema.parse(rawOutput);
    }

    // Role-specific roadmap generator for users WITH skills
    const primarySkill = cleanSkills[0] || 'Core Stack';
    const phases: RoadmapPhaseOutput[] = [];

    if (targetLower.includes('backend') || targetLower.includes('java')) {
      phases.push(
        {
          phaseNumber: 1,
          title: 'Advanced Java & Core Architecture',
          objective: 'Deepen object-oriented design, Java Streams, concurrency, and memory management.',
          durationWeeks: 3,
          skills: [cleanSkills.includes('Java') ? 'Java' : 'Java Fundamentals', 'OOP', 'Collections & Streams'],
          topics: ['Generics & Reflection', 'Concurrent Collections', 'Exception Architecture', 'Multithreading'],
          resources: ['Modern Java in Action', 'Platform Java Labs'],
          practiceTasks: ['Refactor monolithic script into clean OOP service layer', 'Implement thread-safe cache'],
          projects: ['High-Performance Multi-threaded Data Processor'],
          milestone: 'Advanced Java syntax and concurrency verified',
        },
        {
          phaseNumber: 2,
          title: 'Spring Boot 3 & REST Microservices',
          objective: 'Master Spring Boot dependency injection, JPA/Hibernate, and enterprise REST API design.',
          durationWeeks: 4,
          skills: ['Spring Boot', 'REST APIs', 'Spring Data JPA'],
          topics: ['Spring IoC & Beans', 'Controller Advice & Validation', 'JPA Relationships & Lazy Loading', 'DTO Mappings'],
          resources: ['Spring Framework In-Depth', 'REST API Best Practices'],
          practiceTasks: ['Build CRUD microservice with Spring Data JPA', 'Implement global error handling filters'],
          projects: ['Enterprise Employee & Job Application REST API'],
          milestone: 'Production-ready Spring Boot microservices operational',
        },
        {
          phaseNumber: 3,
          title: 'Relational Databases & Performance Tuning',
          objective: 'Design high-throughput PostgreSQL databases with ACID transactions and query optimization.',
          durationWeeks: 3,
          skills: ['PostgreSQL', 'SQL Optimization', 'Database Indexing'],
          topics: ['B-Tree Indexes & Explain Plans', 'ACID Transactions & Isolation Levels', 'Connection Pooling (HikariCP)'],
          resources: ['PostgreSQL High Performance Manual'],
          practiceTasks: ['Profile slow queries using EXPLAIN ANALYZE', 'Implement database migrations'],
          projects: ['Financial Ledger & Transaction Management System'],
          milestone: 'Database optimization and indexing mastery',
        },
        {
          phaseNumber: 4,
          title: 'Security, Docker & Production Cloud Readiness',
          objective: 'Secure APIs with Spring Security 6 / JWT and package services into Docker containers with CI/CD.',
          durationWeeks: 4,
          skills: ['Spring Security', 'Docker', 'JUnit & Mockito', 'CI/CD'],
          topics: ['Stateless JWT Authentication', 'Role-Based Access Control (RBAC)', 'Multi-stage Docker Builds', 'Unit & Integration Testing'],
          resources: ['Spring Security Architecture Guide', 'Docker for Backend Engineers'],
          practiceTasks: ['Write 85%+ code coverage unit tests with Mockito', 'Build automated GitHub Actions pipeline'],
          projects: ['Production-Grade Secure Microservices Ecosystem with Docker & Swagger'],
          milestone: `Job-Ready ${target} Portfolio Complete`,
        }
      );
    } else if (
      targetLower.includes('ai') ||
      targetLower.includes('ml') ||
      targetLower.includes('machine learning') ||
      targetLower.includes('data')
    ) {
      phases.push(
        {
          phaseNumber: 1,
          title: 'Python for AI & Scientific Computing',
          objective: 'Master vectorized computing, data wrangling, and numerical modeling with NumPy and Pandas.',
          durationWeeks: 3,
          skills: ['Python', 'NumPy', 'Pandas'],
          topics: ['Vector Operations', 'Data Cleaning & Feature Transformation', 'Exploratory Data Analysis'],
          resources: ['Python Data Science Handbook'],
          practiceTasks: ['Clean and normalize raw messy dataset', 'Perform statistical hypothesis testing'],
          projects: ['Exploratory Data Analysis & Visualization Suite'],
          milestone: 'Proficient in data preprocessing and numerical computing',
        },
        {
          phaseNumber: 2,
          title: 'Machine Learning & Deep Learning Foundations',
          objective: 'Build, train, and evaluate classical ML algorithms and deep neural networks in PyTorch.',
          durationWeeks: 4,
          skills: ['Scikit-Learn', 'PyTorch', 'Model Evaluation'],
          topics: ['Supervised & Unsupervised Learning', 'Backpropagation & Loss Functions', 'Cross-Validation & Hyperparameter Tuning'],
          resources: ['Deep Learning with PyTorch Book'],
          practiceTasks: ['Train gradient-boosted trees for classification', 'Build CNN image classifier from scratch'],
          projects: ['Predictive ML Pipeline for Talent & Job Matching'],
          milestone: 'Trained and validated custom deep learning models',
        },
        {
          phaseNumber: 3,
          title: 'Generative AI, RAG & Vector Embeddings',
          objective: 'Implement production Retrieval-Augmented Generation (RAG) using LangChain and pgvector.',
          durationWeeks: 4,
          skills: ['LangChain', 'Vector DBs (pgvector/Pinecone)', 'Embeddings'],
          topics: ['Chunking Strategies', 'Semantic Vector Search', 'Prompt Engineering & Few-Shot Prompting', 'Hallucination Mitigation'],
          resources: ['RAG Architecture Masterclass'],
          practiceTasks: ['Build vector embedding indexing pipeline for PDF documents', 'Evaluate LLM response accuracy'],
          projects: ['Enterprise Document Intelligence & RAG Chatbot'],
          milestone: 'End-to-end RAG and LLM orchestration deployed',
        },
        {
          phaseNumber: 4,
          title: 'MLOps, Model Serving & Cloud Deployment',
          objective: 'Deploy ML/AI models as scalable FastAPI services in Docker with monitoring and CI/CD.',
          durationWeeks: 3,
          skills: ['FastAPI', 'Docker', 'MLOps', 'Model Serving'],
          topics: ['Asynchronous API Serving', 'Model Quantization & ONNX Runtime', 'Monitoring Drift', 'CI/CD Automation'],
          resources: ['Production ML Deployment Handbook'],
          practiceTasks: ['Containerize PyTorch model in Docker', 'Set up automated inference benchmarks'],
          projects: ['Real-time Scalable AI Inference API with Docker & Monitoring'],
          milestone: `Job-Ready ${target} Engineer`,
        }
      );
    } else {
      // Full Stack / Frontend / General Software Engineer
      phases.push(
        {
          phaseNumber: 1,
          title: 'Modern TypeScript & Frontend Foundations',
          objective: 'Master TypeScript strict typing, modern React hooks, and Next.js App Router fundamentals.',
          durationWeeks: 3,
          skills: ['TypeScript', 'React', 'Tailwind CSS'],
          topics: ['Generics & Utility Types', 'Component Lifecycle & Custom Hooks', 'Server Components vs Client Components'],
          resources: ['TypeScript Handbook', 'Next.js App Router Docs'],
          practiceTasks: ['Build reusable UI design system in Tailwind', 'Implement custom state management hook'],
          projects: ['Interactive Component Design System & Dashboard Shell'],
          milestone: 'Mastery of modern React & TypeScript UI architecture',
        },
        {
          phaseNumber: 2,
          title: 'Scalable Backend APIs & Database Modeling',
          objective: 'Design RESTful APIs, relational Prisma schemas, and secure authentication flows.',
          durationWeeks: 4,
          skills: ['Node.js / Next.js API Routes', 'PostgreSQL', 'Prisma ORM'],
          topics: ['Relational Schema Design', 'JWT Authentication & RBAC', 'Zod Validation Middleware', 'Database Indexing'],
          resources: ['Prisma In-Depth Guide', 'REST Architecture Manual'],
          practiceTasks: ['Build secure authenticated API endpoint with Zod validation', 'Implement database transactions'],
          projects: ['Full Stack Professional Marketplace API'],
          milestone: 'Complete backend and database layer verified',
        },
        {
          phaseNumber: 3,
          title: 'System Design & State Optimization',
          objective: 'Optimize client performance, caching strategies, and integrate third-party APIs/AI.',
          durationWeeks: 3,
          skills: ['State Management', 'Performance Optimization', 'AI Integration'],
          topics: ['TanStack Query Caching & Mutations', 'Optimistic UI Updates', 'Streaming Responses & WebSockets'],
          resources: ['Web Performance Engineering Guide'],
          practiceTasks: ['Optimize Lighthouse score to 95+', 'Implement real-time notification drawer'],
          projects: ['High-Performance Real-Time Web Application with Live AI Assistance'],
          milestone: 'State management and system performance verified',
        },
        {
          phaseNumber: 4,
          title: 'Cloud Deployment, Testing & Portfolio Capstone',
          objective: 'Deploy production application with automated GitHub Actions, testing, and mentor audit.',
          durationWeeks: 3,
          skills: ['Docker', 'CI/CD (GitHub Actions)', 'Playwright Testing', 'Mentorship'],
          topics: ['Automated End-to-End Testing', 'Containerization with Multi-stage Builds', 'Portfolio Audit & Live Demo'],
          resources: ['DevOps for Full Stack Engineers'],
          practiceTasks: ['Pass 100% automated CI build tests', 'Conduct 1-on-1 code audit with senior mentor'],
          projects: ['Production-Grade Full Stack SaaS Platform with Complete CI/CD'],
          milestone: `Job-Ready ${target} Portfolio Complete`,
        }
      );
    }

    const totalWeeks = phases.reduce((sum, p) => sum + p.durationWeeks, 0);

    const rawOutput = {
      targetRole: target,
      summary: `Tailored ${phases.length}-phase roadmap generated from your existing competencies in ${cleanSkills.slice(0, 3).join(', ')} to achieve senior-readiness as a ${target}.`,
      currentLevel: analysis.currentLevel,
      estimatedDurationWeeks: totalWeeks,
      currentSkills: cleanSkills,
      skillGaps: analysis.skillGaps,
      phases,
      finalMilestone: `Fully Qualified ${target}`,
    };

    return roadmapSchema.parse(rawOutput);
  }
}
