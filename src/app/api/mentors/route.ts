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

    const { mentors, isPersonalized, label } = await RecommendationService.getMentors(userContext, 50);

    return apiSuccess({
      mentors,
      isPersonalized,
      label,
    });
  } catch (error: any) {
    console.error('Mentors fetch error:', error);
    return apiError(
      error.message || 'Failed to fetch mentors',
      'INTERNAL_ERROR',
      500
    );
  }
}
