import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserAIContext } from '@/services/user-context.service';
import { CareerRoadmapService } from '@/lib/ai/roadmap.service';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rate-limiter';

// Learner AI Roadmap Generation Endpoint.
// Exclusively restricted to the LEARNER role with live Tavily search grounding.
export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return apiError(
        'Authentication required to generate a learning roadmap',
        'UNAUTHORIZED',
        401
      );
    }

    // Role-based authorization: Exclusively restricted to LEARNER role
    if (authUser.role !== 'LEARNER') {
      return apiError(
        'Forbidden: AI roadmap generation is exclusively available for the LEARNER role',
        'FORBIDDEN',
        403
      );
    }

    // Rate limit: 15 requests / minute per user
    const rateLimitResponse = await enforceRateLimit(req, 'ai:roadmap', 15, 60, authUser.id);
    if (rateLimitResponse) return rateLimitResponse;

    const userContext = await getUserAIContext(authUser.id);

    const body = await req.json().catch(() => ({}));
    const skills = body.skills || userContext?.skills || [];
    const targetRole =
      body.targetRole || userContext?.profile?.targetRole || userContext?.profile?.careerGoal;
    const exp = body.experienceLevel || userContext?.profile?.experienceLevel;
    const goal = body.careerGoal || userContext?.profile?.careerGoal;

    // Generate roadmap using isolated Tavily web search + LLM grounding
    const roadmap = await CareerRoadmapService.generateForLearnerWithTavily({
      userRole: authUser.role,
      skills,
      targetRole,
      experienceLevel: exp,
      careerGoal: goal,
    });

    // Save or update roadmap and progress using existing database models
    const existing = await prisma.careerRoadmap.findUnique({
      where: { userId: authUser.id },
    });

    if (existing) {
      await prisma.roadmapItem.deleteMany({
        where: { roadmapId: existing.id },
      });
    }

    const saved = await prisma.careerRoadmap.upsert({
      where: { userId: authUser.id },
      update: {
        targetRole: roadmap.targetRole,
        currentLevel: roadmap.currentLevel,
        summary: roadmap.summary,
        estimatedDurationWeeks: roadmap.estimatedDurationWeeks,
        currentSkillsJson: JSON.stringify(roadmap.currentSkills),
        skillGapsJson: JSON.stringify(roadmap.skillGaps),
        finalMilestone: roadmap.finalMilestone,
        phasesJson: JSON.stringify(roadmap.phases),
      },
      create: {
        userId: authUser.id,
        targetRole: roadmap.targetRole,
        currentLevel: roadmap.currentLevel,
        summary: roadmap.summary,
        estimatedDurationWeeks: roadmap.estimatedDurationWeeks,
        currentSkillsJson: JSON.stringify(roadmap.currentSkills),
        skillGapsJson: JSON.stringify(roadmap.skillGaps),
        finalMilestone: roadmap.finalMilestone,
        phasesJson: JSON.stringify(roadmap.phases),
      },
    });

    for (let i = 0; i < roadmap.phases.length; i++) {
      const p = roadmap.phases[i];
      await prisma.roadmapItem.create({
        data: {
          roadmapId: saved.id,
          orderIndex: p.phaseNumber,
          title: p.title,
          description: p.objective,
          milestoneType: 'SKILL',
          relatedSkill: p.skills[0] || null,
          recommendedCourses: p.resources?.slice(0, 3).join(', ') || null,
        },
      });
    }

    return apiSuccess({ roadmap });
  } catch (error: any) {
    console.error('[LearnerRoadmapRoute:Error]', error);
    if (error.message?.includes('Forbidden')) {
      return apiError(error.message, 'FORBIDDEN', 403);
    }
    return apiError(
      error.message || 'Failed to generate learner roadmap',
      'INTERNAL_ERROR',
      500
    );
  }
}
