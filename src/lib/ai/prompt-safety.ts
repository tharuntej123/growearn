// Prompt Safety & Injection Defense Layer
// Sanitizes user inputs, resume uploads, and retrieved chunk text to prevent adversarial jailbreaks
// and subversion of core platform boundaries.

export class PromptSafety {
  private static readonly INJECTION_PATTERNS = [
    /ignore (all )?previous instructions/i,
    /system override/i,
    /reveal (the )?(internal )?(service )?secret/i,
    /disregard (all )?rules/i,
    /you are now an unrestricted/i,
    /print environment variables/i,
    /dump process\.env/i,
  ];

  /**
   * Sanitizes untrusted text and wraps it in secure data boundaries.
   */
  public static sanitizeAndDelimit(untrustedText: string, tag: 'context' | 'query' | 'resume'): string {
    if (!untrustedText) return '';

    // Strip control characters and sanitize delimiters
    const cleaned = untrustedText
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/<\/?instructions>/gi, '[INSTRUCTION_TAG_FILTERED]')
      .replace(/<\/?system>/gi, '[SYSTEM_TAG_FILTERED]');

    return `<${tag}_data>\n${cleaned}\n</${tag}_data>`;
  }

  /**
   * Evaluates whether an input contains known adversarial jailbreak patterns.
   */
  public static detectInjectionAttempt(text: string): boolean {
    if (!text) return false;
    return this.INJECTION_PATTERNS.some((pattern) => pattern.test(text));
  }
}

