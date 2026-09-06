import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { getUserAIContext } from '@/services/user-context.service';
import { RecommendationService } from '@/services/recommendation.service';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const tab = (searchParams.get('tab') as 'for_you' | 'following' | 'latest') || 'for_you';

    const authUser = await getCurrentUser(req);
    let userContext = null;
    if (authUser) {
      userContext = await getUserAIContext(authUser.id);
    }

    const { posts, isPersonalized } = await RecommendationService.getFeed(userContext, tab);

    return apiSuccess({
      posts,
      isPersonalized,
    });
  } catch (error: any) {
    console.error('Feed fetch error:', error);
    return apiError(
      error.message || 'Failed to fetch posts',
      'INTERNAL_ERROR',
      500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return apiError('Authentication required', 'UNAUTHORIZED', 401);
    }

    const body = await req.json();
    const { content, postType = 'GENERAL', mediaUrl } = body;

    if (!content || !content.trim()) {
      return apiError('Post content cannot be empty', 'VALIDATION_ERROR', 400);
    }

    const newPost = await prisma.post.create({
      data: {
        authorId: authUser.id,
        content: content.trim(),
        postType,
        mediaUrl: mediaUrl || null,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true, headline: true, role: true } },
        likes: true,
        comments: true,
      },
    });

    return apiSuccess({ post: newPost }, 201);
  } catch (error: any) {
    return apiError(
      error.message || 'Failed to create post',
      'INTERNAL_ERROR',
      500
    );
  }
}
