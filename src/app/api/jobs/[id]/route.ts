import { NextRequest } from 'next/server';
import { JobController } from '@/controllers/job.controller';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return JobController.getJobDetail(req, context);
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return JobController.updateJob(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return JobController.deleteJob(req, context);
}
