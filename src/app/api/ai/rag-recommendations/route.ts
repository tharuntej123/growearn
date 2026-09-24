import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserAIContext } from '@/services/user-context.service';
import { RAGDatabaseEngine } from '@/lib/ai/rag/rag-database';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
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

    // Execute RAG retrieval against application database
    const ragResult = await RAGDatabaseEngine.querySkillRAG(cleanSkill, userContext);

    // If authenticated, persist the generated roadmap to the student's database record
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

        // Also record an AI recommendation interaction
        await prisma.aIRecommendation.create({
          data: {
            userId: authUser.id,
            recType: 'SKILL',
            title: `RAG Learning Path: ${cleanSkill}`,
            explanation: `Retrieved top 5 verified courses and top 5 mentors specializing in ${cleanSkill} via RAG Vector Database.`,
            matchPercentage: 96,
          },
        });
      } catch (dbErr) {
        console.warn('Roadmap persistence non-fatal warning:', dbErr);
      }
    }

    return apiSuccess(ragResult);
  } catch (error: any) {
    console.error('RAG recommendations error:', error);
    return apiError(
      error.message || 'Failed to process RAG skill recommendations',
      'INTERNAL_ERROR',
      500
    );
  }
}
