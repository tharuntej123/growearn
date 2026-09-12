import { RAGDocument, RAGRetriever } from './retriever';
import { UserAIContext } from '@/services/user-context.service';
import { GrokLLMClient } from '../grok-client';

export interface LangChainRAGResponse {
  answer: string;
  sourceDocuments: RAGDocument[];
  isLLMPowered: boolean;
  provider?: string;
  model?: string;
}

export class LangChainRAGService {
  static isLLMAvailable(): boolean {
    return GrokLLMClient.isAvailable();
  }

  static async executeRAG(
    question: string,
    userContext: UserAIContext | null,
    fallbackSynthesizer?: () => Promise<string> | string
  ): Promise<LangChainRAGResponse> {
    const retrievedDocs = await RAGRetriever.retrieveContext(question, userContext);
    const contextString = RAGRetriever.formatContextForPrompt(retrievedDocs);

    if (!this.isLLMAvailable()) {
      const fallbackAnswer = fallbackSynthesizer ? await fallbackSynthesizer() : '';
      return {
        answer: fallbackAnswer,
        sourceDocuments: retrievedDocs,
        isLLMPowered: false,
      };
    }

    try {
      const systemPrompt = `You are Groearn AI — the Senior Full-Stack Software Architect, Tech Career Advisor, and Community Guide for the Groearn platform.

YOUR MISSION:
1. Provide authoritative, deeply helpful, direct, and conversational responses to user questions.
2. For general knowledge or technical software engineering questions (e.g. "what is python", "how does react work", "explain kafka", "fastapi vs django", "system design", "docker"), ANSWER THE QUESTION DIRECTLY with technical depth, real-world trade-offs, and accurate code examples. Do NOT give a platform introduction when asked a technical question.
3. If asked about people/mentors, courses, jobs, or features on Groearn ("are these guys available in the application growearn", "who can mentor me", "what courses are available"), reference the REAL context documents from the Groearn database. Confirm that verified mentors (like Sarah Jenkins, David Kim, Michael Chang, Priya Sharma, Marcus Vance, Elena Rostova) are active on Groearn and explain how users can explore their profiles or book 1-on-1 sessions.
4. If asked for a career roadmap, provide an aligned ASCII workflow chart and structured learning phases with realistic timeline, skills, and milestone projects.
5. Format your output in clean, readable Markdown (bullet points, bold text, code blocks).
6. Always maintain a welcoming, professional, and empowering tone.

CONTEXT DOCUMENTS (From Groearn Database & Platform):
${contextString}`;

      const completion = await GrokLLMClient.complete({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        temperature: 0.3,
        maxTokens: 2048,
      });

      if (completion && completion.text) {
        return {
          answer: completion.text,
          sourceDocuments: retrievedDocs,
          isLLMPowered: true,
          provider: completion.provider,
          model: completion.model,
        };
      }

      const fallbackAnswer = fallbackSynthesizer ? await fallbackSynthesizer() : '';
      return {
        answer: fallbackAnswer,
        sourceDocuments: retrievedDocs,
        isLLMPowered: false,
      };
    } catch (err) {
      console.warn('[LangChainRAGService] Execution non-fatal error, falling back to deterministic synthesizer:', err);
      const fallbackAnswer = fallbackSynthesizer ? await fallbackSynthesizer() : '';
      return {
        answer: fallbackAnswer,
        sourceDocuments: retrievedDocs,
        isLLMPowered: false,
      };
    }
  }
}
