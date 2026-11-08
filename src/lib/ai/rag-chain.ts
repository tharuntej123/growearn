import { logger } from '@/lib/logger';
import { RunnableSequence, RunnableLambda } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Document } from '@langchain/core/documents';
import { ragPromptTemplate } from './prompt';
import { PgVectorRetriever } from './retriever';
import { DocumentChunkRecord } from './vector-store';
import { IntentClassifier, IntentCategory } from './intent-classifier';
import { LLMClient } from './llm-client';
import { isEmbeddingConfigured } from './embeddings';
import { UserAIContext } from '@/services/user-context.service';
import { getLangChainChatGroq } from './lc-llm';

export interface GroundedRAGDocument {
  id: string;
  source: string;
  sourceType: string;
  content: string;
  similarity: number;
}

export interface GroundedRAGResult {
  answer: string;
  intent: IntentCategory;
  retrievedDocuments: GroundedRAGDocument[];
  similarity: number;
  sources: string[];
  recommendedActions: string[];
}

export interface RAGChainInput {
  question: string;
  userContextSnippet?: string;
  preRetrievedDocs?: Document[];
}

/**
 * Builds a real LangChain RunnableSequence:
 * Input -> PgVectorRetriever -> format context -> ragPromptTemplate -> ChatGroq -> StringOutputParser
 */
export function buildRunnableRAGChain(retriever: PgVectorRetriever) {
  const model = getLangChainChatGroq({ temperature: 0.2 });
  const parser = new StringOutputParser();
  const isTracing = process.env.LANGCHAIN_TRACING_ENABLED === 'true';

  const chain = RunnableSequence.from<RAGChainInput, string>([
    {
      context: new RunnableLambda({
        func: async (input: RAGChainInput) => {
          const t0 = performance.now();
          const docs = input.preRetrievedDocs ?? (await retriever.invoke(input.question));
          const formatted = docs
            .map((d) => `[Source: ${d.metadata?.source || 'Growearn'}]\n${d.pageContent}`)
            .join('\n\n');
          if (isTracing) {
            logger.info(`[LangChain:Trace] Retriever step completed in ${(performance.now() - t0).toFixed(2)}ms`);
          }
          return input.userContextSnippet ? `${formatted}\n\n${input.userContextSnippet}` : formatted;
        },
      }),
      question: new RunnableLambda({
        func: (input: RAGChainInput) => input.question,
      }),
    },
    ragPromptTemplate,
    model,
    parser,
  ]);

  return chain;
}

let _defaultRetriever: PgVectorRetriever | null = null;
let _defaultRAGChain: ReturnType<typeof buildRunnableRAGChain> | null = null;

export function getDefaultRAGChain() {
  if (!_defaultRAGChain) {
    _defaultRetriever = new PgVectorRetriever();
    _defaultRAGChain = buildRunnableRAGChain(_defaultRetriever);
  }
  return _defaultRAGChain;
}

export const ragChain = {
  invoke: (input: RAGChainInput) => getDefaultRAGChain().invoke(input),
};

export async function executeRAGWithTracing(input: RAGChainInput): Promise<string> {
  const chain = buildRunnableRAGChain(new PgVectorRetriever());
  return chain.invoke(input);
}

export class ProductionRAGChain {
  /**
   * Executes the full production RAG pipeline using LangChain RunnableSequence.
   */
  static async execute(
    question: string,
    userContext?: UserAIContext | null
  ): Promise<GroundedRAGResult> {
    const q = question.trim();
    if (!q) {
      return {
        answer: 'Please provide a valid question or query.',
        intent: 'general',
        retrievedDocuments: [],
        similarity: 0,
        sources: [],
        recommendedActions: ['Explore Courses', 'Find Mentors', 'Browse Jobs'],
      };
    }

    // 1. Structured Intent Classification
    const { intent } = await IntentClassifier.classify(q);

    // 2. Query pgvector Vector Store via PgVectorRetriever with role-based isolation
    let chunkRecords: DocumentChunkRecord[] = [];
    const retriever = new PgVectorRetriever({
      topK: 5,
      userRole: userContext?.role,
      userId: userContext?.id,
    });

    if (isEmbeddingConfigured()) {
      try {
        chunkRecords = await retriever.retrieveRecords(q);
      } catch {
        chunkRecords = [];
      }
    }

    const retrievedDocuments: GroundedRAGDocument[] = chunkRecords.map((r) => ({
      id: r.id,
      source: r.source,
      sourceType: r.sourceType,
      content: r.content,
      similarity: r.similarity ?? 0,
    }));

    const avgSimilarity =
      retrievedDocuments.length > 0
        ? Number(
          (
            retrievedDocuments.reduce((sum, d) => sum + (d.similarity || 0), 0) /
            retrievedDocuments.length
          ).toFixed(4)
        )
        : 0;

    const sources = Array.from(new Set(retrievedDocuments.map((d) => d.source)));

    // 3. User profile context snippet
    let userSnippet: string | undefined = undefined;
    if (userContext) {
      const userSkills = userContext.skills?.join(', ') || 'None added yet';
      const targetRole = userContext.profile?.targetRole || userContext.profile?.careerGoal || 'Software Engineer';
      userSnippet = `[User Profile Context: ${userContext.name}]\n- Target Role: ${targetRole}\n- Verified Skills: ${userSkills}\n- Experience Level: ${userContext.profile?.experienceLevel || 'Intermediate'}`;
    }

    // 4. Grounded LLM Generation using LangChain RunnableSequence
    let answer = '';
    const hasGroqApiKey = Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0);

    if (!hasGroqApiKey) {
      const formattedCatalog = retrievedDocuments.length > 0
        ? retrievedDocuments.map((d, i) => `[Result ${i + 1}] (${d.source}): ${d.content}`).join('\n\n')
        : 'No direct database matches found.';

      return {
        answer: `[DEGRADED: GROQ_API_KEY unconfigured] Grounded platform matches:\n\n${formattedCatalog}`,
        intent,
        retrievedDocuments,
        similarity: avgSimilarity,
        sources,
        recommendedActions: ['Configure GROQ_API_KEY in .env', 'Explore Courses', 'Browse Mentors'],
      };
    }

    const isLLMAvailable = LLMClient.isAvailable();

    if (isLLMAvailable) {
      try {
        const ragChain = buildRunnableRAGChain(retriever);
        const t0 = performance.now();
        // Convert chunk records to documents for single-pass retrieval execution
        const preRetrievedDocs = chunkRecords.map(
          (r) =>
            new Document({
              pageContent: r.content,
              metadata: {
                id: r.id,
                source: r.source,
                sourceType: r.sourceType,
                similarity: r.similarity,
                ...r.metadata,
              },
            })
        );
        answer = await ragChain.invoke({
          question: q,
          userContextSnippet: userSnippet,
          preRetrievedDocs,
        });

        if (process.env.LANGCHAIN_TRACING_ENABLED === 'true') {
          logger.info(`[LangChain:Trace] RunnableSequence total latency: ${(performance.now() - t0).toFixed(2)}ms`);
        }
      } catch {
        // Fallback to LLMClient direct call if LangChain sequence fails
        try {
          let contextString = PgVectorRetriever.formatDocsForPrompt(chunkRecords);
          if (userSnippet) contextString = `${contextString}\n\n${userSnippet}`;

          const formattedPrompt = await ragPromptTemplate.formatMessages({
            context: contextString,
            question: q,
          });

          const completion = await LLMClient.complete({
            messages: [
              { role: 'system', content: formattedPrompt[0]?.content as string },
              { role: 'user', content: formattedPrompt[1]?.content as string },
            ],
            temperature: 0.2,
            maxTokens: 1500,
          });

          if (completion && completion.text) {
            answer = completion.text;
          }
        } catch (llmError) {
          logger.error('[ProductionRAGChain] Generation error, utilizing grounded fallback:', llmError);
        }
      }
    }

    // Grounded fallback if LLM unavailable
    if (!answer) {
      if (retrievedDocuments.length > 0) {
        answer = `Based on the GrowEarn platform database:\n\n${retrievedDocuments
          .slice(0, 3)
          .map((d) => `### ${d.source}\n${d.content.slice(0, 300)}...`)
          .join('\n\n')}\n\nYou can explore more matching resources in the Courses, Mentors, and Jobs sections.`;
      } else {
        answer = `No matching information was found in the GrowEarn platform database for your query "${q}". Please check back later or try rephrasing your search.`;
      }
    }

    // 5. Generate Intent-Specific Recommended Actions
    const recommendedActions = this.getRecommendedActions(intent);

    return {
      answer,
      intent,
      retrievedDocuments,
      similarity: avgSimilarity,
      sources,
      recommendedActions,
    };
  }

  private static getRecommendedActions(intent: IntentCategory): string[] {
    switch (intent) {
      case 'mentor':
        return ['Book 1-on-1 Mentorship', 'View Mentor Profiles', 'Explore System Design Mentors'];
      case 'course':
        return ['Browse All Courses', 'View Next.js Masterclass', 'Spring Boot 3 Microservices'];
      case 'jobs':
        return ['Browse Remote Jobs', 'Generate AI Proposal', 'Filter by Skill Match'];
      case 'roadmap':
        return ['Generate Full Career Roadmap', 'Analyze Missing Skills', 'View Roadmap Milestones'];
      case 'profile':
        return ['Run Skill Analysis', 'Audit Resume', 'Open Onboarding'];
      case 'general':
      default:
        return ['Explore Courses', 'Find Mentors', 'Browse Jobs', 'Generate Career Roadmap'];
    }
  }
}
