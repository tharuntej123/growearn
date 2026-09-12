import { z } from 'zod';

export const skillAnalysisSchema = z.object({
  identifiedSkills: z.array(
    z.object({
      skill: z.string(),
      level: z.string(),
      reason: z.string(),
    })
  ),
  strengths: z.array(z.string()),
  skillGaps: z.array(z.string()),
  recommendedSkills: z.array(z.string()),
  currentLevel: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  summary: z.string(),
});

export type SkillAnalysisOutput = z.infer<typeof skillAnalysisSchema>;

export const roadmapPhaseSchema = z.object({
  phaseNumber: z.number(),
  title: z.string(),
  objective: z.string(),
  durationWeeks: z.number(),
  skills: z.array(z.string()),
  topics: z.array(z.string()),
  resources: z.array(z.string()),
  practiceTasks: z.array(z.string()),
  projects: z.array(z.string()),
  milestone: z.string(),
});

export const roadmapSchema = z.object({
  targetRole: z.string(),
  summary: z.string(),
  currentLevel: z.string(),
  estimatedDurationWeeks: z.number(),
  currentSkills: z.array(z.string()),
  skillGaps: z.array(z.string()),
  phases: z.array(roadmapPhaseSchema),
  finalMilestone: z.string(),
});

export type RoadmapOutput = z.infer<typeof roadmapSchema>;
export type RoadmapPhaseOutput = z.infer<typeof roadmapPhaseSchema>;

export const assistantIntentEnum = z.enum([
  'GENERAL_QUESTION',
  'CAREER_ADVICE',
  'SKILL_ANALYSIS',
  'ROADMAP',
  'JOB_SEARCH',
  'COURSE_RECOMMENDATION',
  'MENTOR_RECOMMENDATION',
  'RESUME_HELP',
  'PROPOSAL_HELP',
  'COMMUNICATION_HELP',
  'PROFILE_HELP',
]);

export type AssistantIntent = z.infer<typeof assistantIntentEnum>;

export const assistantResponseSchema = z.object({
  intent: assistantIntentEnum,
  directAnswer: z.string(),
  recommendedActions: z.array(z.string()).default([]),
  structuredData: z.record(z.any()).optional(),
});

export type AssistantResponseOutput = z.infer<typeof assistantResponseSchema>;
