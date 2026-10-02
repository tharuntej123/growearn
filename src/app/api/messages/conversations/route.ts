import { NextRequest } from 'next/server';
import { MessagingController } from '@/controllers/messaging.controller';

export async function GET(req: NextRequest) {
  return MessagingController.getConversations(req);
}

export async function POST(req: NextRequest) {
  return MessagingController.startConversation(req);
}
