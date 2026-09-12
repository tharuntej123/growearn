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
      title: 'Groearn Ecosystem & Platform Overview',
      content: `Groearn (formerly SkillBridge AI) is a next-generation AI-powered career ecosystem and talent platform connecting 4 distinct roles:
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
            content: `Mentor Name: ${m.user.name}\nHeadline: ${m.user.headline}\nExpertise: ${m.expertise}\nRate: $${m.hourlyRate}/hr\nRating: ${m.rating} ⭐\nBio: ${m.user.bio || 'Available for 1-on-1 mentorship & code reviews on Groearn.'}`,
            metadata: { mentorId: m.id },
          });
        });
      } catch (err) {
        console.warn('RAG mentor retrieval non-fatal error:', err);
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
      qLower.includes('groearn') ||
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
        console.warn('RAG job retrieval non-fatal error:', err);
      }
    }

    const isCourseQuery =
      qLower.includes('course') ||
      qLower.includes('learn') ||
      qLower.includes('tutorial') ||
      qLower.includes('roadmap') ||
      qLower.includes('study') ||
      qLower.includes('groearn') ||
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
        console.warn('RAG course retrieval non-fatal error:', err);
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
