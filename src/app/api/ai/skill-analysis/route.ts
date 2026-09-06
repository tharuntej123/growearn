import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserAIContext } from '@/services/user-context.service';
import { SkillAnalysisService } from '@/lib/ai/skill-analysis.service';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    let userContext = null;
    if (authUser) {
      userContext = await getUserAIContext(authUser.id);
    }

    const body = await req.json().catch(() => ({}));
    const skills = body.skills || userContext?.skills || [];
    const targetRole = body.targetRole || body.careerGoal || userContext?.profile?.targetRole || userContext?.profile?.careerGoal;
    const exp = body.experienceLevel || userContext?.profile?.experienceLevel;

    const analysis = SkillAnalysisService.analyze(skills, targetRole, exp);

    return apiSuccess({ analysis });
  } catch (error: any) {
    console.error('Skill analysis error:', error);
    return apiError(
      error.message || 'Failed to analyze skills',
      'INTERNAL_ERROR',
      500
    );
  }
}
