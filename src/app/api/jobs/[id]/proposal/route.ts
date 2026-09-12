import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { JobRepository } from '@/repositories/job.repository';
import { createProposalSchema } from '@/validators/job.schema';
import { apiSuccess, apiError } from '@/lib/utils';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: jobId } = await params;
  const userPayload = getCurrentUserFromRequest(req);
  if (!userPayload) {
    return apiError('Unauthorized', 'UNAUTHORIZED', 401);
  }

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) {
    return apiError('Job not found', 'NOT_FOUND', 404);
  }

  try {
    const body = await req.json();
    const validated = createProposalSchema.safeParse(body);
    if (!validated.success) {
      return apiError('Invalid proposal inputs', 'VALIDATION_ERROR', 400, validated.error.format());
    }

    const proposal = await JobRepository.createProposal(jobId, userPayload.userId, {
      coverLetter: validated.data.coverLetter,
      proposedRate: validated.data.proposedRate,
      estimatedDays: validated.data.estimatedDays,
      milestonesJson: validated.data.milestones ? JSON.stringify(validated.data.milestones) : undefined,
    });

    await prisma.notification.create({
      data: {
        userId: job.companyId,
        title: 'New Freelance Proposal Submitted',
        message: `${userPayload.name} submitted a custom proposal for "${job.title}" ($${validated.data.proposedRate}).`,
        link: '/company/dashboard',
        notificationType: 'JOB_APPLICATION',
      },
    });

    return apiSuccess({ proposal }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to submit proposal';
    return apiError(message, 'PROPOSAL_ERROR', 400);
  }
}
