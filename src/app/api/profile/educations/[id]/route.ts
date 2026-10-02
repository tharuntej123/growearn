import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401);
    }

    const { id } = await context.params;
    const edu = await prisma.education.findUnique({ where: { id } });
    if (!edu) {
      return apiError('Education record not found', 'NOT_FOUND', 404);
    }

    if (edu.userId !== authUser.id && authUser.role !== 'ADMIN') {
      return apiError('Forbidden', 'FORBIDDEN', 403);
    }

    await prisma.education.delete({ where: { id } });
    return apiSuccess({ message: 'Education record deleted successfully' });
  } catch (error: any) {
    return apiError(error.message || 'Failed to delete education', 'INTERNAL_ERROR', 500);
  }
}
