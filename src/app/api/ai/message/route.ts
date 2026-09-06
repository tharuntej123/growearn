import { NextRequest } from 'next/server';
import { AIService } from '@/lib/ai/ai-service';
import { apiSuccess, apiError } from '@/lib/utils';
import { z } from 'zod';

const improveMessageSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  tone: z.enum(['professional', 'friendly', 'concise', 'persuasive', 'grammar_fix']).default('professional'),
});

export async function POST(req: NextRequest) {
  try {
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
