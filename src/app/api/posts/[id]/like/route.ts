import { NextRequest } from 'next/server';
import { getCurrentUserFromRequest } from '@/lib/auth';
import { PostRepository } from '@/repositories/post.repository';
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
    const result = await PostRepository.toggleLike(postId, userPayload.userId);
    return apiSuccess(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to like post';
    return apiError(message, 'LIKE_ERROR', 400);
  }
}
