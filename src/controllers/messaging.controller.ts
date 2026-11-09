import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { MessagingRepository } from '@/repositories/messaging.repository';
import { enforceRateLimit } from '@/lib/rate-limiter';
import { z } from 'zod';

import { prisma } from '@/lib/prisma';

const startConversationSchema = z.object({
  targetUserId: z.string().min(1, 'Target user ID is required'),
});

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message content cannot be empty').max(4000, 'Message cannot exceed 4000 characters'),
  mediaUrl: z.string().max(2000).optional(),
});

export class MessagingController {
  static async getConversations(req: NextRequest) {
    try {
      const authUser = await getCurrentUser(req);
      if (!authUser) {
        return apiError('Unauthorized', 'UNAUTHORIZED', 401);
      }

      const conversations = await MessagingRepository.getUserConversations(authUser.id);
      return apiSuccess({ conversations });
 } catch (_e) { const err = _e as Error; 
      return apiError(err.message || 'Failed to fetch conversations', 'INTERNAL_ERROR', 500);
    }
  }

  static async startConversation(req: NextRequest) {
    try {
      const authUser = await getCurrentUser(req);
      if (!authUser) {
        return apiError('Unauthorized', 'UNAUTHORIZED', 401);
      }

      // Rate limit: 20 conversations / minute
      const rateLimitResponse = await enforceRateLimit(req, 'messages:conversation-start', 20, 60, authUser.id);
      if (rateLimitResponse) return rateLimitResponse;

      const body = await req.json();
      const validated = startConversationSchema.safeParse(body);
      if (!validated.success) {
        return apiError('Invalid target user ID', 'VALIDATION_ERROR', 400);
      }

      if (validated.data.targetUserId === authUser.id) {
        return apiError('Cannot start a conversation with yourself', 'BAD_REQUEST', 400);
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: validated.data.targetUserId },
      });
      if (!targetUser) {
        return apiError('Target user not found', 'NOT_FOUND', 404);
      }

      const conversation = await MessagingRepository.getOrCreateDirectConversation(
        authUser.id,
        validated.data.targetUserId
      );

      return apiSuccess({ conversation }, 201);
 } catch (_e) { const err = _e as Error; 
      return apiError(err.message || 'Failed to start conversation', 'INTERNAL_ERROR', 500);
    }
  }

  static async getMessages(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const authUser = await getCurrentUser(req);
      if (!authUser) {
        return apiError('Unauthorized', 'UNAUTHORIZED', 401);
      }

      const { id: conversationId } = await params;
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const offset = parseInt(searchParams.get('offset') || '0', 10);

      const messages = await MessagingRepository.getConversationMessages(
        conversationId,
        authUser.id,
        limit,
        offset
      );

      return apiSuccess({ messages });
 } catch (_e) { const error = _e as Error; const err = _e as Error; 
      const status = error.message?.includes('Forbidden') ? 403 : 500;
      return apiError(err.message || 'Failed to fetch messages', 'MESSAGING_ERROR', status);
    }
  }

  static async sendMessage(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const authUser = await getCurrentUser(req);
      if (!authUser) {
        return apiError('Unauthorized', 'UNAUTHORIZED', 401);
      }

      // Rate limit: 60 messages / minute
      const rateLimitResponse = await enforceRateLimit(req, 'messages:send', 60, 60, authUser.id);
      if (rateLimitResponse) return rateLimitResponse;

      const { id: conversationId } = await params;
      const body = await req.json();
      const validated = sendMessageSchema.safeParse(body);
      if (!validated.success) {
        return apiError(validated.error.errors[0]?.message || 'Invalid message', 'VALIDATION_ERROR', 400);
      }

      const message = await MessagingRepository.sendMessage({
        conversationId,
        senderId: authUser.id,
        content: validated.data.content,
        mediaUrl: validated.data.mediaUrl,
      });

      return apiSuccess({ message }, 201);
 } catch (_e) { const error = _e as Error; const err = _e as Error; 
      const status = error.message?.includes('Forbidden') ? 403 : 500;
      return apiError(err.message || 'Failed to send message', 'MESSAGING_ERROR', status);
    }
  }
}
