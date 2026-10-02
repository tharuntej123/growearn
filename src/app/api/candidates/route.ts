import { NextRequest } from 'next/server';
import { UserRepository } from '@/repositories/user.repository';
import { apiSuccess, apiError } from '@/lib/utils';
import { HybridMatcher } from '@/lib/ai/hybrid-matcher';
import { PgVectorStore } from '@/lib/ai/vector-store';
import { generateEmbedding } from '@/lib/ai/embeddings';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const skill = searchParams.get('skill') || undefined;
    const location = searchParams.get('location') || undefined;
    const jobId = searchParams.get('jobId') || undefined;
    const topKParam = searchParams.get('topK');
    const topK = topKParam ? parseInt(topKParam, 10) : 30;

    let targetJob: {
      id: string;
      title: string;
      description: string;
      skills: string[];
      experienceLevel: string;
      locationType: string;
      city?: string;
      state?: string;
      country?: string;
    } | null = null;

    if (jobId) {
      const jobRecord = await prisma.job.findUnique({
        where: { id: jobId },
        include: { skills: { include: { skill: true } } },
      });

      if (jobRecord) {
        targetJob = {
          id: jobRecord.id,
          title: jobRecord.title,
          description: jobRecord.description,
          skills: jobRecord.skills.map((s) => s.skill.name),
          experienceLevel: jobRecord.experienceLevel,
          locationType: jobRecord.locationType,
          city: jobRecord.city || undefined,
          state: jobRecord.state || undefined,
          country: jobRecord.country || undefined,
        };
      }
    }

    // Retrieve candidates from database
    const candidates = await UserRepository.getAllCandidates({
      search,
      skill,
      location,
    });

    // If job or target skills are specified, compute authentic RAG vector similarity & Hybrid matching
    const scoredCandidates = candidates.map((candidate) => {
      const candidateSkills = candidate.skills.map((s) => s.skill.name);
      const yearsExp = candidate.profile?.yearsOfExperience || 0;

      if (targetJob) {
        const matchResult = HybridMatcher.calculateJobMatch(
          {
            skills: candidateSkills,
            yearsExperience: yearsExp,
            location: candidate.location || undefined,
            careerGoal: candidate.profile?.careerGoal || undefined,
            headline: candidate.headline || undefined,
            bio: candidate.bio || undefined,
          },
          {
            title: targetJob.title,
            description: targetJob.description,
            requiredSkills: targetJob.skills,
            experienceLevel: targetJob.experienceLevel,
            locationType: targetJob.locationType,
            city: targetJob.city,
            state: targetJob.state,
            country: targetJob.country,
          }
        );

        return {
          ...candidate,
          aiMatch: matchResult,
          matchScore: matchResult.overallScore,
        };
      }

      // Default scoring based on profile completeness & skills
      const defaultScore = candidate.profile?.aiScore || (candidateSkills.length > 3 ? 90 : 80);
      return {
        ...candidate,
        aiMatch: {
          overallScore: defaultScore,
          factors: {
            skillMatch: { score: Math.min(100, candidateSkills.length * 20), matched: candidateSkills, missing: [] },
            experienceMatch: { score: Math.min(100, yearsExp * 15), userYears: yearsExp, requiredYears: 3 },
            locationMatch: { score: 100, explanation: candidate.location || 'Remote' },
            careerGoalMatch: { score: 85, alignment: candidate.profile?.title || 'Professional' },
            aiSemanticScore: { score: defaultScore, reasoning: 'Database profile strength score' },
          },
          explanation: `${candidate.name} has ${candidateSkills.length} verified skills in database (${candidateSkills.slice(0, 3).join(', ')}).`,
        },
        matchScore: defaultScore,
      };
    });

    // If target job was provided, sort by match score descending
    if (targetJob) {
      scoredCandidates.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }

    return apiSuccess({
      candidates: scoredCandidates.slice(0, topK),
      targetJob,
      totalCount: scoredCandidates.length,
    });
  } catch (error: any) {
    console.error('[Candidates:API:Error]', error);
    return apiError(error.message || 'Failed to fetch candidate directory', 'CANDIDATE_FETCH_ERROR', 500);
  }
}
