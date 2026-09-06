import { prisma } from '@/lib/prisma';
import { UserAIContext } from '@/services/user-context.service';

export interface RAGDocument {
  source: 'database_jobs' | 'database_courses' | 'database_mentors' | 'user_profile' | 'knowledge_base';
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export class RAGRetriever {
  /**
   * Retrieves relevant platform context across database entities and knowledge repositories.
   */
  static async retrieveContext(
    question: string,
    userContext: UserAIContext | null
  ): Promise<RAGDocument[]> {
    const qLower = question.toLowerCase();
    const documents: RAGDocument[] = [];

    // 1. User Profile Context
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

    // 2. Database Jobs Retrieval (if question relates to jobs, roles, or career)
    if (
      qLower.includes('job') ||
      qLower.includes('hire') ||
      qLower.includes('career') ||
      qLower.includes('role') ||
      qLower.includes('vacancy') ||
      qLower.includes('roadmap')
    ) {
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

    // 3. Database Courses Retrieval (if question relates to learning, courses, or skills)
    if (
      qLower.includes('course') ||
      qLower.includes('learn') ||
      qLower.includes('tutorial') ||
      qLower.includes('roadmap') ||
      qLower.includes('study')
    ) {
      try {
        const courses = await prisma.course.findMany({
          where: { isPublished: true },
          include: { instructor: { select: { name: true } } },
          take: 4,
          orderBy: { rating: 'desc' },
        });

        courses.forEach((c) => {
          documents.push({
            source: 'database_courses',
            title: `Course: ${c.title}`,
            content: `Course Title: ${c.title}\nCategory: ${c.category}\nLevel: ${c.level}\nInstructor: ${c.instructor.name}\nRating: ${c.rating} / 5.0\nDescription: ${c.description.slice(0, 180)}...`,
            metadata: { courseId: c.id, level: c.level },
          });
        });
      } catch (err) {
        console.warn('RAG course retrieval non-fatal error:', err);
      }
    }

    // 4. Database Mentors Retrieval
    if (qLower.includes('mentor') || qLower.includes('coach') || qLower.includes('1-on-1') || qLower.includes('review')) {
      try {
        const mentors = await prisma.mentorProfile.findMany({
          where: { isAvailable: true },
          include: { user: { select: { name: true, headline: true } } },
          take: 3,
          orderBy: { rating: 'desc' },
        });

        mentors.forEach((m) => {
          documents.push({
            source: 'database_mentors',
            title: `Mentor: ${m.user.name}`,
            content: `Mentor Name: ${m.user.name}\nHeadline: ${m.user.headline}\nExpertise: ${m.expertise}\nRate: $${m.hourlyRate}/hr\nRating: ${m.rating} ⭐`,
            metadata: { mentorId: m.id },
          });
        });
      } catch (err) {
        console.warn('RAG mentor retrieval non-fatal error:', err);
      }
    }

    return documents;
  }

  /**
   * Formats retrieved documents into a clean context string for the LangChain Prompt
   */
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
