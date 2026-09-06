import { z } from 'zod';
import { WORK_MODES, JOB_TYPES, EXPERIENCE_LEVELS } from '@/lib/constants';

export const createJobSchema = z.object({
  title: z.string().min(3, 'Job title must be at least 3 characters'),
  description: z.string().min(20, 'Job description must be at least 20 characters'),
  country: z.string().default('India'),
  state: z.string().optional(),
  city: z.string().optional(),
  locationType: z.enum(WORK_MODES).default('REMOTE'),
  jobType: z.enum(JOB_TYPES).default('FREELANCE'),
  minSalary: z.number().min(0, 'Minimum salary must be positive'),
  maxSalary: z.number().min(0, 'Maximum salary must be positive'),
  currency: z.string().default('USD'),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).default('MID'),
  isLocal: z.boolean().default(false),
  deadline: z.string().optional(),
  skills: z.array(z.string()).min(1, 'At least one skill is required'),
});

export const applyJobSchema = z.object({
  coverLetter: z.string().min(10, 'Cover letter must be at least 10 characters'),
  resumeUrl: z.string().optional(),
});

export const createProposalSchema = z.object({
  coverLetter: z.string().min(20, 'Proposal details must be at least 20 characters'),
  proposedRate: z.number().min(1, 'Proposed rate must be greater than 0'),
  estimatedDays: z.number().min(1, 'Estimated delivery days required'),
  milestones: z
    .array(
      z.object({
        title: z.string(),
        amount: z.number(),
        days: z.number(),
      })
    )
    .optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type ApplyJobInput = z.infer<typeof applyJobSchema>;
export type CreateProposalInput = z.infer<typeof createProposalSchema>;
