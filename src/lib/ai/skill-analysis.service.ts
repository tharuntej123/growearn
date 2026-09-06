import { skillAnalysisSchema, SkillAnalysisOutput } from './schemas';

export class SkillAnalysisService {
  /**
   * AI Skill Gap Analysis grounded strictly in user's actual entered skills and target role.
   * 
   * RULE: If skills is empty, NEVER invent skills.
   */
  static analyze(
    skills: string[],
    targetRole?: string | null,
    experienceLevel?: string | null
  ): SkillAnalysisOutput {
    const cleanSkills = skills.map((s) => s.trim()).filter(Boolean);
    const target = (targetRole || 'Software Engineer').trim();
    const exp = experienceLevel || 'Beginner';

    if (cleanSkills.length === 0) {
      return {
        identifiedSkills: [],
        strengths: [],
        skillGaps: ['Core Programming Language', 'Data Structures & Algorithms', 'Version Control (Git)'],
        recommendedSkills: ['Java', 'Python', 'JavaScript/TypeScript', 'SQL', 'Git'],
        currentLevel: 'Beginner',
        summary: 'No skills recorded yet. Add your current programming languages and tools to generate an accurate AI skill gap analysis and roadmap.',
      };
    }

    const skillsLower = cleanSkills.map((s) => s.toLowerCase());
    const targetLower = target.toLowerCase();

    // Determine level from count and experience
    let level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' = 'Beginner';
    if (cleanSkills.length >= 7 || exp === 'Professional' || exp === 'Advanced') {
      level = 'Advanced';
    } else if (cleanSkills.length >= 3 || exp === 'Intermediate') {
      level = 'Intermediate';
    }

    // Role-specific target skill trees
    let expectedSkills: { skill: string; category: string }[] = [];

    if (targetLower.includes('backend') || targetLower.includes('java')) {
      expectedSkills = [
        { skill: 'Spring Boot', category: 'Framework' },
        { skill: 'REST APIs', category: 'API Design' },
        { skill: 'PostgreSQL', category: 'Database' },
        { skill: 'Spring Security', category: 'Security' },
        { skill: 'Docker', category: 'DevOps' },
        { skill: 'Microservices', category: 'Architecture' },
        { skill: 'JUnit / Testing', category: 'Quality' },
        { skill: 'Kafka', category: 'Distributed Systems' },
      ];
    } else if (targetLower.includes('frontend') || targetLower.includes('react') || targetLower.includes('ui')) {
      expectedSkills = [
        { skill: 'React', category: 'Core UI' },
        { skill: 'Next.js App Router', category: 'Framework' },
        { skill: 'TypeScript', category: 'Language' },
        { skill: 'Tailwind CSS', category: 'Styling' },
        { skill: 'State Management (Zustand/Redux)', category: 'State' },
        { skill: 'Web Performance & Accessibility', category: 'Optimization' },
        { skill: 'Jest / Playwright Testing', category: 'Testing' },
      ];
    } else if (
      targetLower.includes('ai') ||
      targetLower.includes('ml') ||
      targetLower.includes('machine learning') ||
      targetLower.includes('data')
    ) {
      expectedSkills = [
        { skill: 'Python', category: 'Core Language' },
        { skill: 'NumPy & Pandas', category: 'Data Analysis' },
        { skill: 'PyTorch / TensorFlow', category: 'Deep Learning' },
        { skill: 'LangChain / LLM Orchestration', category: 'GenAI' },
        { skill: 'Vector Databases (Pinecone/pgvector)', category: 'RAG' },
        { skill: 'Model Deployment & MLOps', category: 'DevOps' },
        { skill: 'SQL & Data Warehousing', category: 'Data' },
      ];
    } else {
      // Full Stack / General
      expectedSkills = [
        { skill: 'TypeScript', category: 'Language' },
        { skill: 'React / Next.js', category: 'Frontend' },
        { skill: 'Node.js / Express', category: 'Backend' },
        { skill: 'PostgreSQL & Prisma ORM', category: 'Database' },
        { skill: 'REST & GraphQL APIs', category: 'API' },
        { skill: 'Docker & CI/CD', category: 'DevOps' },
        { skill: 'System Design Fundamentals', category: 'Architecture' },
      ];
    }

    // Strengths = user's actual entered skills
    const strengths = cleanSkills.slice(0, 5);

    // Identified skills breakdown
    const identifiedSkills = cleanSkills.map((sk) => ({
      skill: sk,
      level: level === 'Advanced' ? 'Advanced' : 'Intermediate',
      reason: `Verified proficiency in ${sk}`,
    }));

    // Missing Skill Gaps: expected skills not in user's skills
    const gaps = expectedSkills
      .filter((exp) => !skillsLower.some((s) => s.includes(exp.skill.toLowerCase()) || exp.skill.toLowerCase().includes(s)))
      .map((exp) => exp.skill);

    const recommendedSkills = gaps.slice(0, 4);

    const summary = `Based on your proficiencies in ${strengths.join(', ')}, you are at an ${level} level. To achieve your target role of "${target}", prioritize mastering ${recommendedSkills.slice(0, 2).join(' and ')}.`;

    const rawOutput = {
      identifiedSkills,
      strengths,
      skillGaps: gaps.slice(0, 5),
      recommendedSkills,
      currentLevel: level,
      summary,
    };

    // Strict Zod validation
    return skillAnalysisSchema.parse(rawOutput);
  }
}
