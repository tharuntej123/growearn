import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { StorageService } from '@/services/storage.service';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');
    const expires = searchParams.get('expires');
    const sig = searchParams.get('sig');

    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
    }

    // 1. Check signature authentication if provided
    let isSignatureValid = false;
    if (expires && sig) {
      const expNum = parseInt(expires, 10);
      if (!isNaN(expNum) && StorageService.verifyLocalSignature(key, expNum, sig)) {
        isSignatureValid = true;
      }
    }

    // 2. Check session authentication if signature is not present or invalid
    let isSessionAuthorized = false;
    if (!isSignatureValid) {
      const authUser = await getCurrentUser(req);
      if (authUser) {
        // Admin has full access
        if (authUser.role === 'ADMIN') {
          isSessionAuthorized = true;
        } else if (key.startsWith('resumes/')) {
          // Extract owner userId from key: "resumes/{userId}/..."
          const parts = key.split('/');
          const ownerId = parts[1];

          if (authUser.id === ownerId) {
            isSessionAuthorized = true;
          } else if (authUser.role === 'EMPLOYER') {
            // Check if employer has an active job application from this user
            const application = await prisma.application.findFirst({
              where: {
                applicantId: ownerId,
                job: {
                  companyId: authUser.id,
                },
              },
            });
            if (application) {
              isSessionAuthorized = true;
            }
          }
        }
      }
    }

    if (!isSignatureValid && !isSessionAuthorized) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to access this resource' }, { status: 403 });
    }

    // Download / stream file
    const file = await StorageService.download(key);
    const filename = key.split('/').pop() || 'download';

    return new NextResponse(file.buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename="${filename}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    return NextResponse.json({ error: error.message || 'File access error' }, { status: 500 });
  }
}
