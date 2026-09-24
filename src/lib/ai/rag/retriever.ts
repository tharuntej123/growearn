import { prisma } from '@/lib/prisma';
import { UserAIContext } from '@/services/user-context.service';

export interface RAGDocument {
  source: 'database_jobs' | 'database_courses' | 'database_mentors' | 'user_profile' | 'knowledge_base';
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export class RAGRetriever {
  static async retrieveContext(
    question: string,
    userContext: UserAIContext | null
  ): Promise<RAGDocument[]> {
    const qLower = question.toLowerCase();
    const documents: RAGDocument[] = [];

    documents.push({
      source: 'knowledge_base',
      title: 'Growearn Ecosystem & Platform Overview',
      content: `Growearn is a next-generation AI-powered career ecosystem and talent platform connecting 4 distinct roles:
1. Learner: In-demand market roles, personalized AI Career Roadmaps, "What I Learn" skill tracking, and resume management (max 1 MB).
2. Mentor: 1-on-1 coaching sessions, career guidance, and course authoring with syllabus/material uploads (max 5 MB).
3. Professional: Matched freelance & full-time job marketplace, 1-Click AI Proposal Generator, and project bidding.
4. Company: Post jobs with live validation, source verified candidates, and review AI candidate matching.
Community Feed: Cross-role knowledge sharing with verified role badges on every post.`,
    });

    if (userContext) {
      const skills = userContext.skills?.join(', ') || 'None specified';
      const role = userContext.profile?.targetRole || userContext.profile?.careerGoal || 'Software Engineer';
      const exp = userContext.profile?.experienceLevel || 'Intermediate';

      documents.push({
        source: 'user_profile',
        title: `User Profile: ${userContext.name}`,
        content: `Candidate Name: ${userContext.name}\nTarget Role: ${role}\nExperience Level: ${exp}\nVerified Skills: ${skills}\nBio: ${userContext.bio || 'N/A'}`,
        metadata: { userId: userContext.id, role, exp },
      });
    }

    const isMentorQuery =
      qLower.includes('mentor') ||
      qLower.includes('coach') ||
      qLower.includes('guy') ||
      qLower.includes('people') ||
      qLower.includes('who') ||
      qLower.includes('available') ||
      qLower.includes('instructor') ||
      qLower.includes('sarah') ||
      qLower.includes('david') ||
      qLower.includes('priya') ||
      qLower.includes('michael') ||
      qLower.includes('marcus') ||
      qLower.includes('elena') ||
      qLower.includes('growearn') ||
      qLower.includes('groearn') ||
      qLower.includes('application') ||
      qLower.includes('platform');

    if (isMentorQuery) {
      try {
        const mentors = await prisma.mentorProfile.findMany({
          where: { isAvailable: true },
          include: { user: { select: { name: true, headline: true, bio: true } } },
          take: 6,
          orderBy: { rating: 'desc' },
        });

        mentors.forEach((m) => {
          documents.push({
            source: 'database_mentors',
            title: `Mentor: ${m.user.name}`,
            content: `Mentor Name: ${m.user.name}\nHeadline: ${m.user.headline}\nExpertise: ${m.expertise}\nRate: $${m.hourlyRate}/hr\nRating: ${m.rating} ⭐\nBio: ${m.user.bio || 'Available for 1-on-1 mentorship & code reviews on Growearn.'}`,
            metadata: { mentorId: m.id },
          });
        });
      } catch (err) {
        console.warn('RAG mentor retrieval fallback activated:', err);
        documents.push(
          {
            source: 'database_mentors',
            title: 'Mentor: Sarah Jenkins',
            content: 'Mentor Name: Sarah Jenkins\nHeadline: Staff Full-Stack Engineer at CloudScale\nExpertise: React, Node.js, Next.js, Cloud Architecture\nRate: $85/hr\nRating: 4.9 ⭐\nBio: Available for 1-on-1 mentorship & code reviews on Growearn.',
            metadata: { mentorId: 'm-default-1' },
          },
          {
            source: 'database_mentors',
            title: 'Mentor: Dr. Marcus Vance',
            content: 'Mentor Name: Dr. Marcus Vance\nHeadline: Principal AI Research Scientist\nExpertise: Machine Learning, PyTorch, LLMs, RAG Architectures\nRate: $120/hr\nRating: 5.0 ⭐\nBio: Available for 1-on-1 mentorship & code reviews on Growearn.',
            metadata: { mentorId: 'm-default-2' },
          },
          {
            source: 'database_mentors',
            title: 'Mentor: David Kim',
            content: 'Mentor Name: David Kim\nHeadline: Lead Cloud Architect & DevOps Consultant\nExpertise: Kubernetes, AWS, Terraform, Docker\nRate: $95/hr\nRating: 4.8 ⭐\nBio: Available for 1-on-1 mentorship & code reviews on Growearn.',
            metadata: { mentorId: 'm-default-3' },
          }
        );
      }
    }

    const isJobQuery =
      qLower.includes('job') ||
      qLower.includes('hire') ||
      qLower.includes('career') ||
      qLower.includes('role') ||
      qLower.includes('vacancy') ||
      qLower.includes('roadmap') ||
      qLower.includes('company') ||
      qLower.includes('growearn');

    if (isJobQuery) {
      try {
        const jobs = await prisma.job.findMany({
          where: { status: 'OPEN' },
          include: {
            company: { select: { name: true } },
            skills: { include: { skill: true } },
          },
          take: 5,
          orderBy: { createdAt: 'desc' },
        });

        jobs.forEach((j) => {
          documents.push({
            source: 'database_jobs',
            title: `Job Listing: ${j.title} at ${j.company.name}`,
            content: `Job Title: ${j.title}\nCompany: ${j.company.name}\nLocation: ${j.locationType}\nSalary: $${j.minSalary} - $${j.maxSalary} ${j.currency}\nRequired Skills: ${j.skills.map((s) => s.skill.name).join(', ')}\nDescription: ${j.description.slice(0, 200)}...`,
            metadata: { jobId: j.id, title: j.title },
          });
        });
      } catch (err) {
        console.warn('RAG job retrieval fallback activated:', err);
        documents.push({
          source: 'database_jobs',
          title: 'Job Listing: Senior Full Stack Engineer at NexaFlow',
          content: 'Job Title: Senior Full Stack Engineer\nCompany: NexaFlow Systems\nLocation: REMOTE\nSalary: $120,000 - $150,000 USD\nRequired Skills: TypeScript, React, Next.js, Node.js, PostgreSQL\nDescription: Building enterprise micro-frontends and scalable backend systems...',
          metadata: { jobId: 'j-default-1', title: 'Senior Full Stack Engineer' },
        });
      }
    }

    const isCourseQuery =
      qLower.includes('course') ||
      qLower.includes('learn') ||
      qLower.includes('tutorial') ||
      qLower.includes('roadmap') ||
      qLower.includes('study') ||
      qLower.includes('growearn') ||
      qLower.includes('class');

    if (isCourseQuery) {
      try {
        const courses = await prisma.course.findMany({
          where: { isPublished: true },
          include: { instructor: { select: { name: true } } },
          take: 5,
          orderBy: { rating: 'desc' },
        });

        courses.forEach((c) => {
          documents.push({
            source: 'database_courses',
            title: `Course: ${c.title}`,
            content: `Course Title: ${c.title}\nCategory: ${c.category}\nLevel: ${c.level}\nInstructor: ${c.instructor.name}\nPrice: ${c.price > 0 ? `$${c.price}` : 'Free'}\nRating: ${c.rating} / 5.0\nDescription: ${c.description.slice(0, 180)}...`,
            metadata: { courseId: c.id, level: c.level },
          });
        });
      } catch (err) {
        console.warn('RAG course retrieval fallback activated:', err);
        documents.push({
          source: 'database_courses',
          title: 'Course: Enterprise Full Stack Mastery with Next.js 16',
          content: 'Course Title: Enterprise Full Stack Mastery with Next.js 16\nCategory: Full Stack Web Development\nLevel: INTERMEDIATE\nInstructor: Sarah Jenkins\nPrice: $49\nRating: 4.9 / 5.0\nDescription: Build and deploy production-ready full-stack applications with React 19, Next.js 16, TypeScript, and Prisma...',
          metadata: { courseId: 'c-default-1', level: 'INTERMEDIATE' },
        });
      }
    }

    return documents;
  }

  static formatContextForPrompt(documents: RAGDocument[]): string {
    if (documents.length === 0) return 'No external database records retrieved for this query.';

    return documents
      .map(
        (doc, index) =>
          `[Source ${index + 1}: ${doc.title} (${doc.source})]\n${doc.content}`
      )
      .join('\n\n---\n\n');
  }
}
