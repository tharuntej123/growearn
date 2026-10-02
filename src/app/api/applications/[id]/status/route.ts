import { NextRequest } from 'next/server';
import { JobController } from '@/controllers/job.controller';

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return JobController.updateApplicationStatus(req, context);
}
