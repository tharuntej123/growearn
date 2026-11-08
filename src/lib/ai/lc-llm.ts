import { ChatGroq } from '@langchain/groq';

export interface LangChainLLMOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

/**
 * Returns a production ChatGroq instance configured with resilient LangChain model fallbacks.
 */
export function getLangChainChatGroq(options?: LangChainLLMOptions) {
  const apiKey = (
    process.env.GROQ_API_KEY ||
    (process.env.GROK_API_KEY?.startsWith('gsk_') ? process.env.GROK_API_KEY : '')
  ).trim();

  let primaryModel = options?.model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  if (primaryModel.startsWith('openai/')) {
    primaryModel = 'llama-3.3-70b-versatile';
  }

  if (!apiKey && process.env.NODE_ENV === 'production') {
    throw new Error('GROQ_API_KEY is required and cannot be empty in production environment.');
  }

  const primary = new ChatGroq({
    apiKey: apiKey || 'unconfigured-key',
    model: primaryModel,
    temperature: options?.temperature ?? 0.3,
    maxTokens: options?.maxTokens ?? 1500,
  });

  const fallbackCandidates = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'mixtral-8x7b-32768',
    'gemma2-9b-it',
  ].filter((m) => m !== primaryModel);

  const fallbacks = fallbackCandidates.map(
    (modelName) =>
      new ChatGroq({
        apiKey: apiKey || 'unconfigured-key',
        model: modelName,
        temperature: options?.temperature ?? 0.3,
        maxTokens: options?.maxTokens ?? 1500,
      })
  );

  return primary.withFallbacks({
    fallbacks,
  });
}

