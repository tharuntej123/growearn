import { NextRequest } from 'next/server';
import { JobController } from '@/controllers/job.controller';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return JobController.applyForJob(req, context);
}
