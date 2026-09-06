import { z } from 'zod';
import { ROLES } from '@/lib/constants';

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    role: z.enum(['LEARNER', 'PROFESSIONAL', 'MENTOR', 'EMPLOYER', 'STUDENT', 'FREELANCER', 'COMPANY', 'ADMIN']).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const roleSelectSchema = z.object({
  role: z.enum(['LEARNER', 'PROFESSIONAL', 'MENTOR', 'EMPLOYER', 'STUDENT', 'FREELANCER', 'COMPANY', 'ADMIN']),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  headline: z.string().max(160).optional(),
  bio: z.string().max(2000).optional(),
  location: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  hourlyRate: z.number().min(0).optional(),
  title: z.string().optional(),
  githubUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  yearsOfExperience: z.number().min(0).optional(),
  availability: z.string().optional(),
  careerGoal: z.string().optional(),
  companyName: z.string().optional(),
  companyIndustry: z.string().optional(),
  companyWebsite: z.string().url().optional().or(z.literal('')),
  companySize: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RoleSelectInput = z.infer<typeof roleSelectSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
