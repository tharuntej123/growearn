import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserAIContext } from '@/services/user-context.service';
import { SkillAnalysisService } from '@/lib/ai/skill-analysis.service';
import { enforceRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return apiError('Authentication required for skill analysis', 'UNAUTHORIZED', 401);
    }

    const rateLimitResponse = await enforceRateLimit(req, 'ai:skill-analysis', 20, 60, authUser.id);
    if (rateLimitResponse) return rateLimitResponse;

    const userContext = await getUserAIContext(authUser.id);

    const body = await req.json().catch(() => ({}));
    const skills = body.skills || userContext?.skills || [];
    const targetRole =
      body.targetRole ||
      body.careerGoal ||
      userContext?.profile?.targetRole ||
      userContext?.profile?.careerGoal ||
      'Software Engineer';
    const exp = body.experienceLevel || userContext?.profile?.experienceLevel || 'Intermediate';

    const analysis = SkillAnalysisService.analyze(skills, targetRole, exp);

    return apiSuccess({ analysis });
 } catch (_e) { const error = _e as Error; 
    logger.error('Skill analysis error:', error);
    return apiError(
      error.message || 'Failed to analyze skills',
      'INTERNAL_ERROR',
      500
    );
  }
}
