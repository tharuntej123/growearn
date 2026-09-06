import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserAIContext } from '@/services/user-context.service';
import { SkillAnalysisService } from '@/lib/ai/skill-analysis.service';
import { CareerRoadmapService } from '@/lib/ai/roadmap.service';
import { z } from 'zod';

const addSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required'),
  proficiencyLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('INTERMEDIATE'),
});

export async function GET() {
  const skills = await prisma.skill.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { userSkills: true, jobSkills: true },
      },
    },
  });
  return apiSuccess({ skills });
}

export async function POST(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) {
    return apiError('Authentication required', 'UNAUTHORIZED', 401);
  }

  try {
    const body = await req.json();
    const validated = addSkillSchema.safeParse(body);
    if (!validated.success) {
      return apiError('Invalid skill data', 'VALIDATION_ERROR', 400, validated.error.flatten().fieldErrors);
    }

    const cleanName = validated.data.name.trim();

    // Canonical skill lookup/creation
    const skill = await prisma.skill.upsert({
      where: { name: cleanName },
      update: {},
      create: { name: cleanName, category: 'Engineering' },
    });

    const userSkill = await prisma.userSkill.upsert({
      where: {
        userId_skillId: {
          userId: authUser.id,
          skillId: skill.id,
        },
      },
      update: { proficiencyLevel: validated.data.proficiencyLevel },
      create: {
        userId: authUser.id,
        skillId: skill.id,
        proficiencyLevel: validated.data.proficiencyLevel,
        isVerified: true,
      },
      include: { skill: true },
    });

    // Mark isOnboarded if user has profile
    await prisma.profile.updateMany({
      where: { userId: authUser.id },
      data: { isOnboarded: true },
    });

    // Recalculate AI analysis & roadmap
    const userContext = await getUserAIContext(authUser.id);
    if (userContext) {
      const analysis = SkillAnalysisService.analyze(
        userContext.skills,
        userContext.profile?.targetRole || userContext.profile?.careerGoal,
        userContext.profile?.experienceLevel
      );

      await prisma.aIProfile.upsert({
        where: { userId: authUser.id },
        update: {
          currentLevel: analysis.currentLevel,
          skillSummary: analysis.summary,
          strengthsJson: JSON.stringify(analysis.strengths),
          gapAnalysisJson: JSON.stringify(analysis.skillGaps),
          suggestedRolesJson: JSON.stringify(analysis.recommendedSkills),
        },
        create: {
          userId: authUser.id,
          careerGoal: userContext.profile?.careerGoal || 'Software Engineer',
          currentLevel: analysis.currentLevel,
          skillSummary: analysis.summary,
          strengthsJson: JSON.stringify(analysis.strengths),
          gapAnalysisJson: JSON.stringify(analysis.skillGaps),
          suggestedRolesJson: JSON.stringify(analysis.recommendedSkills),
        },
      });
    }

    return apiSuccess({ userSkill, userContext }, 201);
  } catch (err: any) {
    return apiError(err.message || 'Failed to add skill', 'SKILL_ERROR', 400);
  }
}
