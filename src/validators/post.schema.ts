import { z } from 'zod';

export const createPostSchema = z.object({
  content: z.string().min(1, 'Post content cannot be empty'),
  mediaUrl: z.string().url().optional().or(z.literal('')),
  postType: z
    .enum(['GENERAL', 'ACHIEVEMENT', 'PROJECT', 'CERTIFICATE', 'HIRING', 'LEARNING_MILESTONE'])
    .default('GENERAL'),
});

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
