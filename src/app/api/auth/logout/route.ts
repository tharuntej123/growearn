import { AuthController } from '@/controllers/auth.controller';

export async function POST() {
  return AuthController.logout();
}
