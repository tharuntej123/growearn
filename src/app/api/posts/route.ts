import { NextRequest } from 'next/server';
import { PostController } from '@/controllers/post.controller';

export async function GET(req: NextRequest) {
  return PostController.getFeed(req);
}

export async function POST(req: NextRequest) {
  return PostController.createPost(req);
}
