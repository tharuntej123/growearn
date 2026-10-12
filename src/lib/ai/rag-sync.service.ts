// Real-time Multi-RAG Synchronization Service for GroEarn.
// Automatically ingests new/updated Mentors, Jobs, Courses, and Candidates into pgvector (BGE-M3 1024 dims).

import prisma from '@/lib/prisma';
import { DocumentIngestionService, IngestResult } from './ingest';

export class RAGSyncService {
  // Synchronize a single Job into PostgreSQL pgvector (source_type = 'job').
  static async syncJob(jobId: string): Promise<IngestResult | null> {
    try {
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          skills: {
            include: { skill: true },
          },
        },
      });

      if (!job || job.status !== 'OPEN') {
        await DocumentIngestionService.deleteEntityVector('job', jobId);
        return null;
      }

      const skillNames = job.skills.map((s) => s.skill.name).filter(Boolean);

      return await DocumentIngestionService.ingestJob({
        id: job.id,
        title: job.title,
        description: job.description,
        skills: skillNames,
        experienceLevel: job.experienceLevel,
        locationType: job.locationType,
        city: job.city,
        country: job.country,
      });
    } catch (err: any) {
      console.warn(`[RAGSyncService.syncJob] Failed to sync job ${jobId}:`, err?.message || err);
      return null;
    }
  }

  // Non-blocking fire-and-forget sync for Job
  static triggerSyncJob(jobId: string): void {
    Promise.resolve().then(async () => {
      try {
        await RAGSyncService.syncJob(jobId);
      } catch (err) {
        console.warn(`[RAGSyncService.triggerSyncJob] Error syncing job ${jobId}:`, err);
      }
    });
  }

  // Synchronize a Mentor profile into PostgreSQL pgvector (source_type = 'mentor').
  static async syncMentor(mentorProfileIdOrUserId: string): Promise<IngestResult | null> {
    try {
      const mentor = await prisma.mentorProfile.findFirst({
        where: {
          OR: [
            { id: mentorProfileIdOrUserId },
            { userId: mentorProfileIdOrUserId },
          ],
        },
        include: {
          user: {
            include: {
              skills: {
                include: { skill: true },
              },
            },
          },
        },
      });

      if (!mentor || !mentor.isAvailable) {
        await DocumentIngestionService.deleteEntityVector('mentor', mentorProfileIdOrUserId);
        return null;
      }

      const userSkills = mentor.user.skills.map((s) => s.skill.name).join(', ');
      const expertise = mentor.expertise || userSkills || 'Software Mentorship';

      return await DocumentIngestionService.ingestMentor({
        id: mentor.id,
        userId: mentor.userId,
        name: mentor.user.name,
        headline: mentor.user.headline || mentor.title || 'Expert Mentor',
        expertise,
        bio: mentor.bio || `${mentor.user.name} is an active mentor on GroEarn.`,
        hourlyRate: mentor.hourlyRate,
        yearsExperience: mentor.yearsExperience,
      });
    } catch (err: any) {
      console.warn(`[RAGSyncService.syncMentor] Failed to sync mentor ${mentorProfileIdOrUserId}:`, err?.message || err);
      return null;
    }
  }

  // Non-blocking fire-and-forget sync for Mentor
  static triggerSyncMentor(mentorProfileIdOrUserId: string): void {
    Promise.resolve().then(async () => {
      try {
        await RAGSyncService.syncMentor(mentorProfileIdOrUserId);
      } catch (err) {
        console.warn(`[RAGSyncService.triggerSyncMentor] Error syncing mentor ${mentorProfileIdOrUserId}:`, err);
      }
    });
  }

  // Synchronize a Course into PostgreSQL pgvector (source_type = 'course').
  static async syncCourse(courseId: string): Promise<IngestResult | null> {
    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course || !course.isPublished) {
        await DocumentIngestionService.deleteEntityVector('course', courseId);
        return null;
      }

      return await DocumentIngestionService.ingestCourse({
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.category,
        level: course.level,
        skillsCovered: course.skillsCovered,
      });
    } catch (err: any) {
      console.warn(`[RAGSyncService.syncCourse] Failed to sync course ${courseId}:`, err?.message || err);
      return null;
    }
  }

  // Non-blocking fire-and-forget sync for Course
  static triggerSyncCourse(courseId: string): void {
    Promise.resolve().then(async () => {
      try {
        await RAGSyncService.syncCourse(courseId);
      } catch (err) {
        console.warn(`[RAGSyncService.triggerSyncCourse] Error syncing course ${courseId}:`, err);
      }
    });
  }

  // Synchronize a Candidate/Freelancer into PostgreSQL pgvector (source_type = 'candidate').
  static async syncCandidate(userId: string): Promise<IngestResult | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          skills: {
            include: { skill: true },
          },
          projects: true,
          certifications: true,
        },
      });

      if (!user) {
        await DocumentIngestionService.deleteEntityVector('candidate', userId);
        return null;
      }

      const skillsList = user.skills.map((s) => s.skill.name).filter(Boolean);
      const projectsSummary = user.projects
        ?.map((p) => `${p.title}: ${p.description}`)
        .join('; ');
      const certsSummary = user.certifications
        ?.map((c) => `${c.title} by ${c.issuer}`)
        .join('; ');

      return await DocumentIngestionService.ingestCandidate({
        id: user.id,
        name: user.name,
        headline: user.headline || user.profile?.title || 'Professional',
        bio: user.bio || '',
        skills: skillsList,
        yearsOfExperience: user.profile?.yearsOfExperience || 0,
        careerGoal: user.profile?.careerGoal || user.profile?.targetRole || null,
        projectsSummary: projectsSummary || undefined,
        certificationsSummary: certsSummary || undefined,
      });
    } catch (err: any) {
      console.warn(`[RAGSyncService.syncCandidate] Failed to sync candidate ${userId}:`, err?.message || err);
      return null;
    }
  }

  // Non-blocking fire-and-forget sync for Candidate
  static triggerSyncCandidate(userId: string): void {
    Promise.resolve().then(async () => {
      try {
        await RAGSyncService.syncCandidate(userId);
      } catch (err) {
        console.warn(`[RAGSyncService.triggerSyncCandidate] Error syncing candidate ${userId}:`, err);
      }
    });
  }

  // Delete vector chunks when an entity is removed or deactivated
  static async removeEntity(sourceType: string, entityId: string): Promise<number> {
    try {
      return await DocumentIngestionService.deleteEntityVector(sourceType, entityId);
    } catch (err: any) {
      console.warn(`[RAGSyncService.removeEntity] Failed to delete ${sourceType}_${entityId}:`, err?.message || err);
      return 0;
    }
  }

  // Non-blocking fire-and-forget deletion
  static triggerRemoveEntity(sourceType: string, entityId: string): void {
    Promise.resolve().then(async () => {
      try {
        await RAGSyncService.removeEntity(sourceType, entityId);
      } catch (err) {
        console.warn(`[RAGSyncService.triggerRemoveEntity] Error removing ${sourceType}_${entityId}:`, err);
      }
    });
  }

  // Sync all active marketplace entities (jobs, mentors, courses, candidates) into pgvector
  static async syncAllActiveEntities(): Promise<{
    jobs: number;
    mentors: number;
    courses: number;
    candidates: number;
  }> {
    const [jobs, mentors, courses, candidates] = await Promise.all([
      prisma.job.findMany({ where: { status: 'OPEN' }, select: { id: true } }),
      prisma.mentorProfile.findMany({ where: { isAvailable: true }, select: { id: true } }),
      prisma.course.findMany({ where: { isPublished: true }, select: { id: true } }),
      prisma.user.findMany({
        where: { role: { in: ['PROFESSIONAL', 'FREELANCER', 'STUDENT', 'LEARNER'] } },
        select: { id: true },
        take: 100,
      }),
    ]);

    let syncedJobs = 0;
    for (const j of jobs) {
      const res = await this.syncJob(j.id);
      if (res?.success) syncedJobs++;
    }

    let syncedMentors = 0;
    for (const m of mentors) {
      const res = await this.syncMentor(m.id);
      if (res?.success) syncedMentors++;
    }

    let syncedCourses = 0;
    for (const c of courses) {
      const res = await this.syncCourse(c.id);
      if (res?.success) syncedCourses++;
    }

    let syncedCandidates = 0;
    for (const u of candidates) {
      const res = await this.syncCandidate(u.id);
      if (res?.success) syncedCandidates++;
    }

    return {
      jobs: syncedJobs,
      mentors: syncedMentors,
      courses: syncedCourses,
      candidates: syncedCandidates,
    };
  }
}
