import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { AIService } from '@/lib/ai/ai-service';
import { apiSuccess, apiError } from '@/lib/utils';
import { z } from 'zod';

import { enforceRateLimit } from '@/lib/rate-limiter';

const resumeParseSchema = z.object({
  resumeText: z.string().min(10, 'Resume text is required').max(100000, 'Resume text exceeds maximum allowed length of 100,000 characters'),
});

export async function POST(req: NextRequest) {
  const userPayload = getCurrentUserFromRequest(req);
  if (!userPayload) {
    return apiError('Unauthorized', 'UNAUTHORIZED', 401);
  }

  // Rate limit: 10 requests / minute per user
  const rateLimitResponse = await enforceRateLimit(req, 'ai:resume-parse', 10, 60, userPayload.userId);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await req.json();
    const validated = resumeParseSchema.safeParse(body);
    if (!validated.success) {
      return apiError('Resume text content is required', 'VALIDATION_ERROR', 400);
    }

    const extracted = await AIService.extractResumeSkills(validated.data.resumeText);
    return apiSuccess({ extracted });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to parse resume';
    return apiError(message, 'RESUME_PARSE_ERROR', 400);
  }
}
