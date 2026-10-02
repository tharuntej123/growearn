import { prisma } from '@/lib/prisma';

export class MessagingRepository {
  /**
   * Get all conversations for a user with last message and unread count.
   */
  static async getUserConversations(userId: string) {
    const participants = await prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                    role: true,
                    headline: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: {
        conversation: {
          updatedAt: 'desc',
        },
      },
    });

    return participants.map((p) => {
      const conv = p.conversation;
      const otherParticipants = conv.participants.filter((cp) => cp.userId !== userId);
      const otherUser = otherParticipants[0]?.user;
      const lastMessage = conv.messages[0];

      return {
        id: conv.id,
        title: conv.title || otherUser?.name || 'Direct Message',
        isGroup: conv.isGroup,
        otherUser,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
              isRead: lastMessage.isRead,
            }
          : null,
        updatedAt: conv.updatedAt,
      };
    });
  }

  /**
   * Verify whether a user is a participant in a conversation.
   */
  static async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
    });
    return Boolean(participant);
  }

  /**
   * Get messages for a specific conversation with pagination, verifying participant access.
   */
  static async getConversationMessages(conversationId: string, userId: string, limit = 50, offset = 0) {
    const allowed = await this.isParticipant(conversationId, userId);
    if (!allowed) {
      throw new Error('Forbidden: You are not a participant in this conversation');
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });

    // Mark messages from others as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    // Update lastReadAt for this participant
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: { lastReadAt: new Date() },
    });

    return messages;
  }

  /**
   * Send a new message to a conversation.
   */
  static async sendMessage(data: {
    conversationId: string;
    senderId: string;
    content: string;
    mediaUrl?: string;
  }) {
    const allowed = await this.isParticipant(data.conversationId, data.senderId);
    if (!allowed) {
      throw new Error('Forbidden: You are not a participant in this conversation');
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          content: data.content.trim(),
          mediaUrl: data.mediaUrl || null,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
      }),
      prisma.conversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return message;
  }

  /**
   * Find existing 1-on-1 direct conversation or create a new one.
   */
  static async getOrCreateDirectConversation(userId1: string, userId2: string) {
    if (userId1 === userId2) {
      throw new Error('Cannot create conversation with yourself');
    }

    // Find conversation where both are participants
    const commonConversations = await prisma.conversation.findFirst({
      where: {
        isGroup: false,
        AND: [
          { participants: { some: { userId: userId1 } } },
          { participants: { some: { userId: userId2 } } },
        ],
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true, role: true, headline: true },
            },
          },
        },
      },
    });

    if (commonConversations) {
      return commonConversations;
    }

    // Create new conversation with both participants
    return prisma.conversation.create({
      data: {
        isGroup: false,
        participants: {
          create: [{ userId: userId1 }, { userId: userId2 }],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true, role: true, headline: true },
            },
          },
        },
      },
    });
  }
}
