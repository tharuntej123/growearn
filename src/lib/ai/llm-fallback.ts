// LLM Resiliency & Selective Fallback Policy
// Defines which HTTP error statuses and error conditions warrant fallback to secondary models
// vs which client-side/auth errors must fail immediately without masked retries.

export class LLMFallbackPolicy {
  /**
   * Evaluates whether an error condition should trigger secondary model fallback.
   */
  public static shouldTriggerFallback(statusCodeOrError: number | Error): boolean {
    if (typeof statusCodeOrError === 'number') {
      const code = statusCodeOrError;
      // Fail closed / do NOT fall back on client errors (400, 401, 403, 404, 422)
      if (code === 400 || code === 401 || code === 403 || code === 404 || code === 422) {
        return false;
      }
      // Transient provider errors (429 Rate Limit, 5xx Server Errors) warrant fallback
      if (code === 429 || (code >= 500 && code <= 599)) {
        return true;
      }
      return false;
    }

    const err = statusCodeOrError;
    const msg = (err.message || '').toLowerCase();

    // Key or auth failure -> fail immediately
    if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid_api_key')) {
      return false;
    }
    // Validation or bad request -> fail immediately
    if (msg.includes('400') || msg.includes('bad_request')) {
      return false;
    }

    // Rate limits, quotas, gateway timeouts, connection drops -> trigger fallback
    if (
      msg.includes('429') ||
      msg.includes('rate_limit') ||
      msg.includes('timeout') ||
      msg.includes('timed out') ||
      msg.includes('etimedout') ||
      msg.includes('econnreset') ||
      msg.includes('500') ||
      msg.includes('502') ||
      msg.includes('503') ||
      msg.includes('504')
    ) {
      return true;
    }

    return false;
  }
}
