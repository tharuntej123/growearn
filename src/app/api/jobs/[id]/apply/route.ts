import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { JobRepository } from '@/repositories/job.repository';
import { UserRepository } from '@/repositories/user.repository';
import { HybridMatcher } from '@/lib/ai/hybrid-matcher';
import { applyJobSchema } from '@/validators/job.schema';
import { apiSuccess, apiError } from '@/lib/utils';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const userPayload = getCurrentUserFromRequest(req);
  if (!userPayload) {
    return apiError('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { skills: { include: { skill: true } } },
  });
  if (!job) {
    return apiError('Job not found', 'NOT_FOUND', 404);
  }

  try {
    const body = await req.json();
    const validated = applyJobSchema.safeParse(body);
    if (!validated.success) {
      return apiError('Invalid application data', 'VALIDATION_ERROR', 400);
    }

    const user = await UserRepository.findById(userPayload.userId);
    const userSkills = user?.skills.map((s) => s.skill.name) || [];
    const aiMatch = HybridMatcher.calculateJobMatch(
      {
        skills: userSkills,
        yearsExperience: user?.profile?.yearsOfExperience || 0,
        location: user?.location || undefined,
        careerGoal: user?.profile?.careerGoal || undefined,
      },
      {
        title: job.title,
        description: job.description,
        requiredSkills: job.skills.map((s) => s.skill.name),
        experienceLevel: job.experienceLevel,
        locationType: job.locationType,
        country: job.country || undefined,
        state: job.state || undefined,
        city: job.city || undefined,
      }
    );

    const application = await JobRepository.applyForJob(jobId, userPayload.userId, {
      coverLetter: validated.data.coverLetter,
      resumeUrl: validated.data.resumeUrl,
      matchScore: aiMatch.overallScore,
      matchExplanation: aiMatch.explanation,
    });

    await prisma.notification.create({
      data: {
        userId: job.companyId,
        title: 'New Candidate Application Received',
        message: `${user?.name} applied for "${job.title}" with a ${aiMatch.overallScore}% AI Match Score.`,
        link: '/company/dashboard',
        notificationType: 'JOB_APPLICATION',
      },
    });

    return apiSuccess({ application, aiMatch }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Application submission failed';
    return apiError(message, 'APPLICATION_ERROR', 400);
  }
}
