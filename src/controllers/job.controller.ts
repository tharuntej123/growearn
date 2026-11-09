import { NextRequest } from 'next/server';
import { getCurrentUser, isRoleAllowed } from '@/lib/auth';
import { createJobSchema } from '@/validators/job.schema';
import { apiSuccess, apiError } from '@/lib/utils';
import { JobRepository } from '@/repositories/job.repository';
import { HybridMatcher } from '@/lib/ai/hybrid-matcher';
import { JobApplicationService } from '@/services/job-application.service';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const applyJobSchema = z.object({
  coverLetter: z.string().optional(),
  resumeUrl: z.string().optional(),
});

export class JobController {
  static async getJobs(req: NextRequest) {
    try {
      const searchParams = req.nextUrl.searchParams;
      const query = searchParams.get('query') || searchParams.get('search') || undefined;
      const city = searchParams.get('city') || undefined;
      const locationType = searchParams.get('locationType') || undefined;
      const jobType = searchParams.get('jobType') || undefined;
      const experienceLevel = searchParams.get('experienceLevel') || undefined;
      const companyId = searchParams.get('companyId') || undefined;
      const mine = searchParams.get('mine') === 'true';
      const isLocalParam = searchParams.get('isLocal');
      const isLocal = isLocalParam === 'true' ? true : isLocalParam === 'false' ? false : undefined;
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const offset = parseInt(searchParams.get('offset') || '0', 10);

      const authUser = await getCurrentUser(req);
      const targetCompanyId = mine && authUser ? authUser.id : companyId;

      const where: Record<string, unknown> = { status: 'OPEN' };
      if (targetCompanyId) {
        where.companyId = targetCompanyId;
      }
      if (query) {
        where.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { skills: { some: { skill: { name: { contains: query, mode: 'insensitive' } } } } },
        ];
      }
      if (city) {
        where.city = { contains: city, mode: 'insensitive' };
      }
      if (locationType && locationType !== 'ALL') {
        where.locationType = locationType;
      }
      if (jobType && jobType !== 'ALL') {
        where.jobType = jobType;
      }
      if (experienceLevel && experienceLevel !== 'ALL') {
        where.experienceLevel = experienceLevel;
      }
      if (isLocal !== undefined) {
        where.isLocal = isLocal;
      }

      const [jobs, total] = await Promise.all([
        prisma.job.findMany({
          where,
          include: {
            company: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                location: true,
                profile: true,
              },
            },
            skills: {
              include: { skill: true },
            },
            _count: {
              select: { applications: true, proposals: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        prisma.job.count({ where }),
      ]);

      return apiSuccess({
        jobs,
        total,
        limit,
        offset,
      });
 } catch (_e) { const err = _e as Error; 
      return apiError(err.message || 'Failed to fetch jobs', 'INTERNAL_ERROR', 500);
    }
  }

  static async getJobDetail(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await params;
      const authUser = await getCurrentUser(req);

      const job = await prisma.job.findUnique({
        where: { id },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              headline: true,
              bio: true,
              location: true,
              isVerified: true,
              profile: {
                select: {
                  title: true,
                  portfolioUrl: true,
                  yearsOfExperience: true,
                  githubUrl: true,
                  linkedinUrl: true,
                },
              },
            },
          },
          skills: {
            include: { skill: true },
          },
          _count: {
            select: { applications: true, proposals: true },
          },
        },
      });

      if (!job) {
        return apiError('Job not found', 'NOT_FOUND', 404);
      }

      let application = null;
      let matchResult = null;

      if (authUser) {
        application = await prisma.application.findUnique({
          where: {
            jobId_applicantId: {
              jobId: job.id,
              applicantId: authUser.id,
            },
          },
        });

        // Compute match score if user is a professional or learner
        const userWithProfile = await prisma.user.findUnique({
          where: { id: authUser.id },
          include: {
            profile: true,
            skills: { include: { skill: true } },
          },
        });

        if (userWithProfile) {
          const userSkills = userWithProfile.skills.map((s) => s.skill.name);
          const jobSkills = job.skills.map((s) => s.skill.name);

          matchResult = HybridMatcher.calculateJobMatch(
            {
              skills: userSkills,
              yearsExperience: userWithProfile.profile?.yearsOfExperience || 0,
              location: userWithProfile.location || undefined,
              careerGoal: userWithProfile.profile?.careerGoal || undefined,
              headline: userWithProfile.headline || undefined,
              bio: userWithProfile.bio || undefined,
            },
            {
              title: job.title,
              description: job.description,
              requiredSkills: jobSkills,
              experienceLevel: job.experienceLevel,
              locationType: job.locationType,
              country: job.country,
              state: job.state || undefined,
              city: job.city || undefined,
            }
          );
        }
      }

      return apiSuccess({
        job,
        hasApplied: Boolean(application),
        application,
        matchResult,
      });
 } catch (_e) { const err = _e as Error; 
      return apiError(err.message || 'Failed to fetch job details', 'INTERNAL_ERROR', 500);
    }
  }

  static async createJob(req: NextRequest) {
    try {
      const authUser = await getCurrentUser(req);
      if (!authUser) {
        return apiError('Authentication required to post job opportunities', 'UNAUTHORIZED', 401);
      }

      if (!isRoleAllowed(authUser.role, ['COMPANY', 'ADMIN'])) {
        return apiError('Forbidden: Only Company accounts can post job opportunities.', 'FORBIDDEN', 403);
      }

      const body = await req.json();
      const validated = createJobSchema.safeParse(body);
      if (!validated.success) {
        const msg = validated.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        return apiError(msg || 'Validation failed', 'VALIDATION_ERROR', 400);
      }

      const { skills, deadline, ...jobFields } = validated.data;
      const newJob = await JobRepository.createJob(authUser.id, {
        ...jobFields,
        skillNames: skills,
        deadline: deadline ? new Date(deadline) : undefined,
      });

      // Record audit log
      await prisma.auditLog.create({
        data: {
          userId: authUser.id,
          action: 'JOB_POST',
          resource: 'Job',
          details: { jobId: newJob.id, title: newJob.title },
        },
      }).catch(() => {});

      return apiSuccess({ job: newJob }, 201);
 } catch (_e) { const err = _e as Error; 
      return apiError(err.message || 'Failed to create job listing', 'JOB_CREATE_ERROR', 500);
    }
  }

  static async applyForJob(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const authUser = await getCurrentUser(req);
      if (!authUser) {
        return apiError('Authentication required to apply for jobs', 'UNAUTHORIZED', 401);
      }

      const { id: jobId } = await params;
      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: {
          skills: { include: { skill: true } },

        },
      });

      if (!job) {
        return apiError('Job not found', 'NOT_FOUND', 404);
      }

      if (job.status !== 'OPEN') {
        return apiError('Cannot apply to this job listing as it is closed', 'BAD_REQUEST', 400);
      }

      if (job.deadline && new Date(job.deadline) < new Date()) {
        return apiError('Application deadline for this job has expired', 'BAD_REQUEST', 400);
      }

      if (job.companyId === authUser.id) {
        return apiError('Cannot apply to your own job listing', 'BAD_REQUEST', 400);
      }

      const body = await req.json();
      const validated = applyJobSchema.safeParse(body);
      if (!validated.success) {
        return apiError('Invalid application data', 'VALIDATION_ERROR', 400);
      }

      // Compute match score
      const userWithProfile = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: {
          profile: true,
          skills: { include: { skill: true } },
        },
      });

      const userSkills = userWithProfile?.skills.map((s) => s.skill.name) || [];
      const jobSkills = job.skills.map((s) => s.skill.name);

      const match = HybridMatcher.calculateJobMatch(
        {
          skills: userSkills,
          yearsExperience: userWithProfile?.profile?.yearsOfExperience || 0,
          location: userWithProfile?.location || undefined,
          careerGoal: userWithProfile?.profile?.careerGoal || undefined,
        },
        {
          title: job.title,
          description: job.description,
          requiredSkills: jobSkills,
          experienceLevel: job.experienceLevel,
          locationType: job.locationType,
          country: job.country,
          state: job.state || undefined,
          city: job.city || undefined,
        }
      );

      const application = await JobRepository.applyForJob(job.id, authUser.id, {
        coverLetter: validated.data.coverLetter || '',
        resumeUrl: validated.data.resumeUrl || userWithProfile?.profile?.resumeUrl || undefined,
        matchScore: match.overallScore,
        matchExplanation: match.explanation,
      });

      // Send notification to company
      await prisma.notification.create({
        data: {
          userId: job.companyId,
          title: 'New Job Application Received',
          message: `${authUser.name} applied for "${job.title}" (${match.overallScore}% match).`,
          link: `/company/jobs/${job.id}/applicants`,
          notificationType: 'JOB_APPLICATION',
        },
      }).catch(() => {});

      return apiSuccess({
        message: 'Application submitted successfully',
        application,
      }, 201);
 } catch (_e) { const err = _e as Error; 
      return apiError(err.message || 'Failed to submit application', 'APPLICATION_ERROR', 500);
    }
  }

  static async getJobApplications(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const authUser = await getCurrentUser(req);
      if (!authUser) {
        return apiError('Unauthorized', 'UNAUTHORIZED', 401);
      }

      const { id: jobId } = await params;
      const job = await prisma.job.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        return apiError('Job not found', 'NOT_FOUND', 404);
      }

      // Check ownership
      if (job.companyId !== authUser.id && authUser.role !== 'ADMIN') {
        return apiError('Forbidden: You can only view applications for jobs your company posted.', 'FORBIDDEN', 403);
      }

      const applications = await JobApplicationService.getApplicationsForJob(jobId);

      return apiSuccess({ job, applications });
 } catch (_e) { const err = _e as Error; 
      return apiError(err.message || 'Failed to fetch applications', 'INTERNAL_ERROR', 500);
    }
  }

  static async updateApplicationStatus(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const authUser = await getCurrentUser(req);
      if (!authUser) {
        return apiError('Unauthorized', 'UNAUTHORIZED', 401);
      }

      const { id: applicationId } = await params;
      const { status } = await req.json();

      const allowedStatuses = ['APPLIED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'ACCEPTED', 'REJECTED'];
      if (!allowedStatuses.includes(status)) {
        return apiError(`Invalid status. Allowed: ${allowedStatuses.join(', ')}`, 'BAD_REQUEST', 400);
      }

      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { job: true, applicant: true },
      });

      if (!app) {
        return apiError('Application not found', 'NOT_FOUND', 404);
      }

      if (app.job.companyId !== authUser.id && authUser.role !== 'ADMIN') {
        return apiError('Forbidden: Only the job poster can update application status', 'FORBIDDEN', 403);
      }

      const updated = await JobApplicationService.updateStatus(applicationId, status, app.applicantId, app.job.title);

      return apiSuccess({
        message: `Application status updated to ${status}`,
        application: updated,
      });
 } catch (_e) { const err = _e as Error; 
      return apiError(err.message || 'Failed to update application status', 'INTERNAL_ERROR', 500);
    }
  }

  static async updateJob(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const authUser = await getCurrentUser(req);
      if (!authUser) {
        return apiError('Unauthorized', 'UNAUTHORIZED', 401);
      }

      const { id } = await params;
      const job = await prisma.job.findUnique({ where: { id } });
      if (!job) {
        return apiError('Job not found', 'NOT_FOUND', 404);
      }

      if (job.companyId !== authUser.id && authUser.role !== 'ADMIN') {
        return apiError('Forbidden: Only the job poster or admin can modify this listing', 'FORBIDDEN', 403);
      }

      const body = await req.json();
      const updated = await prisma.job.update({
        where: { id },
        data: {
          title: typeof body.title === 'string' ? body.title : undefined,
          description: typeof body.description === 'string' ? body.description : undefined,
          status: typeof body.status === 'string' ? body.status : undefined,
          jobType: typeof body.jobType === 'string' ? body.jobType : undefined,
          locationType: typeof body.locationType === 'string' ? body.locationType : undefined,
          minSalary: typeof body.minSalary === 'number' ? body.minSalary : undefined,
          maxSalary: typeof body.maxSalary === 'number' ? body.maxSalary : undefined,
          deadline: body.deadline ? new Date(body.deadline) : undefined,
        },
      });

      return apiSuccess({ job: updated });
    } catch (_e) {
      const err = _e as Error;
      return apiError(err.message || 'Failed to update job', 'JOB_UPDATE_ERROR', 500);
    }
  }

  static async deleteJob(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
      const authUser = await getCurrentUser(req);
      if (!authUser) {
        return apiError('Unauthorized', 'UNAUTHORIZED', 401);
      }

      const { id } = await params;
      const job = await prisma.job.findUnique({ where: { id } });
      if (!job) {
        return apiError('Job not found', 'NOT_FOUND', 404);
      }

      if (job.companyId !== authUser.id && authUser.role !== 'ADMIN') {
        return apiError('Forbidden: Only the job poster or admin can delete this listing', 'FORBIDDEN', 403);
      }

      await prisma.job.delete({ where: { id } });
      return apiSuccess({ message: 'Job deleted successfully' });
    } catch (_e) {
      const err = _e as Error;
      return apiError(err.message || 'Failed to delete job', 'JOB_DELETE_ERROR', 500);
    }
  }
}
