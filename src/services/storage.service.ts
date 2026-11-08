import { S3StorageProvider, R2StorageProvider, GCSStorageProvider } from './storage/cloud-providers';
export { S3StorageProvider, R2StorageProvider, GCSStorageProvider };
import { logger } from '@/lib/logger';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export type StorageProviderType = 's3' | 'r2' | 'gcs' | 'local';

export interface StorageObjectMetadata {
  key: string;
  filename: string;
  sizeBytes: number;
  mimeType: string;
  provider: StorageProviderType;
  signedUrl?: string;
  isPrivate: boolean;
  uploadedAt: Date;
}

export interface StorageUploadOptions {
  folder?: string;
  isPrivate?: boolean;
  allowedMimeTypes?: string[];
  maxSizeBytes?: number;
}

export interface IStorageProvider {
  readonly providerType: StorageProviderType;
  upload(fileBuffer: Buffer, key: string, mimeType: string, isPrivate: boolean, originalName: string): Promise<StorageObjectMetadata>;
  delete(key: string): Promise<boolean>;
  getSignedUrl(key: string, expiresInSeconds?: number): Promise<string>;
  download(key: string): Promise<{ buffer: Buffer; mimeType: string }>;
}

// Local File System Storage Provider (Secure Dev Fallback)
// Stores private files in secure non-public directory.
export class LocalStorageProvider implements IStorageProvider {
  readonly providerType: StorageProviderType = 'local';
  private privateBaseDir = path.join(process.cwd(), 'storage', 'private');

  private getSigningSecret(): string {
    const secret = process.env.STORAGE_SIGNING_SECRET || process.env.AUTH_SECRET || process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error('STORAGE_SIGNING_SECRET or AUTH_SECRET (min 32 chars) must be configured for secure storage URLs');
    }
    return secret;
  }

  private async ensureDir(targetDir: string) {
    try {
      await fs.mkdir(targetDir, { recursive: true });
    } catch {
      // directory exists
    }
  }

  private getSafePath(key: string): string {
    if (!key || key.includes('..') || path.isAbsolute(key)) {
      throw new Error('Access denied: Path traversal attempt detected');
    }
    const resolvedPath = path.resolve(this.privateBaseDir, key);
    const resolvedBase = path.resolve(this.privateBaseDir);
    if (!resolvedPath.startsWith(resolvedBase + path.sep) && resolvedPath !== resolvedBase) {
      throw new Error('Access denied: Path traversal attempt detected');
    }
    return resolvedPath;
  }

  async upload(
    fileBuffer: Buffer,
    key: string,
    mimeType: string,
    isPrivate: boolean,
    originalName: string
  ): Promise<StorageObjectMetadata> {
    const fullPath = this.getSafePath(key);
    await this.ensureDir(path.dirname(fullPath));
    await fs.writeFile(fullPath, fileBuffer);

    return {
      key,
      filename: originalName,
      sizeBytes: fileBuffer.length,
      mimeType,
      provider: 'local',
      isPrivate,
      uploadedAt: new Date(),
    };
  }

  async delete(key: string): Promise<boolean> {
    try {
      const fullPath = this.getSafePath(key);
      await fs.unlink(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const payload = `${key}:${expiresAt}`;
    const sig = crypto.createHmac('sha256', this.getSigningSecret()).update(payload).digest('hex');
    return `${appUrl}/api/storage/file?key=${encodeURIComponent(key)}&expires=${expiresAt}&sig=${sig}`;
  }

  verifySignature(key: string, expires: number, signature: string): boolean {
    const now = Math.floor(Date.now() / 1000);
    if (now > expires) return false;
    const payload = `${key}:${expires}`;
    const expectedSig = crypto.createHmac('sha256', this.getSigningSecret()).update(payload).digest('hex');
    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expectedSig, 'utf8');
    if (sigBuf.length !== expBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(sigBuf, expBuf);
  }

  async download(key: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const fullPath = this.getSafePath(key);
    const buffer = await fs.readFile(fullPath);
    // Simple MIME detection fallback
    const ext = path.extname(key).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
    };
    return { buffer, mimeType: mimeMap[ext] || 'application/octet-stream' };
  }
}

// Master Storage Service
// Unified multi-provider storage abstraction for S3, Cloudflare R2, GCS, and Local Secure Fallback.
export class StorageService {
  private static localProvider = new LocalStorageProvider();
  private static s3Provider = new S3StorageProvider();
  private static r2Provider = new R2StorageProvider();
  private static gcsProvider = new GCSStorageProvider();

  // Determine the active storage provider from environment.
  public static getActiveProviderType(): StorageProviderType {
    const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase() as StorageProviderType;
    if (['s3', 'r2', 'gcs', 'local'].includes(provider)) {
      return provider;
    }
    return 'local';
  }

  private static getProvider(type?: StorageProviderType): IStorageProvider {
    const active = type || this.getActiveProviderType();
    switch (active) {
      case 's3':
        return this.s3Provider;
      case 'r2':
        return this.r2Provider;
      case 'gcs':
        return this.gcsProvider;
      case 'local':
      default:
        return this.localProvider;
    }
  }

  // Upload an arbitrary buffer to active storage provider.
  public static async upload(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    userId: string,
    options: StorageUploadOptions = {}
  ): Promise<StorageObjectMetadata> {
    const allowed = options.allowedMimeTypes || [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/webp',
    ];

    if (!allowed.includes(mimeType)) {
      throw new Error(`Unsupported file format: ${mimeType}. Allowed formats: ${allowed.join(', ')}`);
    }

    // Validate file header magic bytes to prevent MIME type spoofing
    this.validateMagicBytes(fileBuffer, mimeType);

    const maxSize = options.maxSizeBytes || 10 * 1024 * 1024; // 10 MB default
    if (fileBuffer.length > maxSize) {
      throw new Error(`File size ${(fileBuffer.length / (1024 * 1024)).toFixed(1)}MB exceeds ${maxSize / (1024 * 1024)}MB limit`);
    }

    const folder = options.folder || 'resumes';
    const isPrivate = options.isPrivate !== undefined ? options.isPrivate : true;
    const ext = path.extname(originalName).toLowerCase() || '.pdf';
    const cleanBasename = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const randomId = crypto.randomBytes(6).toString('hex');
    const key = `${folder}/${userId}/${cleanBasename}_${Date.now()}_${randomId}${ext}`;

    const providerType = this.getActiveProviderType();
    const provider = this.getProvider(providerType);

    try {
      const result = await provider.upload(fileBuffer, key, mimeType, isPrivate, originalName);
      result.signedUrl = await provider.getSignedUrl(key, 3600);
      return result;
    } catch (err) {
      if (providerType !== 'local') {
        if (process.env.NODE_ENV === 'production') {
          throw new Error(`Production storage error: Failed to upload file to cloud storage provider (${providerType}): ${err instanceof Error ? err.message : String(err)}`);
        }
        logger.warn(`[StorageService:DEV] Cloud upload failed, falling back to local storage in development mode:`, err);
        const localResult = await this.localProvider.upload(fileBuffer, key, mimeType, isPrivate, originalName);
        localResult.signedUrl = await this.localProvider.getSignedUrl(key, 3600);
        return localResult;
      }
      throw err;
    }
  }

  // Delete an object from storage.
  public static async delete(key: string, providerType?: StorageProviderType): Promise<boolean> {
    const provider = this.getProvider(providerType);
    return provider.delete(key);
  }

  // Generate signed/temporal access URL for private objects.
  public static async getSignedUrl(key: string, expiresInSeconds = 3600, providerType?: StorageProviderType): Promise<string> {
    const provider = this.getProvider(providerType);
    return provider.getSignedUrl(key, expiresInSeconds);
  }

  // Download or stream stored object.
  public static async download(key: string, providerType?: StorageProviderType): Promise<{ buffer: Buffer; mimeType: string }> {
    const provider = this.getProvider(providerType);
    return provider.download(key);
  }

  // Helper specifically for resume uploads (backwards compatible).
  public static async saveResumeFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    userId: string
  ): Promise<StorageObjectMetadata> {
    return this.upload(fileBuffer, originalName, mimeType, userId, {
      folder: 'resumes',
      isPrivate: true,
      maxSizeBytes: 5 * 1024 * 1024,
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
      ],
    });
  }

  public static verifyLocalSignature(key: string, expires: number, signature: string): boolean {
    return this.localProvider.verifySignature(key, expires, signature);
  }

  private static validateMagicBytes(buffer: Buffer, mimeType: string): void {
    if (buffer.length < 4) {
      throw new Error('File content is empty or corrupt');
    }
    if (mimeType === 'application/pdf') {
      const header = buffer.subarray(0, 5).toString('ascii');
      if (!header.startsWith('%PDF-')) {
        throw new Error('Invalid PDF file: Missing %PDF- magic bytes signature');
      }
    } else if (mimeType === 'image/png') {
      if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4E || buffer[3] !== 0x47) {
        throw new Error('Invalid PNG file: Missing PNG magic signature');
      }
    } else if (mimeType === 'image/jpeg') {
      if (buffer[0] !== 0xFF || buffer[1] !== 0xD8 || buffer[2] !== 0xFF) {
        throw new Error('Invalid JPEG file: Missing JPEG magic signature');
      }
    } else if (mimeType === 'image/webp') {
      const riff = buffer.subarray(0, 4).toString('ascii');
      const webp = buffer.length >= 12 ? buffer.subarray(8, 12).toString('ascii') : '';
      if (riff !== 'RIFF' || webp !== 'WEBP') {
        throw new Error('Invalid WebP file: Missing WebP magic signature');
      }
    } else if (mimeType === 'text/plain') {
      for (let i = 0; i < Math.min(buffer.length, 512); i++) {
        if (buffer[i] === 0x00) {
          throw new Error('Invalid text file: Binary data detected');
        }
      }
    }
  }
}
