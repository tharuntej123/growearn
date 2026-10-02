import { NextRequest } from 'next/server';
import { MessagingController } from '@/controllers/messaging.controller';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return MessagingController.getMessages(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return MessagingController.sendMessage(req, context);
}
