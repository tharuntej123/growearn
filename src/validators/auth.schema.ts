import { z } from 'zod';

export const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    email: z.string().email('Please enter a valid email address').max(255),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
    role: z
      .enum(['LEARNER', 'PROFESSIONAL', 'MENTOR', 'EMPLOYER', 'STUDENT', 'FREELANCER', 'COMPANY'])
      .optional()
      .default('LEARNER'),
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
  role: z.enum(['LEARNER', 'PROFESSIONAL', 'MENTOR', 'EMPLOYER', 'STUDENT', 'FREELANCER', 'COMPANY']),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  headline: z.string().max(160).optional(),
  bio: z.string().max(2000).optional(),
  location: z.string().max(200).optional(),
  country: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  city: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  hourlyRate: z.number().min(0).max(10000).optional(),
  title: z.string().max(150).optional(),
  githubUrl: z.string().url().optional().or(z.literal('')),
  linkedinUrl: z.string().url().optional().or(z.literal('')),
  portfolioUrl: z.string().url().optional().or(z.literal('')),
  resumeUrl: z.string().optional(),
  resumeName: z.string().optional(),
  resumeSize: z.string().optional(),
  resumeText: z.string().optional(),
  yearsOfExperience: z.number().min(0).max(50).optional(),
  availability: z.string().optional(),
  careerGoal: z.string().max(255).optional(),
  targetRole: z.string().max(255).optional(),
  interests: z.string().max(500).optional(),
  experienceLevel: z.string().optional(),
  preferredLocation: z.string().optional(),
  preferredJobType: z.string().optional(),
  companyName: z.string().max(150).optional(),
  companyIndustry: z.string().max(100).optional(),
  companyWebsite: z.string().url().optional().or(z.literal('')),
  companySize: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RoleSelectInput = z.infer<typeof roleSelectSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
