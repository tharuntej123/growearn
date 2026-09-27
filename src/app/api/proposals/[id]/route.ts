import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { JobRepository } from '@/repositories/job.repository';
import { apiSuccess, apiError } from '@/lib/utils';
import prisma from '@/lib/prisma';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser(req);
  if (!user) {
    return apiError('Authentication required', 'UNAUTHORIZED', 401);
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      job: true,
      professional: true,
    },
  });

  if (!proposal) {
    return apiError('Proposal not found', 'NOT_FOUND', 404);
  }

  if (proposal.job.companyId !== user.id && user.role !== 'ADMIN') {
    return apiError('You do not have permission to update this proposal', 'FORBIDDEN', 403);
  }

  try {
    const body = await req.json();
    const { status } = body;

    const validStatuses = ['PENDING', 'ACCEPTED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      return apiError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 'INVALID_STATUS', 400);
    }

    const updated = await JobRepository.updateProposalStatus(id, status);

    await prisma.notification.create({
      data: {
        userId: proposal.professionalId,
        title: `Proposal Update: ${proposal.job.title}`,
        message: `Your proposal for "${proposal.job.title}" was ${status.toLowerCase()}.`,
        link: `/jobs/${proposal.jobId}`,
        notificationType: 'JOB_APPLICATION',
      },
    }).catch(() => {});

    return apiSuccess({ proposal: updated });
  } catch (err: any) {
    return apiError(err.message || 'Failed to update proposal', 'UPDATE_ERROR', 500);
  }
}
