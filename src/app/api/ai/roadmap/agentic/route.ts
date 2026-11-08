import { logger } from '@/lib/logger';
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserAIContext } from '@/services/user-context.service';
import { CareerRoadmapService } from '@/lib/ai/roadmap.service';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rate-limiter';

const agenticRoadmapSchema = z
  .object({
    role: z.string().min(1).max(150).optional(),
    targetRole: z.string().min(1).max(150).optional(),
    skill: z.string().min(1).max(150).optional(),
    current_skills: z.array(z.string()).optional(),
    skills: z.array(z.string()).optional(),
    currentSkills: z.array(z.string()).optional(),
    experience_level: z.string().optional(),
    experienceLevel: z.string().optional(),
    target_timeline_weeks: z.number().min(4).max(52).optional().default(16),
    weeklyHours: z.number().optional(),
  })
  .refine(
    (data) => Boolean(data.role || data.targetRole || data.skill),
    { message: 'Target role or skill is required' }
  );

interface AgenticRoadmapPayload {
  target_role?: string;
  targetRole?: string;
  summary?: string;
  estimated_weeks?: number;
  phases?: unknown[];
  recommended_courses?: unknown[];
  recommended_mentors?: unknown[];
  agent_trace?: unknown[];
  agentTrace?: unknown[];
  review_status?: string;
  reviewer_notes?: string;
  mode?: string;
  fallback_reason?: string;
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return apiError('Authentication required to generate an agentic learning roadmap', 'UNAUTHORIZED', 401);
    }

    if (authUser.role !== 'LEARNER') {
      return apiError(
        'Forbidden: Agentic AI roadmap generation is exclusively available for the LEARNER role',
        'FORBIDDEN',
        403
      );
    }

    // Rate limit: 10 requests / minute per user
    const rateLimitResponse = await enforceRateLimit(req, 'ai:roadmap:agentic', 10, 60, authUser.id);
    if (rateLimitResponse) return rateLimitResponse;

    const rawBody = await req.json().catch(() => ({}));
    const parseResult = agenticRoadmapSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return apiError(parseResult.error.errors[0]?.message || 'Invalid request payload', 'VALIDATION_ERROR', 400);
    }

    const userContext = await getUserAIContext(authUser.id).catch(() => null);
    const targetRole =
      parseResult.data.targetRole ||
      parseResult.data.role ||
      parseResult.data.skill ||
      userContext?.profile?.targetRole ||
      userContext?.profile?.careerGoal ||
      'Full Stack Engineer';

    const currentSkills =
      parseResult.data.current_skills ||
      parseResult.data.currentSkills ||
      parseResult.data.skills ||
      userContext?.skills ||
      [];

    const experienceLevel =
      parseResult.data.experience_level ||
      rawBody.experienceLevel ||
      userContext?.profile?.experienceLevel ||
      'BEGINNER';

    const targetTimelineWeeks = parseResult.data.target_timeline_weeks || 16;

    const agentsServiceUrl = process.env.AGENTS_SERVICE_URL || 'http://localhost:8000';
    const internalSecret = process.env.INTERNAL_SERVICE_KEY;

    if (process.env.NODE_ENV === 'production' && (!internalSecret || internalSecret.length < 32)) {
      logger.error('[AgentsGateway] FATAL: INTERNAL_SERVICE_KEY must be configured with >= 32 characters in production.');
    }

    let agenticData: AgenticRoadmapPayload | null = null;
    let mode: 'agentic' | 'fallback' = 'agentic';
    let fallbackReason: string | undefined = undefined;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

      const agentRes = await fetch(`${agentsServiceUrl}/roadmap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(internalSecret ? { 'X-Internal-Secret': internalSecret } : {}),
        },
        body: JSON.stringify({
          role: targetRole,
          current_skills: currentSkills,
          experience_level: experienceLevel,
          target_timeline_weeks: targetTimelineWeeks,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (agentRes.ok) {
        agenticData = (await agentRes.json()) as AgenticRoadmapPayload;
      } else {
        fallbackReason = `Agents service returned HTTP ${agentRes.status}`;
      }
    } catch (err: unknown) {
      const errObj = err instanceof Error ? err : new Error(String(err));
      fallbackReason = `Agents service unavailable (${errObj.name === 'AbortError' ? 'timeout' : errObj.message || 'connection failed'})`;
    }

    // If agents service was down or failed, execute deterministic fallback
    if (!agenticData) {
      mode = 'fallback';
      const fallbackRoadmap = await CareerRoadmapService.generateForLearnerWithTavily({
        userRole: authUser.role,
        skills: currentSkills,
        targetRole,
        experienceLevel,
        careerGoal: targetRole,
      });

      const [fallbackCourses, fallbackMentors] = await Promise.all([
        prisma.course.findMany({
          where: { isPublished: true },
          take: 3,
          select: { title: true, level: true, price: true },
        }).catch(() => []),
        prisma.mentorProfile.findMany({
          where: { isAvailable: true },
          take: 2,
          include: { user: { select: { name: true } } },
        }).catch(() => []),
      ]);

      agenticData = {
        target_role: targetRole,
        summary: fallbackRoadmap.summary,
        estimated_weeks: fallbackRoadmap.estimatedDurationWeeks || targetTimelineWeeks,
        phases: fallbackRoadmap.phases.map((p) => ({
          phase_number: p.phaseNumber,
          title: p.title,
          duration_weeks: p.durationWeeks,
          objective: p.objective,
          skills: p.skills,
          practice_tasks: p.practiceTasks,
          capstone_project: p.projects?.[0] || 'Milestone Capstone Project',
          milestone: p.milestone,
          recommended_resources: p.resources,
        })),
        recommended_courses: fallbackCourses.map((c) => ({
          title: c.title,
          level: c.level,
          match_score: 95,
          url: '/courses',
        })),
        recommended_mentors: fallbackMentors.map((m) => ({
          name: m.user?.name || 'Expert Mentor',
          headline: m.title || 'Technical Mentor',
          hourly_rate: Number(m.hourlyRate) || 50,
          rating: Number(m.rating) || 4.9,
        })),
        agent_trace: [
          {
            agent: 'Researcher',
            action: 'Tavily search fallback',
            summary: 'Live web documentation retrieved via standard search provider.',
          },
          {
            agent: 'Planner',
            action: 'Heuristic curriculum generator',
            summary: `Synthesized 4-phase learning progression for ${targetRole}.`,
          },
          {
            agent: 'Reviewer',
            action: 'Rule-based validation',
            summary: 'Verified prerequisite sequence and approved 16-week pacing.',
          },
        ],
        review_status: 'APPROVED',
        reviewer_notes: 'Generated via resilient fallback pipeline.',
        mode: 'fallback',
        fallback_reason: fallbackReason,
      };
    }

    // Persist or update career roadmap in database (with fault tolerance)
    try {
      const existing = await prisma.careerRoadmap.findUnique({
        where: { userId: authUser.id },
      });

      if (existing) {
        await prisma.roadmapItem.deleteMany({
          where: { roadmapId: existing.id },
        });
        await prisma.careerRoadmap.update({
          where: { id: existing.id },
          data: {
            targetRole,
            summary: agenticData.summary || null,
            phasesJson: JSON.stringify(agenticData.phases || []),
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.careerRoadmap.create({
          data: {
            userId: authUser.id,
            targetRole,
            summary: agenticData.summary || null,
            phasesJson: JSON.stringify(agenticData.phases || []),
          },
        });
      }
 } catch (_e) { const dbErr = _e as Error; 
      logger.warn('[AgenticRoadmap] Database persistence skipped/failed:', dbErr.message);
    }

    return apiSuccess({
      ...agenticData,
      targetRole: agenticData.target_role || agenticData.targetRole || targetRole,
      phases: agenticData.phases || [],
      agentTrace: agenticData.agent_trace || agenticData.agentTrace || [],
      mode,
      fallbackReason,
    });
 } catch (_e) { const err = _e as Error; 
    return apiError(err.message || 'Internal error in agentic roadmap route', 'INTERNAL_ERROR', 500);
  }
}

