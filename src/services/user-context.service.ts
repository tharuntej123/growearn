import { prisma } from '@/lib/prisma';

export interface UserAIContext {
  id: string;
  name: string;
  email: string;
  role: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  profile: {
    title: string | null;
    careerGoal: string | null;
    targetRole: string | null;
    interests: string[];
    experienceLevel: string;
    yearsOfExperience: number;
    hourlyRate: number | null;
    preferredLocation: string | null;
    preferredJobType: string | null;
    availability: string;
    aiScore: number;
    resumeText: string | null;
    isOnboarded: boolean;
  } | null;
  skills: string[];
  skillLevels: Record<string, string>;
  hasSkills: boolean;
  hasCareerGoal: boolean;
  hasTargetRole: boolean;
  hasExperience: boolean;
  hasEducation: boolean;
  hasLocation: boolean;
  hasBio: boolean;
  hasResume: boolean;
  isOnboarded: boolean;
  isNewUser: boolean;
  completionPercentage: number;
  missingProfileItems: string[];
  completedCourses: { id: string; title: string; category: string }[];
  enrolledCourses: { id: string; title: string; progressPercent: number; isCompleted: boolean }[];
  applications: { id: string; jobTitle: string; status: string; appliedAt: Date }[];
  careerRoadmap: {
    id: string;
    targetRole: string;
    currentLevel: string;
    summary: string | null;
    estimatedDurationWeeks: number;
    currentSkills: string[];
    skillGaps: string[];
    finalMilestone: string | null;
    phases: any[];
  } | null;
}

/**
 * Retrieve authenticated user's unified AI & profile context.
 * Single source of truth across AI, Roadmaps, Dashboards, and Recommendation services.
 * 
 * CRITICAL RULE: NEVER invent or assume user skills or goals if they do not exist.
 */
export async function getUserAIContext(userId: string): Promise<UserAIContext | null> {
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      skills: {
        include: { skill: true },
        orderBy: { createdAt: 'asc' },
      },
      experiences: {
        orderBy: { startDate: 'desc' },
      },
      educations: {
        orderBy: { startDate: 'desc' },
      },
      enrollments: {
        include: { course: true },
        orderBy: { enrolledAt: 'desc' },
      },
      applications: {
        include: { job: true },
        orderBy: { appliedAt: 'desc' },
      },
      careerRoadmap: {
        include: { items: { orderBy: { orderIndex: 'asc' } } },
      },
    },
  });

  if (!user) return null;

  // Extract user's actual skills only
  const userSkills = user.skills.map((us) => us.skill.name.trim()).filter(Boolean);
  const skillLevels: Record<string, string> = {};
  user.skills.forEach((us) => {
    skillLevels[us.skill.name.trim()] = us.proficiencyLevel;
  });

  // Calculate completeness flags
  const hasSkills = userSkills.length > 0;
  const hasCareerGoal = Boolean(user.profile?.careerGoal?.trim());
  const hasTargetRole = Boolean(user.profile?.targetRole?.trim());
  const hasExperience = user.experiences.length > 0 || (user.profile?.yearsOfExperience ?? 0) > 0;
  const hasEducation = user.educations.length > 0;
  const hasLocation = Boolean(user.location || user.profile?.preferredLocation);
  const hasBio = Boolean(user.bio?.trim());
  const hasResume = Boolean(user.profile?.resumeText?.trim() || user.profile?.resumeUrl);
  const isOnboarded = Boolean(user.profile?.isOnboarded && hasSkills);
  const isNewUser = !isOnboarded || !hasSkills;

  // Compute profile completion percentage
  let score = 15; // Base account creation
  const missingItems: string[] = [];

  if (hasSkills) score += 20;
  else missingItems.push('Add Skills');

  if (hasCareerGoal) score += 15;
  else missingItems.push('Set Career Goal');

  if (hasTargetRole) score += 15;
  else missingItems.push('Set Target Role');

  if (hasExperience) score += 10;
  else missingItems.push('Add Experience');

  if (hasEducation) score += 10;
  else missingItems.push('Add Education');

  if (hasLocation) score += 10;
  else missingItems.push('Set Location');

  if (hasBio) score += 5;
  else missingItems.push('Write Bio');

  const completionPercentage = Math.min(100, score);

  // Parse roadmap phases if present
  let roadmapData = null;
  if (user.careerRoadmap) {
    let phases: any[] = [];
    let currentSkills: string[] = [];
    let skillGaps: string[] = [];

    try {
      if (user.careerRoadmap.phasesJson) {
        phases = JSON.parse(user.careerRoadmap.phasesJson);
      }
      if (user.careerRoadmap.currentSkillsJson) {
        currentSkills = JSON.parse(user.careerRoadmap.currentSkillsJson);
      }
      if (user.careerRoadmap.skillGapsJson) {
        skillGaps = JSON.parse(user.careerRoadmap.skillGapsJson);
      }
    } catch {
      phases = [];
    }

    roadmapData = {
      id: user.careerRoadmap.id,
      targetRole: user.careerRoadmap.targetRole,
      currentLevel: user.careerRoadmap.currentLevel,
      summary: user.careerRoadmap.summary,
      estimatedDurationWeeks: user.careerRoadmap.estimatedDurationWeeks || 12,
      currentSkills,
      skillGaps,
      finalMilestone: user.careerRoadmap.finalMilestone,
      phases,
    };
  }

  // Parse interests
  let interests: string[] = [];
  if (user.profile?.interests) {
    try {
      interests = JSON.parse(user.profile.interests);
    } catch {
      interests = user.profile.interests.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    headline: user.headline,
    bio: user.bio,
    location: user.location,
    profile: user.profile
      ? {
          title: user.profile.title,
          careerGoal: user.profile.careerGoal,
          targetRole: user.profile.targetRole,
          interests,
          experienceLevel: user.profile.experienceLevel || 'Beginner',
          yearsOfExperience: user.profile.yearsOfExperience || 0,
          hourlyRate: user.profile.hourlyRate,
          preferredLocation: user.profile.preferredLocation,
          preferredJobType: user.profile.preferredJobType,
          availability: user.profile.availability,
          aiScore: user.profile.aiScore,
          resumeText: user.profile.resumeText,
          isOnboarded: user.profile.isOnboarded,
        }
      : null,
    skills: userSkills,
    skillLevels,
    hasSkills,
    hasCareerGoal,
    hasTargetRole,
    hasExperience,
    hasEducation,
    hasLocation,
    hasBio,
    hasResume,
    isOnboarded,
    isNewUser,
    completionPercentage,
    missingProfileItems: missingItems,
    completedCourses: user.enrollments
      .filter((e) => e.isCompleted)
      .map((e) => ({ id: e.course.id, title: e.course.title, category: e.course.category })),
    enrolledCourses: user.enrollments.map((e) => ({
      id: e.course.id,
      title: e.course.title,
      progressPercent: e.progressPercent,
      isCompleted: e.isCompleted,
    })),
    applications: user.applications.map((a) => ({
      id: a.id,
      jobTitle: a.job.title,
      status: a.status,
      appliedAt: a.appliedAt,
    })),
    careerRoadmap: roadmapData,
  };
}
