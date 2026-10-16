import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { UserRepository } from '@/repositories/user.repository';
import { AIService } from '@/lib/ai/ai-service';
import { apiSuccess, apiError } from '@/lib/utils';
import { z } from 'zod';

import { enforceRateLimit } from '@/lib/rate-limiter';

const proposalInputSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required').max(200, 'Job title too long'),
  jobDescription: z.string().min(1, 'Job description is required').max(10000, 'Job description exceeds maximum length'),
});

export async function POST(req: NextRequest) {
  const userPayload = await getCurrentUserFromRequest(req);
  if (!userPayload) {
    return apiError('Unauthorized', 'UNAUTHORIZED', 401);
  }

  // Rate limit: 10 requests / minute per user
  const rateLimitResponse = await enforceRateLimit(req, 'ai:proposal', 10, 60, userPayload.userId);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const validated = proposalInputSchema.safeParse(body);
    if (!validated.success) {
      return apiError(validated.error.errors[0]?.message || 'Job title and description are required', 'VALIDATION_ERROR', 400);
    }

    const user = await UserRepository.findById(userPayload.userId);
    const skills = user?.skills.map((s) => s.skill.name) || ['Next.js', 'React', 'TypeScript'];

    const proposal = await AIService.generateProposal(
      validated.data.jobTitle,
      validated.data.jobDescription,
      skills,
      user?.bio || undefined
    );

    return apiSuccess({ proposal });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate proposal';
    return apiError(message, 'PROPOSAL_GEN_ERROR', 400);
  }
}
