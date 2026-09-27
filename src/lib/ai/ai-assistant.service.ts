/**
 * @file ai-assistant.service.ts
 * @description Production AI Assistant Service orchestrating RAG, Intent Classification, and grounded responses.
 * 
 * Architecture:
 * - Delegates directly to ProductionRAGChain (LangChain RunnableSequence + pgvector + Groq/OpenAI)
 * - Returns grounded answers, vector similarity scores, retrieved documents, and source citations.
 * 
 * Input: question: string, userContext?: UserAIContext | null
 * Output: Grounded RAG Result with directAnswer, similarity, sources, and recommendedActions
 */

import { ProductionRAGChain, GroundedRAGResult } from './rag-chain';
import { UserAIContext } from '@/services/user-context.service';

export interface AssistantAnswerOutput extends GroundedRAGResult {
  directAnswer: string; // Alias for backward compatibility with UI
}

export class AIAssistantService {
  /**
   * Main entry point to process a user question and generate a grounded RAG response.
   * 
   * @param question - User's chat query or prompt
   * @param userContext - Optional logged-in user profile, skills, and target role
   * @returns Promise<AssistantAnswerOutput> Grounded response with real vector similarity & sources
   */
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
