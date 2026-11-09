import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { StorageService } from '@/services/storage.service';
import { prisma } from '@/lib/prisma';
import { enforceRateLimit } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return apiError('Unauthorized', 'UNAUTHORIZED', 401);
    }

    // Rate limit: 5 uploads per 5 minutes per user
    const rateLimitResponse = await enforceRateLimit(req, 'storage:upload-resume', 5, 300, authUser.id);
    if (rateLimitResponse) return rateLimitResponse;

    // Pre-flight check: Reject uploads exceeding 10MB before buffering multipart payload
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
      return apiError('Upload payload exceeds 10MB limit', 'PAYLOAD_TOO_LARGE', 413);
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return apiError('No file provided in form data', 'BAD_REQUEST', 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadResult = await StorageService.saveResumeFile(
      buffer,
      file.name,
      file.type || 'application/pdf',
      authUser.id
    );

    const kbSize = (uploadResult.sizeBytes / 1024).toFixed(0);

    // Persist resume metadata & keys in database profile
    await prisma.profile.upsert({
      where: { userId: authUser.id },
      update: {
        resumeUrl: uploadResult.signedUrl || `/api/storage/file?key=${encodeURIComponent(uploadResult.key)}`,
        resumeKey: uploadResult.key,
        resumeName: uploadResult.filename,
        resumeSize: `${kbSize} KB`,
        resumeMimeType: uploadResult.mimeType,
        resumeStorageProvider: uploadResult.provider,
      },
      create: {
        userId: authUser.id,
        resumeUrl: uploadResult.signedUrl || `/api/storage/file?key=${encodeURIComponent(uploadResult.key)}`,
        resumeKey: uploadResult.key,
        resumeName: uploadResult.filename,
        resumeSize: `${kbSize} KB`,
        resumeMimeType: uploadResult.mimeType,
        resumeStorageProvider: uploadResult.provider,
      },
    });

    return apiSuccess({
      key: uploadResult.key,
      url: uploadResult.signedUrl || `/api/storage/file?key=${encodeURIComponent(uploadResult.key)}`,
      name: uploadResult.filename,
      size: `${kbSize} KB`,
      provider: uploadResult.provider,
      mimeType: uploadResult.mimeType,
    });
 } catch (_e) { const err = _e as Error; 
    return apiError(err.message || 'Resume upload failed', 'UPLOAD_ERROR', 400);
  }
}
