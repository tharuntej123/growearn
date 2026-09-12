import { assistantResponseSchema, AssistantResponseOutput, AssistantIntent } from './schemas';
import { UserAIContext } from '@/services/user-context.service';
import { prisma } from '@/lib/prisma';
import { SkillAnalysisService } from './skill-analysis.service';
import { CareerRoadmapService } from './roadmap.service';
import { LangChainRAGService } from './rag/langchain-agent';

export class AIAssistantService {
  static classifyIntent(question: string): AssistantIntent {
    const q = question.toLowerCase().trim();

    if (
      q.includes('roadmap') ||
      q.includes('road map') ||
      q.includes('learning path') ||
      q.includes('curriculum') ||
      q.includes('how to become') ||
      q.includes('steps to become') ||
      q.includes('path to become') ||
      q.includes('guide to become') ||
      q.includes('learning flow') ||
      q.includes('study plan') ||
      q.includes('career path') ||
      q.includes('step by step') ||
      q.includes('syllabus') ||
      q.includes('explore roadmap') ||
      q.includes('view career roadmap') ||
      q.includes('view roadmap')
    ) {
      return 'ROADMAP';
    }

    if (
      q.includes('what should i learn') ||
      q.includes('missing skill') ||
      q.includes('skill gap') ||
      q.includes('next skill') ||
      q.includes('which skill') ||
      q.includes('analyze skill') ||
      q.includes('skills to learn')
    ) {
      return 'SKILL_ANALYSIS';
    }

    if (
      q.includes('job') ||
      q.includes('hire') ||
      q.includes('opening') ||
      q.includes('vacancy') ||
      q.includes('work for me') ||
      q.includes('gigs') ||
      q.includes('find jobs')
    ) {
      return 'JOB_SEARCH';
    }
    if (
      q.includes('course') ||
      q.includes('tutorial') ||
      q.includes('class') ||
      q.includes('video lesson')
    ) {
      return 'COURSE_RECOMMENDATION';
    }
    if (
      q.includes('mentor') ||
      q.includes('coach') ||
      q.includes('1-on-1') ||
      q.includes('advisor') ||
      q.includes('mock interview') ||
      q.includes('these guys') ||
      q.includes('these people') ||
      q.includes('who is available') ||
      q.includes('who are available') ||
      q.includes('available in the application') ||
      q.includes('available on growearn') ||
      q.includes('available on groearn') ||
      q.includes('available in growearn') ||
      q.includes('available in groearn') ||
      q.includes('sarah') ||
      q.includes('david kim') ||
      q.includes('priya') ||
      q.includes('michael chang') ||
      q.includes('marcus') ||
      q.includes('elena') ||
      q.includes('instructors')
    ) {
      return 'MENTOR_RECOMMENDATION';
    }
    if (q.includes('resume') || q.includes('cv') || q.includes('portfolio audit')) {
      return 'RESUME_HELP';
    }
    if (q.includes('proposal') || q.includes('bid') || q.includes('cover letter')) {
      return 'PROPOSAL_HELP';
    }
    if (q.includes('salary') || q.includes('promotion') || q.includes('transition')) {
      return 'CAREER_ADVICE';
    }
    if (q.includes('profile') || q.includes('headline') || q.includes('bio')) {
      return 'PROFILE_HELP';
    }
    if (q.includes('message') || q.includes('email') || q.includes('polish')) {
      return 'COMMUNICATION_HELP';
    }

    return 'GENERAL_QUESTION';
  }

  private static formatRoadmapFlow(
    role: string,
    roadmap: ReturnType<typeof CareerRoadmapService.generate>
  ): string {
    const p = roadmap.phases;

    const pad = (text: string, len: number) => {
      const truncated = text.length > len ? text.slice(0, len - 3) + '...' : text;
      return truncated + ' '.repeat(Math.max(0, len - truncated.length));
    };

    const p1Title = pad(`Phase 1: ${p[0]?.title || 'Foundations'}`, 28);
    const p2Title = pad(`Phase 2: ${p[1]?.title || 'Core Architecture'}`, 28);
    const p3Title = pad(`Phase 3: ${p[2]?.title || 'Databases & Systems'}`, 28);
    const p4Title = pad(`Phase 4: ${p[3]?.title || 'Production & Capstone'}`, 28);

    const flowDiagram = [
      '```text',
      '┌──────────────────────────────┐        ┌──────────────────────────────┐',
      `│ ${p1Title} │  ───►  │ ${p2Title} │`,
      '└──────────────────────────────┘        └──────────────────────────────┘',
      '               │',
      '               ▼',
      '┌──────────────────────────────┐        ┌──────────────────────────────┐',
      `│ ${p3Title} │  ───►  │ ${p4Title} │`,
      '└──────────────────────────────┘        └──────────────────────────────┘',
      '```',
    ].join('\n');

    let output = `🗺️ **Step-by-Step Learning & Career Roadmap for ${role}**\n\n`;
    output += `**Timeline**: ${roadmap.estimatedDurationWeeks} Weeks Total • **Target Level**: ${roadmap.currentLevel} • **Milestones**: ${p.length} Phases\n\n`;
    output += `### 🔄 Visual Learning Flow:\n\n`;
    output += `${flowDiagram}\n\n`;
    output += `---\n\n`;

    p.forEach((phase) => {
      output += `### 📍 **Phase ${phase.phaseNumber}: ${phase.title}** *(${phase.durationWeeks} Weeks)*\n\n`;
      output += `• **🎯 Core Objective**: ${phase.objective}\n`;
      output += `• **🛠️ Key Skills & Tools**: ${phase.skills.map((s) => `\`${s}\``).join(', ')}\n`;
      output += `• **📚 Essential Topics**:\n`;
      phase.topics.forEach((t) => {
        output += `  - ${t}\n`;
      });
      output += `• **💻 Practice Tasks**: ${phase.practiceTasks.join(' • ')}\n`;
      output += `• **🚀 Milestone Project**: **${phase.projects[0] || 'Core Domain Project'}**\n`;
      output += `• **✅ Phase Verification**: *${phase.milestone}*\n\n`;
      output += `---\n\n`;
    });

    output += `🏆 **Final Milestone Outcome**: **${roadmap.finalMilestone}**\n`;
    output += `Master these phases sequentially to build production-grade competencies and a standout engineering portfolio!`;

    return output;
  }

  static async answer(
    question: string,
    userContext: UserAIContext | null
  ): Promise<AssistantResponseOutput> {
    const intent = this.classifyIntent(question);
    const qLower = question.toLowerCase().trim();

    const userName = userContext?.name ? userContext.name.split(' ')[0] : 'there';
    const userSkills = userContext?.skills || [];
    const exp = userContext?.profile?.experienceLevel || 'Intermediate';
    const goal = userContext?.profile?.careerGoal || 'Advance Engineering Career';
    const hasSkills = userSkills.length > 0;

    let detectedRole =
      userContext?.profile?.targetRole ||
      userContext?.profile?.careerGoal ||
      'Full Stack Engineer';

    if (
      qLower.includes('backend') ||
      qLower.includes('java') ||
      qLower.includes('spring') ||
      qLower.includes('node') ||
      qLower.includes('express') ||
      qLower.includes('golang') ||
      qLower.includes('go ') ||
      qLower.includes('c#') ||
      qLower.includes('.net')
    ) {
      detectedRole = 'Backend Developer';
    } else if (
      qLower.includes('frontend') ||
      qLower.includes('react') ||
      qLower.includes('next') ||
      qLower.includes('vue') ||
      qLower.includes('angular') ||
      qLower.includes('ui/ux') ||
      qLower.includes('css')
    ) {
      detectedRole = 'Frontend Engineer';
    } else if (
      qLower.includes('ai') ||
      qLower.includes('ml') ||
      qLower.includes('machine learning') ||
      qLower.includes('deep learning') ||
      qLower.includes('data science') ||
      qLower.includes('llm') ||
      qLower.includes('genai')
    ) {
      detectedRole = 'AI & Machine Learning Engineer';
    } else if (
      qLower.includes('devops') ||
      qLower.includes('cloud') ||
      qLower.includes('docker') ||
      qLower.includes('kubernetes') ||
      qLower.includes('k8s') ||
      qLower.includes('aws') ||
      qLower.includes('terraform')
    ) {
      detectedRole = 'DevOps & Cloud Engineer';
    } else if (
      qLower.includes('full stack') ||
      qLower.includes('fullstack') ||
      qLower.includes('software engineer')
    ) {
      detectedRole = 'Full Stack Engineer';
    }

    if (LangChainRAGService.isLLMAvailable()) {
      const ragResult = await LangChainRAGService.executeRAG(
        question,
        userContext,
        () => this.synthesizeGroundedAnswer(question, userContext, intent, detectedRole)
      );

      if (ragResult.isLLMPowered && ragResult.answer) {
        return assistantResponseSchema.parse({
          intent,
          directAnswer: ragResult.answer,
          recommendedActions: [],
        });
      }
    }

    const answer = await this.synthesizeGroundedAnswer(question, userContext, intent, detectedRole);
    return assistantResponseSchema.parse({
      intent,
      directAnswer: answer,
      recommendedActions: [],
    });
  }

  private static async synthesizeGroundedAnswer(
    question: string,
    userContext: UserAIContext | null,
    intent: AssistantIntent,
    detectedRole: string
  ): Promise<string> {
    const qLower = question.toLowerCase().trim();
    const userName = userContext?.name ? userContext.name.split(' ')[0] : 'there';
    const userSkills = userContext?.skills || [];
    const exp = userContext?.profile?.experienceLevel || 'Intermediate';
    const goal = userContext?.profile?.careerGoal || 'Advance Engineering Career';
    const hasSkills = userSkills.length > 0;

    if (intent === 'ROADMAP') {
      const roadmap = CareerRoadmapService.generate(userSkills, detectedRole, exp, goal);
      let baseOutput = this.formatRoadmapFlow(detectedRole, roadmap);

      try {
        const [topCourses, topMentors] = await Promise.all([
          prisma.course.findMany({
            take: 2,
            select: { title: true, price: true, category: true },
          }).catch(() => []),
          prisma.mentorProfile.findMany({
            take: 2,
            include: { user: { select: { name: true, headline: true } } },
          }).catch(() => []),
        ]);

        if (topCourses.length > 0 || topMentors.length > 0) {
          baseOutput += `\n\n---\n\n### 🎓 Top Curated Courses & Mentors for this Roadmap:\n\n`;

          if (topCourses.length > 0) {
            baseOutput += `**📚 Recommended Courses**:\n`;
            topCourses.forEach((c) => {
              baseOutput += `• **${c.title}** *(${c.category})* — ${c.price > 0 ? `$${c.price}` : 'Free'}\n`;
            });
            baseOutput += `\n`;
          }

          if (topMentors.length > 0) {
            baseOutput += `**👨‍🏫 Matched Expert Mentors**:\n`;
            topMentors.forEach((m) => {
              baseOutput += `• **${m.user?.name || 'Expert Mentor'}**: ${m.user?.headline || 'Tech Lead & Career Coach'}\n`;
            });
          }
        }
      } catch {
      }

      baseOutput += `\n\n💡 *Tip: You can also manually customize your roadmap and skills at any time from your **Learner Dashboard**.*`;
      return baseOutput;
    }

    if (intent === 'SKILL_ANALYSIS') {
      const analysis = SkillAnalysisService.analyze(userSkills, detectedRole, exp);

      let answer = `📊 **Skill Gap & Priority Analysis for ${detectedRole}**\n\n`;
      if (hasSkills) {
        answer += `• **Current Verified Strengths**: ${analysis.strengths.map((s) => `\`${s}\``).join(', ')}\n`;
        answer += `• **Current Competency Level**: **${analysis.currentLevel}**\n\n`;
        answer += `### 🎯 Priority Learning Sequence to Close Skill Gaps:\n`;
        analysis.skillGaps.forEach((gap, idx) => {
          answer += `${idx + 1}. **${gap}**: Essential for enterprise ${detectedRole.toLowerCase()} architectures and technical interviews.\n`;
        });
        answer += `\nMastering these high-priority competencies will position you for high-impact roles and senior-level interviews!`;
      } else {
        answer += `You have not added technical skills to your profile yet. Here are the core required competencies to master for **${detectedRole}**:\n\n`;
        analysis.skillGaps.forEach((gap, idx) => {
          answer += `${idx + 1}. **${gap}**\n`;
        });
        answer += `\nYou can update your skills anytime in your profile to receive personalized pacing!`;
      }

      return answer;
    }

    if (intent === 'GENERAL_QUESTION') {
      let answer = '';

      if (qLower.includes('python')) {
        answer = `**Python** is a high-level, dynamically typed, multi-paradigm programming language celebrated for its clear, readable syntax, vast standard library, and dominance in **AI/ML, Data Engineering, Backend APIs, and Automation**.

### 🌟 Core Strengths & Use Cases:
1. **AI, Machine Learning & Data Science**: Primary language for \`PyTorch\`, \`TensorFlow\`, \`HuggingFace\`, \`scikit-learn\`, \`NumPy\`, and \`Pandas\`.
2. **High-Performance Web Backends**: Modern asynchronous frameworks like **FastAPI** and enterprise batteries-included frameworks like **Django**.
3. **Scripting, DevOps & Cloud Automation**: Native choice for AWS Lambda, cloud orchestration, data scraping, and infrastructure tooling.

### 💻 Code Example: Modern Asynchronous API with FastAPI & Pydantic
\`\`\`python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List
import asyncio

app = FastAPI(title="Groearn AI Pipeline API")

class CandidateProfile(BaseModel):
    name: str
    skills: List[str]
    years_experience: int = Field(..., ge=0)

@app.post("/api/candidates/analyze")
async def analyze_candidate(profile: CandidateProfile):
    # Simulate async AI matching
    await asyncio.sleep(0.05)
    match_score = min(100, len(profile.skills) * 15 + profile.years_experience * 5)
    return {
        "status": "success",
        "candidate": profile.name,
        "match_score": f"{match_score}%",
        "eligible": match_score >= 70
    }
\`\`\`

### ⚡ Key Architectural Concepts in Python:
• **GIL (Global Interpreter Lock)**: A mutex that protects access to Python objects, preventing multiple native threads from executing Python bytecodes at once (CPython). Multi-core parallelism is achieved via \`multiprocessing\` or asynchronous I/O via \`asyncio\`.
• **Dynamic Typing with Optional Type Hints**: Modern Python ($\ge 3.10$) uses type annotations (\`str\`, \`List[int]\`, \`Union\`) checked statically via \`mypy\` or \`pyright\`.
• **Generators & Iterators**: Memory-efficient stream processing using the \`yield\` keyword.`;
      } else if (qLower.includes('javascript') || qLower.includes('typescript') || qLower.includes('nodejs') || qLower.includes('node.js')) {
        answer = `**TypeScript & JavaScript** form the backbone of modern web and full-stack cloud software engineering.

### 🚀 Key Technical Pillars:
1. **Event Loop & Single-Threaded Non-Blocking I/O**: The V8 runtime executes synchronous JS code on the main call stack and offloads I/O (network, filesystem) to the libuv thread pool.
2. **TypeScript Type System**: Adds static type-checking, structural typing (duck typing), generics, union types, and utility types (\`Partial\`, \`Pick\`, \`Omit\`) at compile time without runtime performance overhead.
3. **Modern Async**: \`async/await\` layered over Promises with \`Promise.all()\`, \`Promise.allSettled()\`, and microtask scheduling.

### 💻 TypeScript Generic Pattern Example:
\`\`\`typescript
export interface APIResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
}

export async function fetchResource<T>(url: string): Promise<APIResponse<T>> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(\`HTTP Error: \${res.status}\`);
  const data: T = await res.json();
  return { success: true, data, timestamp: new Date().toISOString() };
}
\`\`\``;
      } else if (qLower.includes('rest') || qLower.includes('api') || qLower.includes('http')) {
        answer = `A **REST API** (Representational State Transfer) is a stateless architectural style for networked web services using HTTP.

### 🏛️ Core Architectural Constraints:
1. **Client-Server Separation**: UI and client state are decoupled from backend data storage.
2. **Stateless Operations**: Every request contains all context needed for execution. The server stores no client session state.
3. **Uniform Interface**: Resources are uniquely identified by URIs and manipulated via standard HTTP methods.
4. **Layered System**: Clients cannot tell if they are connected directly to the end server or an intermediate proxy/load balancer.

### 🛠️ Standard HTTP Methods:
• \`GET /api/resources\`: Retrieve resource list (Safe, Idempotent).
• \`POST /api/resources\`: Create a new resource record (Non-Idempotent).
• \`PUT /api/resources/:id\`: Full replacement of the target resource (Idempotent).
• \`PATCH /api/resources/:id\`: Partial update of specific fields (Idempotent).
• \`DELETE /api/resources/:id\`: Remove the target resource (Idempotent).

### 🏷️ Standard Status Code Conventions:
• \`200 OK\` (Success), \`201 Created\` (Resource created), \`204 No Content\` (Deleted).
• \`400 Bad Request\` (Validation failed), \`401 Unauthorized\` (Missing token), \`403 Forbidden\` (Insufficient permissions), \`404 Not Found\`.
• \`500 Internal Server Error\` (Unhandled exception).`;
      } else if (qLower.includes('polymorphism') || qLower.includes('oop')) {
        answer = `**Polymorphism** is an Object-Oriented Programming (OOP) principle meaning "many forms". It allows objects of different concrete subtypes to be treated through a unified interface.

### 1. Compile-Time Polymorphism (Method Overloading)
Multiple methods in the same class share the same name with different parameter signatures:
\`\`\`java
public class Calculator {
    public int add(int a, int b) { return a + b; }
    public double add(double a, double b) { return a + b; }
}
\`\`\`

### 2. Runtime Polymorphism (Method Overriding & Dynamic Dispatch)
Subclasses provide specific implementations of methods defined in an interface or parent class:
\`\`\`java
public interface PaymentProcessor {
    void process(double amount);
}

public class StripeProcessor implements PaymentProcessor {
    @Override
    public void process(double amount) {
        System.out.println("Processing $" + amount + " via Stripe API");
    }
}
\`\`\`

### 💡 Why It Matters:
Decouples client business logic from concrete implementations, adhering to the **Open/Closed Principle** (open for extension, closed for modification).`;
      } else if (qLower.includes('docker') || qLower.includes('container')) {
        answer = `**Docker** is a containerization platform that packages an application along with its exact runtime, system libraries, configuration files, and dependencies into an immutable image.

### 📦 Key Components:
• **Dockerfile**: Declarative recipe specifying base image, dependencies, and entrypoint.
• **Image**: Read-only, immutable snapshot of the packaged application.
• **Container**: Lightweight, isolated, runnable instance of an image.

### 🚀 Why Docker is Essential in Production:
1. **Eliminates "Works on my machine" issues**: Guarantees bit-for-bit identical execution across local dev, staging, and production Kubernetes clusters.
2. **Lightweight Isolation**: Shares the host OS kernel via Linux namespaces and cgroups instead of running a full hypervisor and guest OS.
3. **Multi-Stage Builds**: Compiles dependencies in build stages and copies only minimal binaries into tiny production images (e.g., Alpine / Distroless).`;
      } else if (qLower.includes('kubernetes') || qLower.includes('k8s')) {
        answer = `**Kubernetes (K8s)** is an open-source container orchestration system for automating application deployment, scaling, and management.

### 🏗️ Architecture:
1. **Control Plane**:
   • \`kube-apiserver\`: Central REST API entrypoint.
   • \`etcd\`: Distributed key-value store for cluster state.
   • \`kube-scheduler\`: Assigns Pods to available Worker Nodes.
   • \`kube-controller-manager\`: Enforces desired state (restarts failed pods).
2. **Worker Nodes**:
   • \`kubelet\`: Node agent ensuring containers are running in Pods.
   • \`kube-proxy\`: Network proxy managing service IP routing.
   • \`Container Runtime\`: Docker/containerd.

### 🔑 Core Objects:
• **Pod**: Smallest deployable unit (one or more co-located containers).
• **Deployment**: Declarative updates for Pods and ReplicaSets.
• **Service**: Stable virtual IP and load balancer across dynamic Pods.
• **Ingress**: HTTP/HTTPS routing into cluster services.`;
      } else if (qLower.includes('microservice') || qLower.includes('system design')) {
        answer = `**Microservices Architecture** decomposes an application into loosely coupled, independently deployable services organized around specific business domains.

### 📐 Core Architectural Patterns:
1. **Database-per-Service**: Each service owns its private database to prevent tight coupling and shared data bottlenecks.
2. **Communication Strategies**:
   • **Synchronous**: REST APIs or gRPC for immediate request-response calls.
   • **Asynchronous**: Kafka or RabbitMQ event buses for decoupled event-driven workflows.
3. **Resilience & Fault Tolerance**:
   • **Circuit Breakers**: Prevent cascading outages when downstream dependencies fail.
   • **API Gateway**: Handles authentication, rate limiting, and request routing.
   • **Distributed Tracing**: OpenTelemetry / Jaeger for tracking requests across service boundaries.`;
      } else if (qLower.includes('kafka') || qLower.includes('event')) {
        answer = `**Apache Kafka** is a distributed, horizontally scalable, append-only event streaming platform designed for high-throughput and fault tolerance.

### ⚡ Core Concepts:
• **Topics & Partitions**: Topics are partitioned across cluster brokers, enabling parallel consumer processing.
• **Producers**: Publish events to specific topics with partitioning keys.
• **Consumers & Consumer Groups**: Consumer instances in a group read distinct partitions in parallel, tracking offsets.
• **Durability**: Messages are persisted to disk and replicated across cluster nodes with configurable retention policies.`;
      } else if (
        qLower.includes('index') ||
        qLower.includes('database') ||
        qLower.includes('sql') ||
        qLower.includes('postgres') ||
        qLower.includes('acid')
      ) {
        answer = `**Database Indexing** creates specialized data structures (typically B-Trees or Hash/GIN) that allow relational database engines to locate matching rows in $O(\\log N)$ time instead of performing expensive full-table sequential scans ($O(N)$).

### 🔍 Best Practices for SQL & PostgreSQL:
1. **Index Query Filter & Join Columns**:
   \`\`\`sql
   CREATE INDEX idx_jobs_company_status ON jobs(company_id, status);
   \`\`\`
2. **Analyze Execution Plans**:
   Use \`EXPLAIN ANALYZE SELECT ...\` to inspect whether the query planner uses an *Index Scan* vs *Seq Scan*.
3. **Understand Write Overhead**:
   Every index accelerates \`SELECT\` queries but adds write overhead to \`INSERT\`, \`UPDATE\`, and \`DELETE\` operations.
4. **ACID Guarantees**:
   • **Atomicity**: All or nothing transaction execution.
   • **Consistency**: Database transitions from one valid state to another.
   • **Isolation**: Concurrent transactions do not interfere (Read Committed, Serializable).
   • **Durability**: Committed data survives system crashes.`;
      } else if (qLower.includes('react') || qLower.includes('next')) {
        answer = `**Next.js App Router** is a React framework designed for high-performance full-stack web applications with React Server Components (RSC).

### 🚀 Core Architecture:
1. **React Server Components (RSC)**: Render on the server by default, reducing client JavaScript bundle size to zero for static content and enabling direct database querying.
2. **Client Components (\`'use client'\`)**: Hydrate in the browser to handle interactivity, state (\`useState\`), and DOM events.
3. **Streaming & Suspense**: Progressively stream UI components to the browser as data resolves.
4. **Server Actions**: Server-side functions invoked directly from client components with automatic revalidation.`;
      } else if (
        qLower.includes('groearn') ||
        qLower.includes('growearn') ||
        (qLower.includes('what is') && (qLower.includes('this platform') || qLower.includes('this app') || qLower.includes('platform'))) ||
        qLower.includes('how does groearn work') ||
        qLower.includes('how does growearn work')
      ) {
        answer = `**Groearn** is an all-in-one AI career ecosystem and talent platform connecting 4 distinct profiles:

1. 👨‍🎓 **Learner**: Explore in-demand tech roles, generate customized AI Roadmaps, track competencies in "What I Learn", and manage resumes.
2. 👨‍🏫 **Mentor**: Conduct 1-on-1 coaching sessions and author courses with syllabus and study material uploads.
3. 💼 **Professional**: Access freelance & full-time job listings and generate tailored proposals using the 1-Click AI Proposal Generator.
4. 🏢 **Company**: Post jobs with real-time field validation, source verified candidates, and review AI candidate matching.
5. 🌐 **Community Feed**: Connect with peers, share knowledge, and post updates across all roles.

You can ask me to generate a personalized career roadmap, recommend courses & mentors, or explain any technical topic!`;
      } else {
        answer = `Hello ${userName}! Regarding "${question}":

Here is a quick breakdown to guide you:
• If you're looking for **programming language explanations** (Python, Java, TypeScript, Go, Rust), ask for syntax guides, architectural overviews, or code examples.
• If you're looking for **career roadmaps** or learning paths, tell me your target role (e.g. *Full Stack*, *AI/ML*, *Backend*, *DevOps*).
• If you're looking for **mentors** or **courses**, check out the verified directory on the Mentors & Courses pages or ask me for top recommendations!`;
      }

      return answer;
    }

    if (intent === 'JOB_SEARCH') {
      const jobs = await prisma.job.findMany({
        where: { status: 'OPEN' },
        include: {
          company: { select: { name: true } },
          skills: { include: { skill: true } },
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
      });

      if (jobs.length === 0) {
        return `There are currently no open job listings matching "${detectedRole}". Check the Jobs page for upcoming opportunities or post new requirements from your Company dashboard!`;
      }

      let answer = `💼 **Open Opportunities Matched for ${detectedRole}**\n\n`;
      jobs.forEach((j) => {
        answer += `• **${j.title}** at **${j.company.name}** (${j.locationType} • ${j.jobType.replace('_', ' ')})\n`;
        answer += `  Salary: $${j.minSalary.toLocaleString()} - $${j.maxSalary.toLocaleString()} ${j.currency}\n`;
        answer += `  Skills: ${j.skills.map((s) => `\`${s.skill.name}\``).join(', ')}\n\n`;
      });
      answer += `You can review full descriptions and submit tailored applications on the Jobs tab!`;

      return answer;
    }

    if (intent === 'COURSE_RECOMMENDATION') {
      const courses = await prisma.course.findMany({
        where: { isPublished: true },
        take: 4,
        include: { instructor: { select: { name: true } } },
        orderBy: { rating: 'desc' },
      });

      let answer = `📚 **Recommended Interactive Courses for ${detectedRole}**\n\n`;
      courses.forEach((c) => {
        answer += `• **${c.title}** (${c.category} • ${c.level}) — Instructor: **${c.instructor.name}** (⭐ ${c.rating}) — ${c.price > 0 ? `$${c.price}` : 'Free'}\n`;
      });
      answer += `\nExplore interactive course modules and video lessons on the Courses page!`;

      return answer;
    }

    if (intent === 'MENTOR_RECOMMENDATION') {
      const mentors = await prisma.mentorProfile.findMany({
        where: { isAvailable: true },
        include: { user: { select: { name: true, headline: true, bio: true } } },
        take: 6,
        orderBy: { rating: 'desc' },
      });

      let answer = `Yes! The following verified industry leaders and mentors are actively available on **Groearn** for 1-on-1 coaching, architecture reviews, and mock interviews:\n\n`;
      mentors.forEach((m) => {
        answer += `• **${m.user.name}** — ${m.user.headline || 'Senior Architect'}\n`;
        answer += `  Expertise: \`${m.expertise}\` • Rate: **$${m.hourlyRate}/hr** • Rating: **⭐ ${m.rating}**\n\n`;
      });
      answer += `You can explore their full profiles, verified reviews, and book 1-on-1 sessions directly on the **Mentors** page!`;

      return answer;
    }

    if (intent === 'RESUME_HELP') {
      const answer = `📄 **Actionable Resume Optimization Guidelines for ${detectedRole}**

1. **Quantify Measurable Achievements**:
   Use the Google XYZ format: *"Architected [X] resulting in [Y]% latency reduction by implementing [Z]"*.
2. **Prioritize Technical Competencies**:
   Group your verified stack into clear subsections: Languages, Frameworks, Databases, and Cloud/DevOps tools.
3. **Link Production Work & GitHub Repositories**:
   Ensure all portfolio projects include live deployed URLs and clean, well-documented GitHub READMEs.
4. **Keyword Alignment**:
   Tailor your resume headline and summaries to the exact core requirements of target roles.`;

      return answer;
    }

    return `Hello ${userName}! With your background in ${userSkills.join(', ') || 'modern software engineering'}, I can help you generate comprehensive career roadmaps, analyze skill gaps for target roles, explain complex technical architectures, or discover matching jobs. What would you like to explore?`;
  }
}
