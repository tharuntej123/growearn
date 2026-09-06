import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserAIContext } from '@/services/user-context.service';
import { RecommendationService } from '@/services/recommendation.service';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    let userContext = null;
    if (authUser) {
      userContext = await getUserAIContext(authUser.id);
    }

    const { courses, isPersonalized, label } = await RecommendationService.getCourses(userContext, 50);

    return apiSuccess({
      courses,
      isPersonalized,
      label,
    });
  } catch (error: any) {
    console.error('Courses fetch error:', error);
    return apiError(
      error.message || 'Failed to fetch courses',
      'INTERNAL_ERROR',
      500
    );
  }
}
