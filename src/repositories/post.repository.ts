import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export class PostRepository {
  static async getFeed(params?: { postType?: string; limit?: number }) {
    const where: Prisma.PostWhereInput = {};
    if (params?.postType) {
      where.postType = params.postType;
    }

    return prisma.post.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            headline: true,
            role: true,
            location: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: params?.limit || 30,
    });
  }

  static async createPost(authorId: string, data: {
    content: string;
    mediaUrl?: string;
    postType?: string;
  }) {
    return prisma.post.create({
      data: {
        authorId,
        content: data.content,
        mediaUrl: data.mediaUrl,
        postType: data.postType || 'GENERAL',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            headline: true,
            role: true,
          },
        },
      },
    });
  }

  static async toggleLike(postId: string, userId: string) {
    const existing = await prisma.like.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    });

    if (existing) {
      await prisma.like.delete({
        where: { id: existing.id },
      });
      await prisma.post.update({
        where: { id: postId },
        data: { likesCount: { decrement: 1 } },
      });
      return { liked: false };
    } else {
      await prisma.like.create({
        data: { postId, userId },
      });
      await prisma.post.update({
        where: { id: postId },
        data: { likesCount: { increment: 1 } },
      });
      return { liked: true };
    }
  }

  static async addComment(postId: string, authorId: string, content: string) {
    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId,
        content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    await prisma.post.update({
      where: { id: postId },
      data: { commentsCount: { increment: 1 } },
    });

    return comment;
  }

  static async deletePost(postId: string, userId: string) {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.authorId !== userId) {
      throw new Error('Unauthorized to delete this post');
    }
    return prisma.post.delete({ where: { id: postId } });
  }
}
