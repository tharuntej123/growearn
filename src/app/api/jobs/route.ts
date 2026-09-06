import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createJobSchema } from '@/validators/job.schema';
import { apiSuccess, apiError } from '@/lib/utils';
import { JobRepository } from '@/repositories/job.repository';
import { getUserAIContext } from '@/services/user-context.service';
import { RecommendationService } from '@/services/recommendation.service';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query') || undefined;
    const city = searchParams.get('city') || undefined;
    const locationType = searchParams.get('locationType') || undefined;
    const jobType = searchParams.get('jobType') || undefined;
    const companyId = searchParams.get('companyId') || undefined;
    const mine = searchParams.get('mine') === 'true';

    const authUser = await getCurrentUser(req);
    const targetCompanyId = mine && authUser ? authUser.id : companyId;

    if (targetCompanyId) {
      const jobRepo = new JobRepository();
      const jobs = await jobRepo.getJobs({
        companyId: targetCompanyId,
        query,
        city,
        locationType,
        jobType,
      });
      return apiSuccess({
        jobs,
        isPersonalized: false,
      });
    }

    let userContext = null;
    if (authUser) {
      userContext = await getUserAIContext(authUser.id);
    }

    const { jobs, isPersonalized, emptyReason } = await RecommendationService.getJobs(
      userContext,
      50,
      { city, locationType, jobType, query }
    );

    return apiSuccess({
      jobs,
      isPersonalized,
      emptyReason,
    });
  } catch (error: any) {
    console.error('[Jobs:FetchError]', error);
    return apiError(
      error.message || 'Failed to fetch jobs',
      'INTERNAL_ERROR',
      500
    );
  }
}

export async function POST(req: NextRequest) {
  let authUser: any = null;
  let body: any = null;

  try {
    authUser = await getCurrentUser(req);
    if (!authUser) {
      console.warn('[JobPost:Unauthorized] Unauthenticated request attempted to post a job');
      return apiError('Authentication required to post job opportunities', 'UNAUTHORIZED', 401);
    }

    // Allow both canonical EMPLOYER and legacy COMPANY roles, as well as ADMIN
    const isCompanyRole = ['COMPANY', 'EMPLOYER', 'ADMIN'].includes(authUser.role);
    if (!isCompanyRole) {
      console.warn(
        `[JobPost:Forbidden] User ${authUser.id} with role "${authUser.role}" attempted to post a job.`
      );
      return apiError(
        'Only registered Company or Employer accounts can post job opportunities. Please switch your role or complete company onboarding.',
        'FORBIDDEN',
        403
      );
    }

    // Verify company profile exists
    const userRecord = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: { profile: true },
    });

    if (!userRecord) {
      console.warn(`[JobPost:UserNotFound] User ${authUser.id} not found in database.`);
      return apiError('User account not found', 'NOT_FOUND', 404);
    }

    // Parse request body
    try {
      body = await req.json();
    } catch {
      return apiError('Invalid JSON payload in request body', 'INVALID_JSON', 400);
    }

    // Validate payload with Zod
    const validated = createJobSchema.safeParse(body);
    if (!validated.success) {
      const formattedErrors: Record<string, string[] | undefined> = validated.error.flatten().fieldErrors;
      console.warn(`[JobPost:ValidationFailed] User ${authUser.id} validation failed:`, formattedErrors);
      
      // Construct a helpful single-string summary for toasts alongside the detailed fieldErrors
      const firstKey = Object.keys(formattedErrors)[0];
      const firstMsg = formattedErrors[firstKey]?.[0] || 'Invalid field';
      const summaryMsg = `Validation failed on "${firstKey}": ${firstMsg}`;

      return apiError(summaryMsg, 'VALIDATION_ERROR', 400, formattedErrors);
    }

    const { skills, deadline, ...jobFields } = validated.data;
    const newJob = await JobRepository.createJob(authUser.id, {
      ...jobFields,
      skillNames: skills,
      deadline: deadline ? new Date(deadline) : undefined,
    });

    console.info(`[JobPost:Success] Job created successfully (ID: ${newJob.id}, Title: "${newJob.title}") by user ${authUser.id}`);
    return apiSuccess({ job: newJob }, 201);
  } catch (err: any) {
    console.error('[JobPost:UnexpectedError]', {
      userId: authUser?.id,
      role: authUser?.role,
      payload: body,
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });

    return apiError(
      err.message || 'Failed to create job listing due to an unexpected server error',
      'JOB_CREATE_ERROR',
      500
    );
  }
}
