import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserAIContext } from '@/services/user-context.service';
import { CareerRoadmapService } from '@/lib/ai/roadmap.service';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    let userContext = null;
    if (authUser) {
      userContext = await getUserAIContext(authUser.id);
    }

    const body = await req.json().catch(() => ({}));
    const skills = body.skills || userContext?.skills || [];
    const targetRole = body.targetRole || userContext?.profile?.targetRole || userContext?.profile?.careerGoal;
    const exp = body.experienceLevel || userContext?.profile?.experienceLevel;
    const goal = body.careerGoal || userContext?.profile?.careerGoal;

    const roadmap = CareerRoadmapService.generate(skills, targetRole, exp, goal);

    // If authenticated, persist roadmap in database
    if (authUser) {
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
          },
        });
      }
    }

    return apiSuccess({ roadmap });
  } catch (error: any) {
    console.error('Roadmap generation error:', error);
    return apiError(
      error.message || 'Failed to generate roadmap',
      'INTERNAL_ERROR',
      500
    );
  }
}
