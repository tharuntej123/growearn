import { prisma } from '@/lib/prisma';
import { UserAIContext } from './user-context.service';
import { SkillAnalysisService } from '@/lib/ai/skill-analysis.service';

export interface ScoredJob {
  id: string;
  title: string;
  description: string;
  country: string;
  state: string | null;
  city: string | null;
  locationType: string;
  jobType: string;
  minSalary: number;
  maxSalary: number;
  currency: string;
  experienceLevel: string;
  isLocal: boolean;
  createdAt: Date;
  company: {
    name: string;
    avatarUrl?: string | null;
  };
  skills: { skill: { name: string } }[];
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  whyMatches: string;
  isPersonalized: boolean;
}

export class RecommendationService {
  static async getJobs(
    userContext: UserAIContext | null,
    limit = 10,
    filters?: { city?: string; locationType?: string; jobType?: string; query?: string; isLocal?: boolean }
  ): Promise<{ jobs: ScoredJob[]; isPersonalized: boolean; emptyReason?: string }> {
    const where: any = { status: 'OPEN' };

    if (filters?.isLocal !== undefined) {
      where.isLocal = filters.isLocal;
    }
    if (filters?.locationType && filters.locationType !== 'ALL') {
      where.locationType = filters.locationType;
    }
    if (filters?.jobType && filters.jobType !== 'ALL') {
      where.jobType = filters.jobType;
    }
    if (filters?.city) {
      where.city = { contains: filters.city };
    }
    if (filters?.query) {
      where.OR = [
        { title: { contains: filters.query } },
        { description: { contains: filters.query } },
      ];
    }

    const allJobs = await prisma.job.findMany({
      where,
      include: {
        company: { select: { name: true, avatarUrl: true } },
        skills: { include: { skill: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (!userContext || !userContext.hasSkills) {
      const generalJobs: ScoredJob[] = allJobs.slice(0, limit).map((j) => ({
        id: j.id,
        title: j.title,
        description: j.description,
        country: j.country,
        state: j.state,
        city: j.city,
        locationType: j.locationType,
        jobType: j.jobType,
        minSalary: j.minSalary,
        maxSalary: j.maxSalary,
        currency: j.currency,
        experienceLevel: j.experienceLevel,
        isLocal: j.isLocal,
        createdAt: j.createdAt,
        company: j.company,
        skills: j.skills,
        matchScore: 0,
        matchedSkills: [],
        missingSkills: j.skills.map((s) => s.skill.name),
        whyMatches: 'General marketplace listing. Add your skills to calculate personalized match scores.',
        isPersonalized: false,
      }));

      return {
        jobs: generalJobs,
        isPersonalized: false,
        emptyReason: 'Add your skills to receive personalized job recommendations.',
      };
    }

    const userSkillsLower = userContext.skills.map((s) => s.toLowerCase());
    const targetRoleLower = (userContext.profile?.targetRole || userContext.profile?.careerGoal || '').toLowerCase();
    const userLocationLower = (userContext.location || userContext.profile?.preferredLocation || '').toLowerCase();
    const preferredJobType = userContext.profile?.preferredJobType || 'ANY';

    const scoredJobs: ScoredJob[] = allJobs.map((job) => {
      const requiredSkills = job.skills.map((s) => s.skill.name);
      const matched: string[] = [];
      const missing: string[] = [];

      requiredSkills.forEach((rs) => {
        const rsLower = rs.toLowerCase();
        if (userSkillsLower.some((us) => us.includes(rsLower) || rsLower.includes(us))) {
          matched.push(rs);
        } else {
          missing.push(rs);
        }
      });

      const skillScore = requiredSkills.length > 0 ? (matched.length / requiredSkills.length) * 100 : 70;

      let roleScore = 40;
      const jobTitleLower = job.title.toLowerCase();
      if (targetRoleLower && (jobTitleLower.includes(targetRoleLower) || targetRoleLower.includes(jobTitleLower))) {
        roleScore = 100;
      } else if (
        (targetRoleLower.includes('backend') && (jobTitleLower.includes('backend') || jobTitleLower.includes('java') || jobTitleLower.includes('api'))) ||
        (targetRoleLower.includes('frontend') && (jobTitleLower.includes('frontend') || jobTitleLower.includes('react') || jobTitleLower.includes('ui'))) ||
        (targetRoleLower.includes('ai') && (jobTitleLower.includes('ai') || jobTitleLower.includes('ml') || jobTitleLower.includes('data')))
      ) {
        roleScore = 85;
      }

      let expScore = 70;
      const userExp = userContext.profile?.experienceLevel || 'Beginner';
      if (job.experienceLevel === 'ENTRY' && (userExp === 'Beginner' || userExp === 'Intermediate')) expScore = 100;
      else if (job.experienceLevel === 'MID' && (userExp === 'Intermediate' || userExp === 'Advanced')) expScore = 100;
      else if (job.experienceLevel === 'SENIOR' && (userExp === 'Advanced' || userExp === 'Professional')) expScore = 100;

      let locScore = 50;
      if (job.locationType === 'REMOTE') {
        locScore = 100;
      } else if (job.city && userLocationLower.includes(job.city.toLowerCase())) {
        locScore = 100;
      }

      let typeScore = 70;
      if (preferredJobType === 'ANY' || preferredJobType === job.locationType || preferredJobType === job.jobType) {
        typeScore = 100;
      }

      const totalScore = Math.round(
        skillScore * 0.4 + roleScore * 0.25 + expScore * 0.15 + locScore * 0.1 + typeScore * 0.1
      );

      let whyMatches = '';
      if (matched.length > 0) {
        whyMatches = `Strong match with your ${matched.slice(0, 2).join(', ')} skills${missing.length > 0 ? ` (Missing: ${missing[0]})` : ''}.`;
      } else {
        whyMatches = `Aligned with your ${userContext.profile?.targetRole || 'engineering'} trajectory.`;
      }

      return {
        id: job.id,
        title: job.title,
        description: job.description,
        country: job.country,
        state: job.state,
        city: job.city,
        locationType: job.locationType,
        jobType: job.jobType,
        minSalary: job.minSalary,
        maxSalary: job.maxSalary,
        currency: job.currency,
        experienceLevel: job.experienceLevel,
        isLocal: job.isLocal,
        createdAt: job.createdAt,
        company: job.company,
        skills: job.skills,
        matchScore: totalScore,
        matchedSkills: matched,
        missingSkills: missing,
        whyMatches,
        isPersonalized: true,
      };
    });

    scoredJobs.sort((a, b) => b.matchScore - a.matchScore);

    return {
      jobs: scoredJobs.slice(0, limit),
      isPersonalized: true,
    };
  }

  static async getCourses(userContext: UserAIContext | null, limit = 6) {
    const allCourses = await prisma.course.findMany({
      where: { isPublished: true },
      include: { instructor: { select: { name: true, avatarUrl: true } } },
      orderBy: { rating: 'desc' },
    });

    if (!userContext || !userContext.hasSkills) {
      return {
        courses: allCourses.slice(0, limit),
        isPersonalized: false,
        label: 'Popular & Foundational Courses',
      };
    }

    const targetRoleLower = (userContext.profile?.targetRole || userContext.profile?.careerGoal || '').toLowerCase();
    const analysis = SkillAnalysisService.analyze(
      userContext.skills,
      userContext.profile?.targetRole,
      userContext.profile?.experienceLevel
    );
    const gapsLower = analysis.skillGaps.map((g) => g.toLowerCase());

    const ranked = allCourses.map((c) => {
      let score = 50;
      const cTitleLower = c.title.toLowerCase();
      const cCatLower = c.category.toLowerCase();
      const cSkillsLower = (c.skillsCovered || '').toLowerCase();

      if (gapsLower.some((g) => cTitleLower.includes(g) || cSkillsLower.includes(g))) {
        score += 40;
      }
      if (targetRoleLower && (cTitleLower.includes(targetRoleLower) || cCatLower.includes(targetRoleLower))) {
        score += 20;
      }

      return { ...c, relevanceScore: score };
    });

    ranked.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      courses: ranked.slice(0, limit),
      isPersonalized: true,
      label: 'Recommended to Close Your Skill Gaps',
    };
  }

  static async getMentors(userContext: UserAIContext | null, limit = 6) {
    const allMentors = await prisma.mentorProfile.findMany({
      where: { isAvailable: true },
      include: {
        user: { select: { name: true, avatarUrl: true, headline: true, location: true } },
      },
      orderBy: { rating: 'desc' },
    });

    if (!userContext || !userContext.hasSkills) {
      return {
        mentors: allMentors.slice(0, limit),
        isPersonalized: false,
        label: 'Top-Rated Industry Mentors',
      };
    }

    const targetRoleLower = (userContext.profile?.targetRole || userContext.profile?.careerGoal || '').toLowerCase();
    const userSkillsLower = userContext.skills.map((s) => s.toLowerCase());

    const ranked = allMentors.map((m) => {
      let score = 50;
      const expLower = m.expertise.toLowerCase();

      if (userSkillsLower.some((s) => expLower.includes(s))) {
        score += 25;
      }
      if (targetRoleLower && expLower.includes(targetRoleLower)) {
        score += 30;
      }

      return { ...m, relevanceScore: score };
    });

    ranked.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      mentors: ranked.slice(0, limit),
      isPersonalized: true,
      label: 'Recommended Mentors for Your Career Path',
    };
  }

  static async getFeed(userContext: UserAIContext | null, tab: 'for_you' | 'following' | 'latest' = 'for_you') {
    const allPosts = await prisma.post.findMany({
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, headline: true, role: true } },
        likes: true,
        comments: {
          include: { author: { select: { id: true, name: true, avatarUrl: true } } },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });

    if (tab === 'latest' || !userContext || !userContext.hasSkills) {
      return {
        posts: allPosts,
        isPersonalized: false,
      };
    }

    const userSkillsLower = userContext.skills.map((s) => s.toLowerCase());
    const targetRoleLower = (userContext.profile?.targetRole || userContext.profile?.careerGoal || '').toLowerCase();

    const scoredPosts = allPosts.map((post) => {
      let score = 20;
      const contentLower = post.content.toLowerCase();

      if (userSkillsLower.some((sk) => contentLower.includes(sk))) {
        score += 40;
      }

      if (targetRoleLower && contentLower.includes(targetRoleLower)) {
        score += 25;
      }

      if (post.postType === 'ACHIEVEMENT' || post.postType === 'PROJECT') {
        score += 15;
      }

      return { ...post, feedScore: score };
    });

    scoredPosts.sort((a, b) => b.feedScore - a.feedScore);

    return {
      posts: scoredPosts,
      isPersonalized: true,
    };
  }
}
