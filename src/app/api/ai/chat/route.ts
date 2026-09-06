import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserAIContext } from '@/services/user-context.service';
import { AIAssistantService } from '@/lib/ai/ai-assistant.service';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    const body = await req.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return apiError('Message cannot be empty', 'VALIDATION_ERROR', 400);
    }

    let userContext = null;
    if (authUser) {
      userContext = await getUserAIContext(authUser.id);
    }

    const result = await AIAssistantService.answer(message, userContext);

    return apiSuccess({
      response: result.directAnswer,
      recommendedActions: result.recommendedActions,
      intent: result.intent,
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return apiError(
      error.message || 'AI assistant error',
      'INTERNAL_ERROR',
      500
    );
  }
}
