import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  category: z.string().default('Development'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('BEGINNER'),
  price: z.number().min(0).default(0),
  durationHours: z.number().min(1).default(10),
  thumbnail: z.string().optional(),
  skillsCovered: z.string().optional(),
  modules: z
    .array(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        orderIndex: z.number().default(0),
        lessons: z.array(
          z.object({
            title: z.string().min(1),
            content: z.string().optional(),
            videoUrl: z.string().optional(),
            durationMinutes: z.number().default(15),
            orderIndex: z.number().default(0),
          })
        ),
      })
    )
    .optional(),
});

export const mentorshipRequestSchema = z.object({
  topic: z.string().min(3, 'Topic is required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  preferredTime: z.string().optional(),
});

export const mentorshipBookingSchema = z.object({
  scheduledAt: z.string(),
  durationMinutes: z.number().default(60),
  price: z.number().default(50),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>;
export type MentorshipRequestInput = z.infer<typeof mentorshipRequestSchema>;
