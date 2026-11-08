// Relevance Gate for GrowEarn Semantic RAG
// Rejects out-of-domain queries when cosine similarity falls below threshold,
// preventing LLM hallucination and wasted token spend.

export interface RelevanceEvaluation {
  isRelevant: boolean;
  score: number;
  refusalReason: string | null;
}

export class RelevanceGate {
  public static readonly RELEVANCE_THRESHOLD = 0.45;

  private static readonly CAREER_KEYWORDS = new Set([
    'learn', 'roadmap', 'course', 'mentor', 'job', 'developer', 'engineer',
    'react', 'next.js', 'typescript', 'python', 'java', 'spring', 'docker',
    'backend', 'frontend', 'database', 'sql', 'postgres', 'freelance', 'contract',
    'architect', 'system', 'api', 'code', 'programming', 'skills', 'career'
  ]);

  /**
   * Evaluates query relevance based on cosine similarity and domain taxonomy.
   */
  public static evaluateRelevance(query: string, maxSimilarity: number): RelevanceEvaluation {
    const qLower = query.toLowerCase();
    const hasDomainKeyword = Array.from(this.CAREER_KEYWORDS).some((kw) => qLower.includes(kw));

    // If similarity meets threshold, pass
    if (maxSimilarity >= this.RELEVANCE_THRESHOLD) {
      return {
        isRelevant: true,
        score: maxSimilarity,
        refusalReason: null,
      };
    }

    // If below threshold but clearly matches domain keywords, permit marginal query
    if (hasDomainKeyword && maxSimilarity >= 0.35) {
      return {
        isRelevant: true,
        score: maxSimilarity,
        refusalReason: null,
      };
    }

    return {
      isRelevant: false,
      score: maxSimilarity,
      refusalReason:
        'I cannot find any relevant courses, mentors, or career roadmaps matching your query in the GrowEarn platform catalog. GrowEarn specializes in software engineering, technical career roadmaps, and industry mentorship.',
    };
  }
}

