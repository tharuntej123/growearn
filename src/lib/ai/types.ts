export interface SkillGapAnalysisResult {
  currentLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  strengths: string[];
  skillGaps: string[];
  suggestedRoles: string[];
  summary: string;
}

export interface HybridMatchResult {
  overallScore: number; // 0 - 100
  factors: {
    skillMatch: { score: number; weight: number; matched: string[]; missing: string[] };
    experienceMatch: { score: number; weight: number; userYears: number; requiredYears: number };
    locationMatch: { score: number; weight: number; explanation: string };
    careerGoalMatch: { score: number; weight: number; alignment: string };
    aiSemanticScore: { score: number; weight: number; reasoning: string };
  };
  explanation: string;
}

export interface GeneratedProposalResult {
  introduction: string;
  requirementUnderstanding: string;
  relevantSkillsHighlight: string;
  proposedArchitecture: string;
  milestones: { title: string; days: number; percentage: number }[];
  timeline: string;
  closing: string;
}

export interface ImprovedMessageResult {
  original: string;
  improved: string;
  tone: 'professional' | 'friendly' | 'concise' | 'persuasive' | 'grammar_fix';
  explanation: string;
}

export interface CareerRoadmapNode {
  step: number;
  title: string;
  description: string;
  milestoneType: 'SKILL' | 'COURSE' | 'MENTOR' | 'PROJECT' | 'JOB';
  relatedSkill?: string;
  suggestedCourseTitle?: string;
  suggestedMentorSkill?: string;
  suggestedProjectIdea?: string;
}

export interface CareerRoadmapResult {
  targetRole: string;
  currentLevel: string;
  estimatedMonths: number;
  summary: string;
  nodes: CareerRoadmapNode[];
}
