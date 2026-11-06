import { NextRequest } from 'next/server';
import { AIService } from '@/lib/ai/ai-service';
import { apiSuccess, apiError } from '@/lib/utils';
import { enforceRateLimit } from '@/lib/rate-limiter';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const improveMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(3000),
  tone: z.enum(['professional', 'friendly', 'concise', 'persuasive', 'grammar_fix']).default('professional'),
});

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return apiError('Authentication required to enhance messages', 'UNAUTHORIZED', 401);
    }

    const rateLimitResponse = await enforceRateLimit(req, 'ai:message', 20, 60, authUser.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const validated = improveMessageSchema.safeParse(body);
    if (!validated.success) {
      return apiError('Invalid message input', 'VALIDATION_ERROR', 400);
    }

    const result = await AIService.improveMessage(validated.data.message, validated.data.tone);
    return apiSuccess(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Message enhancement failed';
    return apiError(message, 'MESSAGE_IMPROVE_ERROR', 400);
  }
}
