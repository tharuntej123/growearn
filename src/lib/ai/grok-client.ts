/**
 * Groq, Grok (xAI), OpenAI & Multi-Provider LLM Client for Groearn
 * 
 * Supports:
 * - Groq (llama-3.3-70b-versatile, llama-3.1-8b-instant) via GROQ_API_KEY or keys starting with gsk_
 * - xAI Grok (grok-2-latest, grok-beta, grok-2) via GROK_API_KEY or XAI_API_KEY (xai-...)
 * - OpenAI (gpt-4o, gpt-4o-mini) via OPENAI_API_KEY (sk-...)
 * - Google Gemini via GEMINI_API_KEY
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMCompletionOptions {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface LLMCompletionResult {
  text: string;
  provider: 'groq' | 'grok' | 'openai' | 'gemini' | 'none';
  model: string;
}

export class GrokLLMClient {
  /**
   * Check if any LLM API key is available
   */
  static isAvailable(): boolean {
    return this.getActiveProvider() !== 'none';
  }

  /**
   * Determine the active provider
   */
  static getActiveProvider(): 'groq' | 'grok' | 'openai' | 'gemini' | 'none' {
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey && groqKey.trim() !== '') return 'groq';

    const grokKey = process.env.GROK_API_KEY || process.env.XAI_API_KEY;
    if (grokKey && grokKey.trim() !== '') {
      if (grokKey.trim().startsWith('gsk_')) return 'groq';
      return 'grok';
    }

    const openAIKey = process.env.OPENAI_API_KEY;
    if (openAIKey && openAIKey.trim() !== '') {
      if (openAIKey.trim().startsWith('gsk_')) return 'groq';
      if (openAIKey.trim().startsWith('xai-')) return 'grok';
      return 'openai';
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey.trim() !== '') return 'gemini';

    return 'none';
  }

  /**
   * Complete chat using the detected provider
   */
  static async complete(options: LLMCompletionOptions): Promise<LLMCompletionResult | null> {
    const provider = this.getActiveProvider();
    if (provider === 'none') return null;

    if (provider === 'groq') {
      return this.callGroq(options);
    } else if (provider === 'grok') {
      return this.callGrok(options);
    } else if (provider === 'openai') {
      return this.callOpenAI(options);
    } else if (provider === 'gemini') {
      return this.callGemini(options);
    }

    return null;
  }

  /**
   * Complete chat and parse the result as JSON
   */
  static async completeJSON<T>(options: LLMCompletionOptions): Promise<{ data: T; provider: string; model: string } | null> {
    const res = await this.complete(options);
    if (!res || !res.text) return null;

    try {
      let cleaned = res.text.trim();
      // Strip markdown code fences if present
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
      }
      // If there is still leading/trailing text outside the first { or [, slice to valid JSON
      const firstBrace = cleaned.indexOf('{');
      const firstBracket = cleaned.indexOf('[');
      let startIndex = -1;
      let isObject = false;

      if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startIndex = firstBrace;
        isObject = true;
      } else if (firstBracket !== -1) {
        startIndex = firstBracket;
        isObject = false;
      }

      if (startIndex !== -1) {
        const lastChar = isObject ? cleaned.lastIndexOf('}') : cleaned.lastIndexOf(']');
        if (lastChar !== -1 && lastChar >= startIndex) {
          cleaned = cleaned.substring(startIndex, lastChar + 1);
        }
      }

      const parsed = JSON.parse(cleaned) as T;
      return { data: parsed, provider: res.provider, model: res.model };
    } catch (err) {
      console.warn('[GrokLLMClient] Failed to parse JSON completion:', err, '\nRaw text was:\n', res.text);
      return null;
    }
  }

  /**
   * Call Groq API (https://api.groq.com/openai/v1/chat/completions)
   */
  private static async callGroq(options: LLMCompletionOptions): Promise<LLMCompletionResult | null> {
    let apiKey = (process.env.GROQ_API_KEY || process.env.GROK_API_KEY || process.env.OPENAI_API_KEY || '').trim();
    if (!apiKey) return null;

    let model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

    const fallbackCandidates = [
      model,
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.8-27b',
      'groq/compound',
    ].filter((m, i, arr) => arr.indexOf(m) === i);

    for (const candidateModel of fallbackCandidates) {
      try {
        const isQwen = candidateModel.includes('qwen');
        const maxTokens = isQwen ? Math.min(options.maxTokens ?? 700, 850) : (options.maxTokens ?? 1500);

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: candidateModel,
            messages: options.messages,
            temperature: options.temperature ?? 0.3,
            max_tokens: maxTokens,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.choices?.[0]?.message?.content?.trim();
          if (text) {
            return { text, provider: 'groq', model: candidateModel };
          }
        } else {
          const errText = await response.text();
          console.warn(`[GrokLLMClient] Groq model ${candidateModel} error (${response.status}):`, errText);
        }
      } catch (err) {
        console.warn(`[GrokLLMClient] Groq fetch error on model ${candidateModel}:`, err);
      }
    }

    return null;
  }

  /**
   * Call xAI Grok API (https://api.x.ai/v1/chat/completions)
   */
  private static async callGrok(options: LLMCompletionOptions): Promise<LLMCompletionResult | null> {
    const apiKey = (process.env.GROK_API_KEY || process.env.XAI_API_KEY || '').trim();
    if (!apiKey) return null;

    const model = process.env.GROK_MODEL || 'grok-2-latest';
    const endpoint = 'https://api.x.ai/v1/chat/completions';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: options.messages,
          temperature: options.temperature ?? 0.3,
          max_tokens: options.maxTokens ?? 2048,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[GrokLLMClient] xAI Grok API error (${response.status}):`, errorText);
        if (model !== 'grok-beta') {
          return this.callGrokFallback(options, apiKey, 'grok-beta');
        }
        return null;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) {
        return { text, provider: 'grok', model };
      }
      return null;
    } catch (err) {
      console.warn('[GrokLLMClient] Grok network/fetch error:', err);
      return null;
    }
  }

  private static async callGrokFallback(
    options: LLMCompletionOptions,
    apiKey: string,
    fallbackModel: string
  ): Promise<LLMCompletionResult | null> {
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: fallbackModel,
          messages: options.messages,
          temperature: options.temperature ?? 0.3,
          max_tokens: options.maxTokens ?? 2048,
        }),
      });
      if (!response.ok) return null;
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) {
        return { text, provider: 'grok', model: fallbackModel };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Call OpenAI API
   */
  private static async callOpenAI(options: LLMCompletionOptions): Promise<LLMCompletionResult | null> {
    const apiKey = (process.env.OPENAI_API_KEY || '').trim();
    if (!apiKey) return null;

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: options.messages,
          temperature: options.temperature ?? 0.3,
          max_tokens: options.maxTokens ?? 2048,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[GrokLLMClient] OpenAI API error (${response.status}):`, errorText);
        return null;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim();
      if (text) {
        return { text, provider: 'openai', model };
      }
      return null;
    } catch (err) {
      console.warn('[GrokLLMClient] OpenAI fetch error:', err);
      return null;
    }
  }

  /**
   * Call Gemini API (via v1beta API)
   */
  private static async callGemini(options: LLMCompletionOptions): Promise<LLMCompletionResult | null> {
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) return null;

    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    try {
      const systemInstruction = options.messages.find((m) => m.role === 'system')?.content || '';
      const userContents = options.messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }));

      const body: any = { contents: userContents };
      if (systemInstruction) {
        body.systemInstruction = { parts: [{ text: systemInstruction }] };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`[GrokLLMClient] Gemini error (${response.status}):`, errText);
        return null;
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) {
        return { text, provider: 'gemini', model };
      }
      return null;
    } catch (err) {
      console.warn('[GrokLLMClient] Gemini fetch error:', err);
      return null;
    }
  }
}
