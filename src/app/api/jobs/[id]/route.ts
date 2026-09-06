import { NextRequest } from 'next/server';
import { JobRepository } from '@/repositories/job.repository';
import { apiSuccess, apiError } from '@/lib/utils';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { UserRepository } from '@/repositories/user.repository';
import { HybridMatcher } from '@/lib/ai/hybrid-matcher';

const jobRepo = new JobRepository();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await jobRepo.getJobById(id);
  if (!job) {
    return apiError('Job not found', 'NOT_FOUND', 404);
  }

  // Calculate user AI match if logged in
  const userPayload = getCurrentUserFromRequest(req);
  let aiMatch = null;
  if (userPayload) {
    const user = await UserRepository.findById(userPayload.userId);
    if (user) {
      aiMatch = HybridMatcher.calculateJobMatch(
        {
          skills: user.skills.map((s) => s.skill.name),
          yearsExperience: user.profile?.yearsOfExperience || 0,
          location: user.location || undefined,
          careerGoal: user.profile?.careerGoal || undefined,
          headline: user.headline || undefined,
          bio: user.bio || undefined,
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
    }
  }

  return apiSuccess({ job, aiMatch });
}
