import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/utils';
import { SkillRAGService } from '@/lib/ai/skill-rag.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const skill = searchParams.get('skill') || 'Full Stack Web Development';
    const level = searchParams.get('level') || undefined;
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '5', 10);
    const excludeIdsParam = searchParams.get('excludeIds');
    const excludeIds = excludeIdsParam ? excludeIdsParam.split(',').filter(Boolean) : [];

    const result = await SkillRAGService.searchCourses({
      skill,
      level,
      offset,
      limit,
      excludeIds,
    });

    return apiSuccess({
      courses: result.courses,
      total: result.total,
      offset,
      limit,
      hasMore: offset + limit < result.total,
    });
  } catch (error: any) {
    return apiError(error.message || 'Failed to paginate courses', 'INTERNAL_ERROR', 500);
  }
}
