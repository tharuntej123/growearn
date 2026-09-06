import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate } from '@langchain/core/prompts';
import { RAGDocument, RAGRetriever } from './retriever';
import { UserAIContext } from '@/services/user-context.service';

export interface LangChainRAGResponse {
  answer: string;
  sourceDocuments: RAGDocument[];
  isLLMPowered: boolean;
}

export class LangChainRAGService {
  /**
   * Check if live LLM credentials are configured
   */
  static isLLMAvailable(): boolean {
    return Boolean(
      process.env.OPENAI_API_KEY &&
      process.env.OPENAI_API_KEY.trim() !== '' &&
      process.env.MOCK_AI !== 'true'
    );
  }

  /**
   * Executes the LangChain RAG pipeline:
   * 1. Retrieve grounded documents from DB (Jobs, Courses, Mentors, Profile)
   * 2. Format context into LangChain prompt template
   * 3. Invoke ChatOpenAI LLM chain (or fallback if offline)
   */
  static async executeRAG(
    question: string,
    userContext: UserAIContext | null,
    fallbackSynthesizer?: () => Promise<string> | string
  ): Promise<LangChainRAGResponse> {
    // Step 1: RAG Retrieval from platform DB
    const retrievedDocs = await RAGRetriever.retrieveContext(question, userContext);
    const contextString = RAGRetriever.formatContextForPrompt(retrievedDocs);

    // Step 2: Check for live LLM API key
    if (!this.isLLMAvailable()) {
      const fallbackAnswer = fallbackSynthesizer ? await fallbackSynthesizer() : '';
      return {
        answer: fallbackAnswer,
        sourceDocuments: retrievedDocs,
        isLLMPowered: false,
      };
    }

    try {
      // Step 3: Initialize LangChain ChatOpenAI model
      const model = new ChatOpenAI({
        modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        openAIApiKey: process.env.OPENAI_API_KEY,
      });

      // Step 4: Create LangChain Prompt Template
      const systemPrompt = `You are the Groearn Senior Full-Stack Software Architect and AI Career Assistant.
Your mission is to provide deeply technical, authoritative, precise, and practical software engineering guidance, career roadmaps, and platform recommendations.

RULES:
1. Ground your responses strictly in the provided Context Documents whenever applicable (real database jobs, courses, mentors, and user profile).
2. If asking for a career roadmap, provide an aligned ASCII workflow chart and 4 structured learning phases with timeline, objectives, skills, essential topics, practice tasks, and milestone projects.
3. For technical questions (REST, Polymorphism, Docker, Kafka, Microservices, Indexing), provide in-depth architectural explanations, core constraints, and realistic code examples.
4. Do not mention that you are an AI model or prompt-engineered assistant; speak directly as the Groearn Career & Architecture Advisor.

CONTEXT DOCUMENTS:
{context}`;

      const chatPrompt = ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(systemPrompt),
        HumanMessagePromptTemplate.fromTemplate('{question}'),
      ]);

      // Step 5: Execute LangChain Chain
      const chain = chatPrompt.pipe(model);
      const response = await chain.invoke({
        context: contextString,
        question: question,
      });

      const responseText = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

      return {
        answer: responseText,
        sourceDocuments: retrievedDocs,
        isLLMPowered: true,
      };
    } catch (err) {
      console.warn('LangChain execution non-fatal error, falling back to deterministic synthesizer:', err);
      const fallbackAnswer = fallbackSynthesizer ? await fallbackSynthesizer() : '';
      return {
        answer: fallbackAnswer,
        sourceDocuments: retrievedDocs,
        isLLMPowered: false,
      };
    }
  }
}
