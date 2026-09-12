import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { updateProfileSchema } from '@/validators/auth.schema';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserAIContext } from '@/services/user-context.service';
import { SkillAnalysisService } from '@/lib/ai/skill-analysis.service';
import { CareerRoadmapService } from '@/lib/ai/roadmap.service';

export async function GET(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) {
    return apiError('Authentication required', 'UNAUTHORIZED', 401);
  }

  const userContext = await getUserAIContext(authUser.id);
  if (!userContext) {
    return apiError('User not found', 'NOT_FOUND', 404);
  }

  return apiSuccess({ user: userContext });
}

export async function PUT(req: NextRequest) {
  const authUser = await getCurrentUser(req);
  if (!authUser) {
    return apiError('Authentication required', 'UNAUTHORIZED', 401);
  }

  try {
    const body = await req.json();
    const validated = updateProfileSchema.safeParse(body);
    if (!validated.success) {
      return apiError('Validation error', 'VALIDATION_ERROR', 400, validated.error.format());
    }

    const {
      name,
      headline,
      bio,
      location,
      country,
      state,
      city,
      avatarUrl,
      ...profileData
    } = validated.data;

    const userData: any = {};
    if (name !== undefined) userData.name = name;
    if (headline !== undefined) userData.headline = headline;
    if (bio !== undefined) userData.bio = bio;
    if (location !== undefined) userData.location = location;
    if (country !== undefined) userData.country = country;
    if (state !== undefined) userData.state = state;
    if (city !== undefined) userData.city = city;
    if (avatarUrl !== undefined) userData.avatarUrl = avatarUrl;

    if (Object.keys(userData).length > 0) {
      await prisma.user.update({
        where: { id: authUser.id },
        data: userData,
      });
    }

    await prisma.profile.upsert({
      where: { userId: authUser.id },
      update: {
        ...profileData,
        targetRole: (profileData as any).targetRole || (profileData as any).careerGoal,
      },
      create: {
        userId: authUser.id,
        ...profileData,
        targetRole: (profileData as any).targetRole || (profileData as any).careerGoal,
      },
    });

    const userContext = await getUserAIContext(authUser.id);
    if (userContext && userContext.hasSkills) {
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

      const roadmap = CareerRoadmapService.generate(
        userContext.skills,
        userContext.profile?.targetRole,
        userContext.profile?.experienceLevel,
        userContext.profile?.careerGoal
      );

      await prisma.careerRoadmap.upsert({
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
    }

    const freshContext = await getUserAIContext(authUser.id);
    return apiSuccess({ user: freshContext });
  } catch (err: any) {
    return apiError(err.message || 'Failed to update profile', 'PROFILE_UPDATE_ERROR', 400);
  }
}
