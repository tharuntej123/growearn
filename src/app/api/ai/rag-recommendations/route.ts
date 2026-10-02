import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserAIContext } from '@/services/user-context.service';
import { SkillRAGService } from '@/lib/ai/skill-rag.service';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);

    // Rate limit: 15 requests / minute per user or IP
    const rateLimitResponse = await enforceRateLimit(req, 'ai:rag-recommendations', 15, 60, authUser?.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const { skill } = body;

    if (!skill || !skill.trim()) {
      return apiError('Skill or learning target is required', 'VALIDATION_ERROR', 400);
    }

    const cleanSkill = skill.trim();

    let userContext = null;
    if (authUser) {
      userContext = await getUserAIContext(authUser.id);
    }

    const userLevel = userContext?.profile?.experienceLevel || 'Intermediate';
    const ragResult = await SkillRAGService.querySkillRAG(cleanSkill, userLevel);

    if (authUser) {
      try {
        await prisma.careerRoadmap.upsert({
          where: { userId: authUser.id },
          create: {
            userId: authUser.id,
            targetRole: cleanSkill,
            currentLevel: ragResult.roadmap.currentLevel,
            summary: ragResult.roadmap.summary,
            estimatedDurationWeeks: ragResult.roadmap.estimatedDurationWeeks,
            phasesJson: JSON.stringify(ragResult.roadmap.phases),
            finalMilestone: ragResult.roadmap.finalMilestone,
          },
          update: {
            targetRole: cleanSkill,
            currentLevel: ragResult.roadmap.currentLevel,
            summary: ragResult.roadmap.summary,
            estimatedDurationWeeks: ragResult.roadmap.estimatedDurationWeeks,
            phasesJson: JSON.stringify(ragResult.roadmap.phases),
            finalMilestone: ragResult.roadmap.finalMilestone,
          },
        });
      } catch (dbErr) {
        // Non-fatal logging
      }
    }

    return apiSuccess(ragResult);
  } catch (error: any) {
    return apiError(
      error.message || 'Failed to process RAG skill recommendations',
      'INTERNAL_ERROR',
      500
    );
  }
}
