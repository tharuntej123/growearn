import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { JobRepository } from '@/repositories/job.repository';
import { apiSuccess, apiError } from '@/lib/utils';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser(req);
  if (!user) {
    return apiError('Authentication required', 'UNAUTHORIZED', 401);
  }

  const application = await JobRepository.getApplicationById(id);
  if (!application) {
    return apiError('Application not found', 'NOT_FOUND', 404);
  }

  return apiSuccess({ application });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser(req);
  if (!user) {
    return apiError('Authentication required', 'UNAUTHORIZED', 401);
  }

  const application = await JobRepository.getApplicationById(id);
  if (!application) {
    return apiError('Application not found', 'NOT_FOUND', 404);
  }

  // Ensure only the company owner or admin can update status
  if (application.job.companyId !== user.id && user.role !== 'ADMIN') {
    return apiError('You do not have permission to update this application', 'FORBIDDEN', 403);
  }

  try {
    const body = await req.json();
    const { status } = body;

    const validStatuses = ['APPLIED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'ACCEPTED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      return apiError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 'INVALID_STATUS', 400);
    }

    const updated = await JobRepository.updateApplicationStatus(id, status);

    // Send notification to the applicant
    const statusLabels: Record<string, string> = {
      REVIEWING: 'is currently under review',
      SHORTLISTED: 'has been shortlisted ⭐',
      INTERVIEW: 'was invited for an interview 📅',
      ACCEPTED: 'has been accepted / offer extended 🎉',
      REJECTED: 'status has been updated',
    };

    const statusMessage = statusLabels[status] || `status changed to ${status}`;

    await prisma.notification.create({
      data: {
        userId: application.applicantId,
        title: `Application Update: ${application.job.title}`,
        message: `Your application for "${application.job.title}" ${statusMessage}.`,
        link: `/jobs/${application.jobId}`,
        notificationType: 'JOB_APPLICATION',
      },
    }).catch(() => {});

    return apiSuccess({ application: updated });
  } catch (err: any) {
    return apiError(err.message || 'Failed to update application', 'UPDATE_ERROR', 500);
  }
}
