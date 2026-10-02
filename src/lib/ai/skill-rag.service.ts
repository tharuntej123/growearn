/**
 * @file skill-rag.service.ts
 * @description Real RAG and multi-signal ranking service for skills, roadmaps, courses, and mentors.
 * 
 * Pipeline:
 * 1. Normalize Skill Query
 * 2. Retrieve Database-Backed Roadmap from PostgreSQL
 * 3. Retrieve Candidate Courses & Mentors from Database
 * 4. Apply Real pgvector Cosine Retrieval (if embeddings enabled) or Transparent Keyword/Skill Overlap Ranking
 * 5. Apply Business Level & Quality Filters
 * 6. Exclude already displayed IDs (Pagination / No duplicates)
 * 7. Return Top N Structured Results
 */

import { prisma } from '@/lib/prisma';
import { RoadmapRepository } from '@/repositories/roadmap.repository';
import { generateEmbedding, isEmbeddingConfigured } from './embeddings';
import { PgVectorStore } from './vector-store';

export interface RAGCourseResult {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  level: string;
  price: number;
  durationHours: number;
  thumbnail: string | null;
  skillsCovered: string[];
  rating: number;
  reviewsCount: number;
  instructor: {
    id: string;
    name: string;
    avatarUrl?: string | null;
    headline?: string | null;
  };
  matchScore: number;
  matchReason: string;
}

export interface RAGMentorResult {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string | null;
  headline?: string | null;
  location?: string | null;
  bio: string;
  expertise: string[];
  hourlyRate: number;
  rating: number;
  studentsCount: number;
  sessionCount: number;
  yearsExperience: number;
  matchScore: number;
  matchReason: string;
}

export interface RAGRoadmapStep {
  orderIndex: number;
  phaseNumber: number;
  title: string;
  description: string;
  difficulty: string;
  estimatedHours: number;
  skills: string[];
  recommendedCourses: string[];
}

export interface RAGRoadmapResult {
  id: string;
  slug: string;
  title: string;
  category: string;
  targetRole: string;
  summary: string;
  currentLevel: string;
  estimatedDurationWeeks: number;
  phases: any[];
  items: RAGRoadmapStep[];
  finalMilestone: string;
}

export interface RAGSkillSearchResult {
  skill: string;
  roadmap: RAGRoadmapResult;
  topCourses: RAGCourseResult[];
  topMentors: RAGMentorResult[];
  ragMetrics: {
    totalIndexedCourses: number;
    totalIndexedMentors: number;
    retrievedCoursesCount: number;
    retrievedMentorsCount: number;
    vectorSearchApplied: boolean;
    searchMode: 'SEMANTIC_RAG' | 'KEYWORD_FALLBACK';
    rankingMethod: string;
  };
}

export class SkillRAGService {
  /**
   * Search for top courses matching a skill with pagination and duplicate exclusion.
   */
  static async searchCourses(params: {
    skill: string;
    level?: string;
    offset?: number;
    limit?: number;
    excludeIds?: string[];
  }): Promise<{ courses: RAGCourseResult[]; total: number }> {
    const q = params.skill.trim().toLowerCase();
    const qWords = q.split(/\s+/).filter(Boolean);
    const limit = params.limit || 5;
    const offset = params.offset || 0;
    const excludeSet = new Set(params.excludeIds || []);

    const allCourses = await prisma.course.findMany({
      where: { isPublished: true },
      include: {
        instructor: {
          select: { id: true, name: true, avatarUrl: true, headline: true },
        },
      },
    });

    const vectorSimilarities: Record<string, number> = {};
    let vectorUsed = false;

    if (isEmbeddingConfigured()) {
      try {
        const queryVector = await generateEmbedding(params.skill);
        const vectorMatches = await PgVectorStore.similaritySearch(queryVector, 20, 'course');
        vectorMatches.forEach((m) => {
          const courseId = m.metadata?.courseId || m.source;
          if (courseId && m.similarity !== undefined) {
            vectorSimilarities[courseId] = m.similarity;
          }
        });
        vectorUsed = true;
      } catch {
        // Fall back gracefully to keyword/skill scoring
      }
    }

    const scored = allCourses
      .filter((c) => !excludeSet.has(c.id))
      .map((c) => {
        const skills = c.skillsCovered ? c.skillsCovered.split(',').map((s) => s.trim()) : [];
        const titleLower = c.title.toLowerCase();
        const descLower = c.description.toLowerCase();

        let overlapCount = 0;
        skills.forEach((s) => {
          if (q.includes(s.toLowerCase()) || s.toLowerCase().includes(q)) {
            overlapCount++;
          }
        });

        const isTitleMatch = titleLower.includes(q) || qWords.some((w) => titleLower.includes(w));
        const isDescMatch = descLower.includes(q);

        // Skill overlap score [0 - 100]
        let skillOverlapScore = 30;
        if (isTitleMatch && overlapCount > 0) skillOverlapScore = 95;
        else if (isTitleMatch) skillOverlapScore = 85;
        else if (overlapCount > 0) skillOverlapScore = Math.min(80, 50 + overlapCount * 15);
        else if (isDescMatch) skillOverlapScore = 60;

        // Level match score [0 - 100]
        let levelScore = 70;
        if (params.level) {
          levelScore = (c.level || '').toUpperCase() === params.level.toUpperCase() ? 100 : 60;
        }

        // Quality rating score [0 - 100]
        const ratingScore = Math.min(100, Math.round((c.rating / 5) * 100));

        // Vector score [0 - 100]
        const vectorScore = vectorSimilarities[c.id]
          ? Math.round(vectorSimilarities[c.id] * 100)
          : skillOverlapScore;

        // Multi-signal weighted ranking:
        // Vector/Semantic: 35%, Skill Overlap: 35%, Quality: 15%, Level: 15%
        const totalScore = Math.round(
          vectorScore * 0.35 + skillOverlapScore * 0.35 + ratingScore * 0.15 + levelScore * 0.15
        );

        return {
          id: c.id,
          title: c.title,
          slug: c.slug,
          description: c.description,
          category: c.category,
          level: c.level,
          price: c.price,
          durationHours: c.durationHours,
          thumbnail: c.thumbnail,
          skillsCovered: skills,
          rating: c.rating,
          reviewsCount: c.reviewsCount,
          instructor: {
            id: c.instructor.id,
            name: c.instructor.name,
            avatarUrl: c.instructor.avatarUrl,
            headline: c.instructor.headline,
          },
          matchScore: totalScore,
          matchReason: `[${c.level}] Structured course covering ${skills.slice(0, 3).join(', ')} (${c.rating}⭐)`,
        };
      });

    scored.sort((a, b) => b.matchScore - a.matchScore || b.rating - a.rating);

    return {
      courses: scored.slice(offset, offset + limit),
      total: scored.length,
    };
  }

  /**
   * Search for top mentors matching a skill with pagination and duplicate exclusion.
   */
  static async searchMentors(params: {
    skill: string;
    offset?: number;
    limit?: number;
    excludeIds?: string[];
  }): Promise<{ mentors: RAGMentorResult[]; total: number }> {
    const q = params.skill.trim().toLowerCase();
    const qWords = q.split(/\s+/).filter(Boolean);
    const limit = params.limit || 5;
    const offset = params.offset || 0;
    const excludeSet = new Set(params.excludeIds || []);

    const allMentors = await prisma.mentorProfile.findMany({
      where: { isAvailable: true },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, headline: true, location: true },
        },
      },
    });

    const vectorSimilarities: Record<string, number> = {};

    if (isEmbeddingConfigured()) {
      try {
        const queryVector = await generateEmbedding(params.skill);
        const vectorMatches = await PgVectorStore.similaritySearch(queryVector, 20, 'mentor');
        vectorMatches.forEach((m) => {
          const mentorId = m.metadata?.mentorId || m.source;
          if (mentorId && m.similarity !== undefined) {
            vectorSimilarities[mentorId] = m.similarity;
          }
        });
      } catch {
        // Fall back gracefully
      }
    }

    const scored = allMentors
      .filter((m) => !excludeSet.has(m.id))
      .map((m) => {
        const expertiseList = m.expertise ? m.expertise.split(',').map((s) => s.trim()) : [];
        const bioLower = m.bio.toLowerCase();
        const titleLower = (m.title || '').toLowerCase();
        const headlineLower = (m.user.headline || '').toLowerCase();

        let overlapCount = 0;
        expertiseList.forEach((s) => {
          if (q.includes(s.toLowerCase()) || s.toLowerCase().includes(q)) {
            overlapCount++;
          }
        });

        const isTitleMatch =
          titleLower.includes(q) ||
          headlineLower.includes(q) ||
          qWords.some((w) => titleLower.includes(w) || headlineLower.includes(w));
        const isBioMatch = bioLower.includes(q);

        let skillOverlapScore = 35;
        if (isTitleMatch && overlapCount > 0) skillOverlapScore = 95;
        else if (overlapCount > 0) skillOverlapScore = Math.min(90, 60 + overlapCount * 12);
        else if (isTitleMatch || isBioMatch) skillOverlapScore = 75;

        // Experience score [0 - 100]
        const expScore = Math.min(100, Math.round((m.yearsExperience / 10) * 100));

        // Rating score [0 - 100]
        const ratingScore = Math.min(100, Math.round((m.rating / 5) * 100));

        // Vector score [0 - 100]
        const vectorScore = vectorSimilarities[m.id]
          ? Math.round(vectorSimilarities[m.id] * 100)
          : skillOverlapScore;

        const totalScore = Math.round(
          vectorScore * 0.35 + skillOverlapScore * 0.35 + expScore * 0.15 + ratingScore * 0.15
        );

        return {
          id: m.id,
          userId: m.user.id,
          name: m.user.name,
          avatarUrl: m.user.avatarUrl,
          headline: m.user.headline || m.title,
          location: m.user.location,
          bio: m.bio,
          expertise: expertiseList,
          hourlyRate: m.hourlyRate,
          rating: m.rating,
          studentsCount: m.studentsCount,
          sessionCount: m.sessionCount,
          yearsExperience: m.yearsExperience,
          matchScore: totalScore,
          matchReason: `Expert in ${expertiseList.slice(0, 3).join(', ')} with ${m.yearsExperience}+ yrs experience (${m.rating}⭐)`,
        };
      });

    scored.sort((a, b) => b.matchScore - a.matchScore || b.rating - a.rating);

    return {
      mentors: scored.slice(offset, offset + limit),
      total: scored.length,
    };
  }

  /**
   * Main Skill RAG entrypoint: Returns database roadmap + top 5 courses + top 5 mentors.
   */
  static async querySkillRAG(
    skillQuery: string,
    userLevel = 'Intermediate'
  ): Promise<RAGSkillSearchResult> {
    const q = skillQuery.trim();

    // 1. Fetch database-backed roadmap
    const dbRoadmap = await RoadmapRepository.findRoadmapBySkill(q);

    // 2. Fetch Top 5 Courses & Top 5 Mentors with real multi-signal ranking
    const [coursesResult, mentorsResult] = await Promise.all([
      this.searchCourses({ skill: q, level: userLevel, limit: 5, offset: 0 }),
      this.searchMentors({ skill: q, limit: 5, offset: 0 }),
    ]);

    const totalCourses = await prisma.course.count({ where: { isPublished: true } });
    const totalMentors = await prisma.mentorProfile.count({ where: { isAvailable: true } });

    const phases = dbRoadmap.phasesJson ? JSON.parse(dbRoadmap.phasesJson) : [];

    return {
      skill: q,
      roadmap: {
        id: dbRoadmap.id,
        slug: dbRoadmap.slug || 'roadmap',
        title: dbRoadmap.title,
        category: dbRoadmap.category,
        targetRole: dbRoadmap.targetRole,
        summary: dbRoadmap.summary || '',
        currentLevel: userLevel,
        estimatedDurationWeeks: dbRoadmap.estimatedDurationWeeks,
        phases,
        items: dbRoadmap.items.map((it) => ({
          orderIndex: it.orderIndex,
          phaseNumber: it.phaseNumber,
          title: it.title,
          description: it.description,
          difficulty: it.difficulty,
          estimatedHours: it.estimatedHours,
          skills: it.skills ? it.skills.split(',').map((s) => s.trim()) : [],
          recommendedCourses: it.recommendedCourses ? it.recommendedCourses.split(',').map((s) => s.trim()) : [],
        })),
        finalMilestone: dbRoadmap.finalMilestone || 'Certified Developer',
      },
      topCourses: coursesResult.courses,
      topMentors: mentorsResult.mentors,
      ragMetrics: {
        totalIndexedCourses: totalCourses,
        totalIndexedMentors: totalMentors,
        retrievedCoursesCount: coursesResult.courses.length,
        retrievedMentorsCount: mentorsResult.mentors.length,
        vectorSearchApplied: isEmbeddingConfigured(),
        searchMode: isEmbeddingConfigured() ? 'SEMANTIC_RAG' : 'KEYWORD_FALLBACK',
        rankingMethod: isEmbeddingConfigured()
          ? 'Hybrid Cosine Vector Similarity + Skill Overlap + Quality Weighting'
          : 'Multi-Signal Domain & Skill Overlap + Quality Weighting',
      },
    };
  }
}
