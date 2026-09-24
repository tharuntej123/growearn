import { NextRequest } from 'next/server';
import { JobController } from '@/controllers/job.controller';

export async function GET(req: NextRequest) {
  return JobController.getJobs(req);
}

export async function POST(req: NextRequest) {
  return JobController.createJob(req);
}
