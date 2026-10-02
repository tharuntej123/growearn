import { NextRequest } from 'next/server';
import { JobController } from '@/controllers/job.controller';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return JobController.getJobDetail(req, context);
}
