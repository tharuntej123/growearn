import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserAIContext } from '@/services/user-context.service';
import { AIAssistantService } from '@/lib/ai/ai-assistant.service';
import { enforceRateLimit } from '@/lib/rate-limiter';

/**
 * POST /api/ai/chat
 * Production RAG Chat Endpoint powered by LangChain and PostgreSQL pgvector.
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    
    // Rate limit: 20 requests / minute per user or IP
    const rateLimitResponse = await enforceRateLimit(req, 'ai:chat', 20, 60, authUser?.id);
    if (rateLimitResponse) return rateLimitResponse;

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
      response: result.answer,
      intent: result.intent,
      retrievedDocuments: result.retrievedDocuments,
      similarity: result.similarity,
      sources: result.sources,
      recommendedActions: result.recommendedActions,
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
