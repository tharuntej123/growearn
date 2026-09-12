import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserAIContext } from '@/services/user-context.service';
import { RecommendationService } from '@/services/recommendation.service';
import { SkillAnalysisService } from '@/lib/ai/skill-analysis.service';
import { CareerRoadmapService } from '@/lib/ai/roadmap.service';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return apiError('Authentication required', 'UNAUTHORIZED', 401);
    }

    const userContext = await getUserAIContext(authUser.id);
    if (!userContext) {
      return apiError('User profile not found', 'NOT_FOUND', 404);
    }

    const [jobsRes, coursesRes, mentorsRes] = await Promise.all([
      RecommendationService.getJobs(userContext, 4),
      RecommendationService.getCourses(userContext, 4),
      RecommendationService.getMentors(userContext, 3),
    ]);

    const skillAnalysis = SkillAnalysisService.analyze(
      userContext.skills,
      userContext.profile?.targetRole || userContext.profile?.careerGoal,
      userContext.profile?.experienceLevel
    );

    let roadmap = userContext.careerRoadmap;
    if (!roadmap && userContext.hasSkills) {
      roadmap = CareerRoadmapService.generate(
        userContext.skills,
        userContext.profile?.targetRole,
        userContext.profile?.experienceLevel,
        userContext.profile?.careerGoal
      ) as any;
    }

    return apiSuccess({
      userContext,
      skillAnalysis,
      roadmap,
      recommendedJobs: jobsRes.jobs,
      isJobsPersonalized: jobsRes.isPersonalized,
      recommendedCourses: coursesRes.courses,
      isCoursesPersonalized: coursesRes.isPersonalized,
      recommendedMentors: mentorsRes.mentors,
      isMentorsPersonalized: mentorsRes.isPersonalized,
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    return apiError(
      error.message || 'Failed to fetch dashboard data',
      'INTERNAL_ERROR',
      500
    );
  }
}
