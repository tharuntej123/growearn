import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { SkillAnalysisService } from '@/lib/ai/skill-analysis.service';
import { CareerRoadmapService } from '@/lib/ai/roadmap.service';
import { getUserAIContext } from '@/services/user-context.service';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return apiError('Authentication required', 'UNAUTHORIZED', 401);
    }

    const body = await req.json();
    const {
      skills = [],
      careerGoal,
      targetRole,
      experienceLevel = 'Beginner',
      yearsOfExperience = 0,
      preferredWorkType = 'REMOTE',
      preferredLocation,
      interests = [],
    } = body;

    // Normalize and clean skills
    const rawSkills: string[] = Array.isArray(skills) ? skills : [];
    const cleanSkills = Array.from(new Set(rawSkills.map((s) => s.trim()))).filter(Boolean);

    // 1. Upsert skills in canonical Skill table and UserSkill
    if (cleanSkills.length > 0) {
      // Remove any previously recorded user skills to replace with fresh onboarding list
      await prisma.userSkill.deleteMany({
        where: { userId: authUser.id },
      });

      for (const skillName of cleanSkills) {
        // Find existing canonical skill or create
        const canonical = await prisma.skill.upsert({
          where: { name: skillName },
          update: {},
          create: {
            name: skillName,
            category: 'Engineering',
          },
        });

        await prisma.userSkill.create({
          data: {
            userId: authUser.id,
            skillId: canonical.id,
            proficiencyLevel: experienceLevel === 'Advanced' || experienceLevel === 'Professional' ? 'ADVANCED' : 'INTERMEDIATE',
            isVerified: true,
          },
        });
      }
    }

    // 2. Update user and profile
    if (preferredLocation) {
      await prisma.user.update({
        where: { id: authUser.id },
        data: { location: preferredLocation },
      });
    }

    await prisma.profile.upsert({
      where: { userId: authUser.id },
      update: {
        careerGoal: careerGoal || 'Software Engineer',
        targetRole: targetRole || 'Full Stack Developer',
        experienceLevel,
        yearsOfExperience: Number(yearsOfExperience) || 0,
        preferredJobType: preferredWorkType,
        preferredLocation: preferredLocation || null,
        interests: JSON.stringify(interests),
        isOnboarded: true,
      },
      create: {
        userId: authUser.id,
        careerGoal: careerGoal || 'Software Engineer',
        targetRole: targetRole || 'Full Stack Developer',
        experienceLevel,
        yearsOfExperience: Number(yearsOfExperience) || 0,
        preferredJobType: preferredWorkType,
        preferredLocation: preferredLocation || null,
        interests: JSON.stringify(interests),
        isOnboarded: true,
      },
    });

    // 3. Trigger Grounded AI Skill Analysis
    const skillAnalysis = SkillAnalysisService.analyze(cleanSkills, targetRole, experienceLevel);

    await prisma.aIProfile.upsert({
      where: { userId: authUser.id },
      update: {
        careerGoal: careerGoal || 'Software Engineer',
        currentLevel: skillAnalysis.currentLevel,
        skillSummary: skillAnalysis.summary,
        strengthsJson: JSON.stringify(skillAnalysis.strengths),
        gapAnalysisJson: JSON.stringify(skillAnalysis.skillGaps),
        suggestedRolesJson: JSON.stringify(skillAnalysis.recommendedSkills),
      },
      create: {
        userId: authUser.id,
        careerGoal: careerGoal || 'Software Engineer',
        currentLevel: skillAnalysis.currentLevel,
        skillSummary: skillAnalysis.summary,
        strengthsJson: JSON.stringify(skillAnalysis.strengths),
        gapAnalysisJson: JSON.stringify(skillAnalysis.skillGaps),
        suggestedRolesJson: JSON.stringify(skillAnalysis.recommendedSkills),
      },
    });

    // 4. Generate & Save Structured Career Roadmap
    const roadmap = CareerRoadmapService.generate(cleanSkills, targetRole, experienceLevel, careerGoal);

    // Delete old roadmap items
    const existingRoadmap = await prisma.careerRoadmap.findUnique({
      where: { userId: authUser.id },
    });
    if (existingRoadmap) {
      await prisma.roadmapItem.deleteMany({
        where: { roadmapId: existingRoadmap.id },
      });
    }

    const savedRoadmap = await prisma.careerRoadmap.upsert({
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

    // Create relational roadmap items for phases
    for (let i = 0; i < roadmap.phases.length; i++) {
      const p = roadmap.phases[i];
      await prisma.roadmapItem.create({
        data: {
          roadmapId: savedRoadmap.id,
          orderIndex: p.phaseNumber,
          title: p.title,
          description: p.objective,
          milestoneType: 'SKILL',
          relatedSkill: p.skills[0] || null,
        },
      });
    }

    // 5. Fetch fresh user AI context
    const userContext = await getUserAIContext(authUser.id);

    return apiSuccess({
      message: 'Personalization profile generated successfully',
      userContext,
      skillAnalysis,
      roadmap,
    });
  } catch (error: any) {
    console.error('Onboarding error:', error);
    return apiError(
      error.message || 'Failed to complete onboarding',
      'INTERNAL_ERROR',
      500
    );
  }
}
