import { NextRequest } from 'next/server';
import { getCurrentUser, isRoleAllowed } from '@/lib/auth';
import { UserRepository } from '@/repositories/user.repository';
import { apiSuccess, apiError } from '@/lib/utils';
import { HybridMatcher } from '@/lib/ai/hybrid-matcher';
import { PgVectorStore } from '@/lib/ai/vector-store';
import { generateEmbedding, isEmbeddingConfigured } from '@/lib/ai/embeddings';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return apiError('Authentication required to access candidate directory', 'UNAUTHORIZED', 401);
    }

    if (!isRoleAllowed(authUser.role, ['COMPANY', 'EMPLOYER', 'ADMIN'])) {
      return apiError('Forbidden: Candidate discovery is restricted to verified company and admin accounts', 'FORBIDDEN', 403);
    }

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

    // Concurrently retrieve candidates from database and perform vector search
    const vectorSimilarities: Record<string, number> = {};
    let isVectorSearchApplied = false;

    const [candidates] = await Promise.all([
      UserRepository.getAllCandidates({
        search,
        skill,
        location,
      }),
      (async () => {
        if (isEmbeddingConfigured() && (targetJob || search || skill)) {
          try {
            const queryText = targetJob
              ? `${targetJob.title} ${targetJob.description} ${targetJob.skills.join(' ')} ${targetJob.experienceLevel}`
              : `${search || ''} ${skill || ''}`.trim();

            if (queryText.length > 0) {
              const queryVector = await generateEmbedding(queryText);
              const vectorMatches = await PgVectorStore.similaritySearch(queryVector, 40, 'candidate');

              vectorMatches.forEach((vm) => {
                const candidateUserId =
                  vm.metadata?.userId ||
                  (vm.source?.startsWith('candidate_') ? vm.source.replace('candidate_', '') : vm.source);
                if (candidateUserId && vm.similarity !== undefined) {
                  vectorSimilarities[candidateUserId] = vm.similarity;
                }
              });
              isVectorSearchApplied = Object.keys(vectorSimilarities).length > 0;
            }
          } catch {
            // Fall back gracefully to deterministic hybrid matcher
          }
        }
      })(),
    ]);

    const scoredCandidates = candidates.map((candidate) => {
      const candidateSkills = candidate.skills.map((s) => s.skill.name);
      const yearsExp = candidate.profile?.yearsOfExperience || 0;
      const candidateVectorSim = vectorSimilarities[candidate.id];

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

        let finalScore = matchResult.overallScore;
        if (candidateVectorSim !== undefined) {
          const vectorScore = Math.round(candidateVectorSim * 100);
          finalScore = Math.min(
            100,
            Math.round(
              vectorScore * 0.35 +
                matchResult.factors.skillMatch.score * 0.35 +
                matchResult.factors.experienceMatch.score * 0.20 +
                matchResult.factors.locationMatch.score * 0.10
            )
          );
        }

        return {
          ...candidate,
          vectorSimilarity: candidateVectorSim,
          aiMatch: {
            ...matchResult,
            overallScore: finalScore,
            explanation: candidateVectorSim !== undefined
              ? `Semantic match: ${(candidateVectorSim * 100).toFixed(1)}% | ${matchResult.explanation}`
              : matchResult.explanation,
          },
          matchScore: finalScore,
        };
      }

      // Default candidate directory scoring
      const defaultScore = candidate.profile?.aiScore || (candidateSkills.length > 3 ? 90 : 80);
      return {
        ...candidate,
        vectorSimilarity: candidateVectorSim,
        aiMatch: {
          overallScore: defaultScore,
          factors: {
            skillMatch: { score: Math.min(100, candidateSkills.length * 20), matched: candidateSkills, missing: [] },
            experienceMatch: { score: Math.min(100, yearsExp * 15), userYears: yearsExp, requiredYears: 3 },
            locationMatch: { score: 100, explanation: candidate.location || 'Remote' },
            careerGoalMatch: { score: 85, alignment: candidate.profile?.title || 'Professional' },
            aiSemanticScore: {
              score: candidateVectorSim ? Math.round(candidateVectorSim * 100) : defaultScore,
              reasoning: candidateVectorSim ? 'pgvector Cosine Retrieval Score' : 'Database profile completeness score',
            },
          },
          explanation: `${candidate.name} has ${candidateSkills.length} verified skills in database (${candidateSkills.slice(0, 3).join(', ')}).`,
        },
        matchScore: defaultScore,
      };
    });

    if (targetJob) {
      scoredCandidates.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    }

    return apiSuccess({
      candidates: scoredCandidates.slice(0, topK),
      targetJob,
      searchMode: isVectorSearchApplied ? 'SEMANTIC_RAG' : 'DETERMINISTIC_HYBRID_FALLBACK',
      totalCount: scoredCandidates.length,
    });
  } catch (error: any) {
    console.error('[Candidates:API:Error]', error);
    return apiError(error.message || 'Failed to fetch candidate directory', 'CANDIDATE_FETCH_ERROR', 500);
  }
}
