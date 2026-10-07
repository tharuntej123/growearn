// Production AI Assistant Service orchestrating RAG, Intent Classification, and grounded responses.

import { ProductionRAGChain, GroundedRAGResult } from './rag-chain';
import { UserAIContext } from '@/services/user-context.service';

export interface AssistantAnswerOutput extends GroundedRAGResult {
  directAnswer: string; // Alias for backward compatibility with UI
}

export class AIAssistantService {
  // Main entry point to process a user question and generate a grounded RAG response.
  static async answer(
    question: string,
    userContext?: UserAIContext | null
  ): Promise<AssistantAnswerOutput> {
    const ragResult = await ProductionRAGChain.execute(question, userContext);

    return {
      ...ragResult,
      directAnswer: ragResult.answer,
    };
  }
}
