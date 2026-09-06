import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { PostRepository } from '@/repositories/post.repository';
import { createCommentSchema } from '@/validators/post.schema';
import { apiSuccess, apiError } from '@/lib/utils';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: postId } = await params;
  const userPayload = getCurrentUserFromRequest(req);
  if (!userPayload) {
    return apiError('Unauthorized', 'UNAUTHORIZED', 401);
  }

  try {
    const body = await req.json();
    const validated = createCommentSchema.safeParse(body);
    if (!validated.success) {
      return apiError('Comment cannot be empty', 'VALIDATION_ERROR', 400);
    }

    const comment = await PostRepository.addComment(
      postId,
      userPayload.userId,
      validated.data.content
    );

    return apiSuccess({ comment }, 201);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to add comment';
    return apiError(message, 'COMMENT_ERROR', 400);
  }
}
