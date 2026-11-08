import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/utils';
import { SkillRAGService } from '@/lib/ai/skill-rag.service';
import { enforceRateLimit } from '@/lib/rate-limiter';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    const rateLimitResponse = await enforceRateLimit(req, 'ai:mentors', 30, 60, authUser?.id);
    if (rateLimitResponse) return rateLimitResponse;

    const { searchParams } = new URL(req.url);
    const skill = searchParams.get('skill') || 'Full Stack Web Development';
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const excludeIdsParam = searchParams.get('excludeIds');
    const excludeIds = excludeIdsParam ? excludeIdsParam.split(',').filter(Boolean) : [];

    const result = await SkillRAGService.searchMentors({
      skill,
      offset,
      limit,
      excludeIds,
    });

    return apiSuccess({
      mentors: result.mentors,
      total: result.total,
      offset,
      limit,
      hasMore: offset + limit < result.total,
    });
 } catch (_e) { const err = _e as Error; 
    return apiError(err.message || 'Failed to paginate mentors', 'INTERNAL_ERROR', 500);
  }
}
