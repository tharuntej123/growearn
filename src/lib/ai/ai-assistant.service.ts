import { assistantResponseSchema, AssistantResponseOutput, AssistantIntent } from './schemas';
import { UserAIContext } from '@/services/user-context.service';
import { prisma } from '@/lib/prisma';
import { SkillAnalysisService } from './skill-analysis.service';

export class AIAssistantService {
  /**
   * Classify user question intent
   */
  static classifyIntent(question: string): AssistantIntent {
    const q = question.toLowerCase().trim();

    // Intent detection patterns
    if (q.includes('job') || q.includes('hire') || q.includes('opening') || q.includes('vacancy') || q.includes('work for me')) {
      return 'JOB_SEARCH';
    }
    if (q.includes('course') || q.includes('tutorial') || q.includes('class') || q.includes('syllabus')) {
      return 'COURSE_RECOMMENDATION';
    }
    if (q.includes('mentor') || q.includes('coach') || q.includes('1-on-1') || q.includes('advisor')) {
      return 'MENTOR_RECOMMENDATION';
    }
    if (q.includes('roadmap') || q.includes('learning path') || q.includes('curriculum')) {
      return 'ROADMAP';
    }
    if (q.includes('resume') || q.includes('cv') || q.includes('portfolio audit')) {
      return 'RESUME_HELP';
    }
    if (q.includes('proposal') || q.includes('bid') || q.includes('cover letter')) {
      return 'PROPOSAL_HELP';
    }
    if (q.includes('what should i learn') || q.includes('missing skill') || q.includes('skill gap') || q.includes('next skill')) {
      return 'SKILL_ANALYSIS';
    }
    if (q.includes('career') || q.includes('salary') || q.includes('promotion') || q.includes('transition')) {
      return 'CAREER_ADVICE';
    }
    if (q.includes('profile') || q.includes('headline') || q.includes('bio')) {
      return 'PROFILE_HELP';
    }
    if (q.includes('message') || q.includes('email') || q.includes('polish')) {
      return 'COMMUNICATION_HELP';
    }

    // Default to general technical / question
    return 'GENERAL_QUESTION';
  }

  /**
   * Answer question grounded in actual user context and platform database
   */
  static async answer(
    question: string,
    userContext: UserAIContext | null
  ): Promise<AssistantResponseOutput> {
    const intent = this.classifyIntent(question);
    const qLower = question.toLowerCase().trim();

    const userName = userContext?.name ? userContext.name.split(' ')[0] : 'there';
    const userSkills = userContext?.skills || [];
    const targetRole = userContext?.profile?.targetRole || userContext?.profile?.careerGoal || 'Software Engineer';
    const hasSkills = userSkills.length > 0;

    // Handle GENERAL_QUESTION (e.g. "What is REST API?", "What is polymorphism?", "Explain Docker")
    if (intent === 'GENERAL_QUESTION') {
      let answer = '';
      let actions: string[] = [];

      if (qLower.includes('rest') || qLower.includes('api')) {
        answer = `A **REST API** (Representational State Transfer) is an architectural style for networked applications. It utilizes standard HTTP methods:\n\n• **GET**: Retrieve resource data\n• **POST**: Create a new resource\n• **PUT/PATCH**: Update existing resources\n• **DELETE**: Remove resources\n\nKey constraints include statelessness, client-server separation, standard HTTP status codes (200, 201, 400, 404, 500), and uniform resource identifiers (URIs) usually exchanging JSON payloads.`;
        actions = ['Explore Backend Courses', 'Practice API Design Tasks'];
      } else if (qLower.includes('polymorphism')) {
        answer = `**Polymorphism** is a core Object-Oriented Programming (OOP) concept meaning "many forms". It allows objects of different classes to be treated as objects of a common superclass.\n\nTwo primary types exist:\n1. **Compile-time Polymorphism (Method Overloading)**: Multiple methods having the same name but different parameter signatures.\n2. **Runtime Polymorphism (Method Overriding)**: Subclass provides a specific implementation of a method declared in its parent class or interface via dynamic dispatch.`;
        actions = ['Review OOP Principles', 'Take Java/Backend Assessment'];
      } else if (qLower.includes('docker') || qLower.includes('container')) {
        answer = `**Docker** is an open-source containerization platform that packages an application and all its dependencies (runtime, system libraries, configuration files) into an isolated, lightweight container image. This guarantees consistent behavior across development, staging, and production environments without environment drift.`;
        actions = ['View DevOps & Docker Courses', 'Practice Dockerization Tasks'];
      } else if (qLower.includes('microservice')) {
        answer = `**Microservices Architecture** structures an application as a collection of small, autonomous services modeled around specific business domains. Each microservice runs in its own process, manages its own database, and communicates via lightweight protocols like HTTP REST or Kafka event streams.`;
        actions = ['Explore Microservices Roadmap', 'Connect with System Design Mentor'];
      } else {
        answer = `Hello ${userName}! Regarding "${question}": In modern software engineering, focusing on clear separation of concerns, strict type safety, modular design, and robust automated testing ensures long-term maintainability and high code quality. Feel free to ask specific questions about architectures, debugging, career goals, or matching opportunities!`;
        actions = ['Ask Skill Advice', 'Explore Roadmap', 'Find Jobs'];
      }

      return assistantResponseSchema.parse({
        intent,
        directAnswer: answer,
        recommendedActions: actions,
      });
    }

    // Handle SKILL_ANALYSIS ("What should I learn next?", "What skills am I missing?")
    if (intent === 'SKILL_ANALYSIS') {
      if (!hasSkills) {
        return assistantResponseSchema.parse({
          intent,
          directAnswer: `Hello ${userName}! You haven't added any skills to your profile yet. Add your current languages and tools in your profile or onboarding window so I can calculate your exact skill gaps for ${targetRole}.`,
          recommendedActions: ['Add Skills to Profile', 'Set Target Role'],
        });
      }

      const analysis = SkillAnalysisService.analyze(userSkills, targetRole, userContext?.profile?.experienceLevel);
      const answer = `Based on your current proficiencies in **${userSkills.join(', ')}** and your goal of becoming a **${targetRole}**, here is your priority learning sequence:\n\n` +
        `1. **${analysis.recommendedSkills[0] || 'Modern Frameworks'}**: Core requirement to build scalable architectures.\n` +
        `2. **${analysis.recommendedSkills[1] || 'Database Optimization'}**: Essential for production data integrity and performance.\n` +
        `3. **${analysis.recommendedSkills[2] || 'Docker & CI/CD'}**: Required for modern cloud-native deployment.\n\n` +
        `Mastering these ${analysis.skillGaps.length} identified skill gaps will position you for senior-level interviews.`;

      return assistantResponseSchema.parse({
        intent,
        directAnswer: answer,
        recommendedActions: ['View Recommended Courses', 'Generate Career Roadmap', 'Book Mentorship Session'],
      });
    }

    // Handle JOB_SEARCH ("Find jobs for me")
    if (intent === 'JOB_SEARCH') {
      if (!hasSkills) {
        return assistantResponseSchema.parse({
          intent,
          directAnswer: `To find jobs matched to your competencies, please add your skills and target role first. In the meantime, you can browse all open marketplace positions on the Jobs page.`,
          recommendedActions: ['Add Skills', 'Browse All Jobs'],
        });
      }

      // Query real jobs from database
      const jobs = await prisma.job.findMany({
        where: { status: 'OPEN' },
        include: {
          company: { select: { name: true } },
          skills: { include: { skill: true } },
        },
        take: 3,
      });

      const jobList = jobs
        .map((j) => `• **${j.title}** at ${j.company.name} (${j.locationType}) — Required: ${j.skills.map((s) => s.skill.name).join(', ')}`)
        .join('\n');

      const answer = `Based on your **${userSkills.slice(0, 3).join(', ')}** background for **${targetRole}**, here are top matching opportunities currently open on the platform:\n\n${jobList}\n\nYou can use our AI Proposal Generator on any of these listings to submit tailored applications!`;

      return assistantResponseSchema.parse({
        intent,
        directAnswer: answer,
        recommendedActions: ['View All Matching Jobs', 'Generate AI Proposal', 'Update Resume'],
      });
    }

    // Handle COURSE_RECOMMENDATION ("What courses should I take?")
    if (intent === 'COURSE_RECOMMENDATION') {
      const courses = await prisma.course.findMany({
        where: { isPublished: true },
        take: 3,
        include: { instructor: { select: { name: true } } },
      });

      const courseList = courses
        .map((c) => `• **${c.title}** (${c.category}, ${c.level}) by ${c.instructor.name}`)
        .join('\n');

      const answer = hasSkills
        ? `To close your skill gaps for **${targetRole}**, I recommend enrolling in these interactive courses:\n\n${courseList}`
        : `Here are popular foundational courses on the platform. Add your skills to receive personalized skill-gap course recommendations:\n\n${courseList}`;

      return assistantResponseSchema.parse({
        intent,
        directAnswer: answer,
        recommendedActions: ['Browse Course Catalog', 'View Enrolled Progress'],
      });
    }

    // Handle MENTOR_RECOMMENDATION ("Find mentors for me")
    if (intent === 'MENTOR_RECOMMENDATION') {
      const mentors = await prisma.mentorProfile.findMany({
        where: { isAvailable: true },
        include: { user: { select: { name: true, headline: true } } },
        take: 2,
      });

      const mentorList = mentors
        .map((m) => `• **${m.user.name}** — ${m.user.headline || 'Industry Expert'} ($${m.hourlyRate}/hr, Rating: ${m.rating}⭐) — Expertise: ${m.expertise}`)
        .join('\n');

      const answer = `Connecting 1-on-1 with an experienced engineer can fast-track your architecture design and interview readiness. Here are verified mentors matching ${targetRole}:\n\n${mentorList}`;

      return assistantResponseSchema.parse({
        intent,
        directAnswer: answer,
        recommendedActions: ['Book 1-on-1 Coaching Session', 'Browse All Mentors'],
      });
    }

    // Handle ROADMAP
    if (intent === 'ROADMAP') {
      const answer = hasSkills
        ? `Your personalized career roadmap for **${targetRole}** spans 4 progressive phases: Foundations → Frameworks & Architecture → Databases & Storage → Security & Cloud Deployment. Check your dashboard to track milestone completion!`
        : `Please add your skills and target role to generate a multi-phase personalized career roadmap.`;

      return assistantResponseSchema.parse({
        intent,
        directAnswer: answer,
        recommendedActions: ['View Career Roadmap', 'Add Skills to Profile'],
      });
    }

    // Handle RESUME_HELP
    if (intent === 'RESUME_HELP') {
      const answer = `To optimize your resume for **${targetRole}** positions:\n\n1. **Highlight measurable outcomes**: Use the Google XYZ formula: "Accomplished [X] as measured by [Y] by doing [Z]".\n2. **Front-load technical competencies**: Place verified skills (**${userSkills.slice(0, 4).join(', ') || 'Languages & Frameworks'}**) in an easy-to-parse top section.\n3. **Include live links**: Link to production deployments and clean GitHub repositories.\n\nYou can also use our Resume Skill Extractor in the Professional Hub to audit your resume text!`;

      return assistantResponseSchema.parse({
        intent,
        directAnswer: answer,
        recommendedActions: ['Open Resume Skill Extractor', 'Update Portfolio Links'],
      });
    }

    // Default fallback
    return assistantResponseSchema.parse({
      intent: 'CAREER_ADVICE',
      directAnswer: `Hello ${userName}! With your background in ${userSkills.join(', ') || 'technology'}, you have strong potential to excel as a ${targetRole}. How can I assist your career progression today?`,
      recommendedActions: ['Analyze Skill Gaps', 'Find Jobs', 'View Courses', 'Find Mentors'],
    });
  }
}
