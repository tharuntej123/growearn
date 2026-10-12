// Dedicated, isolated Tavily search service EXCLUSIVELY for Learner AI roadmap generation.
// STAGE RESTRICTION: Never imported, called, or exposed to any other RAG, job, mentor, or app feature.

export interface TavilySearchResult {
  title: string;
  url: string;
  snippet: string;
  score?: number;
}

export interface LearnerSearchOptions {
  skill: string;
  targetRole?: string | null;
  experienceLevel?: string | null;
  stage?: string | null;
  maxResults?: number;
}

interface CacheEntry {
  timestamp: number;
  results: TavilySearchResult[];
}

export class LearnerRoadmapSearchService {
  private static readonly TAVILY_ENDPOINT = 'https://api.tavily.com/search';
  private static readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 Hour in-memory TTL
  private static readonly REQUEST_TIMEOUT_MS = 7000; // 7 seconds timeout
  private static cache = new Map<string, CacheEntry>();

  // Check if Tavily API is configured with a non-empty key.
  public static isConfigured(): boolean {
    const key = (process.env.TAVILY_API_KEY || '').trim();
    return key.length > 0 && !key.includes('your_tavily');
  }

  // Sanitize user inputs to prevent prompt injection or malformed search queries.
  private static sanitizeQueryInput(text: string): string {
    return text
      .replace(/[\r\n\t]+/g, ' ')
      .replace(/[^\w\s\+\#\.\-\/]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 150);
  }

  // Build clean, high-precision query for curriculum learning materials.
  public static buildSearchQuery(options: LearnerSearchOptions): string {
    const cleanSkill = this.sanitizeQueryInput(options.skill || 'Programming');
    const cleanRole = options.targetRole ? this.sanitizeQueryInput(options.targetRole) : '';
    const cleanLevel = options.experienceLevel ? this.sanitizeQueryInput(options.experienceLevel) : 'Beginner';

    let query = `${cleanSkill} learning roadmap documentation tutorial`;
    if (cleanRole) {
      query += ` for ${cleanRole}`;
    }
    if (cleanLevel) {
      query += ` ${cleanLevel}`;
    }
    return query.trim();
  }

  // Clear search cache (useful for testing or forced refresh).
  public static clearCache(): void {
    this.cache.clear();
  }

  // Execute isolated server-side Tavily search for learning resources.
  public static async searchLearningResources(
    options: LearnerSearchOptions
  ): Promise<TavilySearchResult[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const query = this.buildSearchQuery(options);
    const cacheKey = `${query.toLowerCase()}__${options.maxResults || 5}`;

    // 1. Check in-memory cache to save API credits
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
      return cached.results;
    }

    const apiKey = (process.env.TAVILY_API_KEY || '').trim();
    const maxResults = Math.min(options.maxResults || 5, 8);

    const requestPayload = {
      api_key: apiKey,
      query,
      search_depth: 'basic',
      include_answer: false,
      max_results: maxResults,
      include_raw_content: false,
    };

    try {
      const response = await fetch(this.TAVILY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(requestPayload),
        signal: AbortSignal.timeout(this.REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.warn(
          `[LearnerRoadmapSearch:Warn] Tavily search returned HTTP ${response.status}: ${errorText.slice(0, 150)}`
        );
        return [];
      }

      const data = await response.json().catch(() => null);
      if (!data || !Array.isArray(data.results)) {
        return [];
      }

      // 2. Validate, normalize, and deduplicate results
      const seenUrls = new Set<string>();
      const normalizedResults: TavilySearchResult[] = [];

      for (const item of data.results) {
        if (!item || typeof item.url !== 'string') continue;

        const rawUrl = item.url.trim();
        // Enforce valid HTTPS/HTTP URL
        if (!rawUrl.startsWith('https://') && !rawUrl.startsWith('http://')) {
          continue;
        }

        // Deduplicate URLs
        if (seenUrls.has(rawUrl.toLowerCase())) {
          continue;
        }
        seenUrls.add(rawUrl.toLowerCase());

        const rawTitle = typeof item.title === 'string' ? item.title.trim() : 'Learning Resource';
        const rawSnippet = typeof item.content === 'string' ? item.content.trim() : '';

        // Sanitize content against prompt injection directives
        const sanitizedTitle = rawTitle.replace(/[\<\>]/g, '').slice(0, 160);
        const sanitizedSnippet = rawSnippet
          .replace(/system prompt|ignore previous instructions/gi, '')
          .replace(/[\<\>]/g, '')
          .slice(0, 300);

        normalizedResults.push({
          title: sanitizedTitle,
          url: rawUrl,
          snippet: sanitizedSnippet,
          score: typeof item.score === 'number' ? item.score : undefined,
        });

        if (normalizedResults.length >= maxResults) {
          break;
        }
      }

      // Store in cache
      this.cache.set(cacheKey, {
        timestamp: Date.now(),
        results: normalizedResults,
      });

      return normalizedResults;
    } catch (err: any) {
      // Graceful fail-open fallback: Never throw to frontend, log structured warning
      if (err.name === 'TimeoutError' || err.message?.includes('timeout')) {
        console.warn(`[LearnerRoadmapSearch:Timeout] Tavily search timed out after ${this.REQUEST_TIMEOUT_MS}ms`);
      } else {
        console.warn(`[LearnerRoadmapSearch:Error] Failed to fetch Tavily search results: ${err.message}`);
      }
      return [];
    }
  }
}
