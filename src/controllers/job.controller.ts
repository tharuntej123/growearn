import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createJobSchema } from '@/validators/job.schema';
import { apiSuccess, apiError } from '@/lib/utils';
import { JobRepository } from '@/repositories/job.repository';
import { getUserAIContext } from '@/services/user-context.service';
import { RecommendationService } from '@/services/recommendation.service';
import prisma from '@/lib/prisma';

export class JobController {
  static async getJobs(req: NextRequest) {
    try {
      const searchParams = req.nextUrl.searchParams;
      const query = searchParams.get('query') || undefined;
      const city = searchParams.get('city') || undefined;
      const locationType = searchParams.get('locationType') || undefined;
      const jobType = searchParams.get('jobType') || undefined;
      const companyId = searchParams.get('companyId') || undefined;
      const mine = searchParams.get('mine') === 'true';
      const isLocalParam = searchParams.get('isLocal');
      const isLocal = isLocalParam === 'true' ? true : isLocalParam === 'false' ? false : undefined;

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
          isLocal,
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
        { city, locationType, jobType, query, isLocal }
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

  static async createJob(req: NextRequest) {
    let authUser: any = null;
    let body: any = null;

    try {
      authUser = await getCurrentUser(req);
      if (!authUser) {
        return apiError('Authentication required to post job opportunities', 'UNAUTHORIZED', 401);
      }

      const isCompanyRole = ['COMPANY', 'EMPLOYER', 'ADMIN'].includes(authUser.role);
      if (!isCompanyRole) {
        return apiError(
          'Only registered Company or Employer accounts can post job opportunities.',
          'FORBIDDEN',
          403
        );
      }

      const userRecord = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: { profile: true },
      });

      if (!userRecord) {
        return apiError('User account not found', 'NOT_FOUND', 404);
      }

      try {
        body = await req.json();
      } catch {
        return apiError('Invalid JSON payload in request body', 'INVALID_JSON', 400);
      }

      const validated = createJobSchema.safeParse(body);
      if (!validated.success) {
        const formattedErrors = validated.error.flatten().fieldErrors;
        const firstKey = Object.keys(formattedErrors)[0] as keyof typeof formattedErrors;
        const firstMsg = (firstKey && formattedErrors[firstKey]?.[0]) || 'Invalid field';
        return apiError(`Validation failed on "${String(firstKey)}": ${firstMsg}`, 'VALIDATION_ERROR', 400, formattedErrors);
      }

      const { skills, deadline, ...jobFields } = validated.data;
      const newJob = await JobRepository.createJob(authUser.id, {
        ...jobFields,
        skillNames: skills,
        deadline: deadline ? new Date(deadline) : undefined,
      });

      return apiSuccess({ job: newJob }, 201);
    } catch (err: any) {
      console.error('[JobPost:Error]', err);
      return apiError(
        err.message || 'Failed to create job listing',
        'JOB_CREATE_ERROR',
        500
      );
    }
  }
}
