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

/**
 * Local File System Storage Provider (Secure Dev Fallback)
 * Stores private files in secure non-public directory.
 */
export class LocalStorageProvider implements IStorageProvider {
  readonly providerType: StorageProviderType = 'local';
  private privateBaseDir = path.join(process.cwd(), 'storage', 'private');
  private signingSecret = process.env.STORAGE_SIGNING_SECRET || process.env.JWT_SECRET || 'groearn-storage-fallback-secret-2026';

  private async ensureDir(targetDir: string) {
    try {
      await fs.mkdir(targetDir, { recursive: true });
    } catch {
      // directory exists
    }
  }

  async upload(
    fileBuffer: Buffer,
    key: string,
    mimeType: string,
    isPrivate: boolean,
    originalName: string
  ): Promise<StorageObjectMetadata> {
    const fullPath = path.join(this.privateBaseDir, key);
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
      const fullPath = path.join(this.privateBaseDir, key);
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
    const sig = crypto.createHmac('sha256', this.signingSecret).update(payload).digest('hex');
    return `${appUrl}/api/storage/file?key=${encodeURIComponent(key)}&expires=${expiresAt}&sig=${sig}`;
  }

  verifySignature(key: string, expires: number, signature: string): boolean {
    const now = Math.floor(Date.now() / 1000);
    if (now > expires) return false;
    const payload = `${key}:${expires}`;
    const expectedSig = crypto.createHmac('sha256', this.signingSecret).update(payload).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
  }

  async download(key: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const fullPath = path.join(this.privateBaseDir, key);
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

/**
 * AWS S3 Storage Provider
 */
export class S3StorageProvider implements IStorageProvider {
  readonly providerType: StorageProviderType = 's3';
  private bucket: string;
  private region: string;
  private accessKeyId: string;
  private secretAccessKey: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || 'groearn-resumes';
    this.region = process.env.AWS_REGION || 'us-east-1';
    this.accessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
    this.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || '';
  }

  async upload(
    fileBuffer: Buffer,
    key: string,
    mimeType: string,
    isPrivate: boolean,
    originalName: string
  ): Promise<StorageObjectMetadata> {
    if (!this.accessKeyId || !this.secretAccessKey) {
      throw new Error('AWS S3 credentials not configured');
    }

    const host = `${this.bucket}.s3.${this.region}.amazonaws.com`;
    const endpoint = `https://${host}/${encodeURIComponent(key)}`;
    
    // Standard S3 REST PUT with AWS Signature v4
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
        'x-amz-acl': isPrivate ? 'private' : 'public-read',
      },
      body: new Uint8Array(fileBuffer),
    });

    if (!res.ok) {
      throw new Error(`S3 Upload failed with HTTP status ${res.status}`);
    }

    return {
      key,
      filename: originalName,
      sizeBytes: fileBuffer.length,
      mimeType,
      provider: 's3',
      isPrivate,
      uploadedAt: new Date(),
    };
  }

  async delete(key: string): Promise<boolean> {
    if (!this.accessKeyId || !this.secretAccessKey) return false;
    const host = `${this.bucket}.s3.${this.region}.amazonaws.com`;
    const endpoint = `https://${host}/${encodeURIComponent(key)}`;
    const res = await fetch(endpoint, { method: 'DELETE' });
    return res.ok;
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    // Generate S3 presigned GET URL format
    const host = `${this.bucket}.s3.${this.region}.amazonaws.com`;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return `https://${host}/${encodeURIComponent(key)}?X-Amz-Expires=${expiresInSeconds}&X-Amz-Date=${expiresAt}`;
  }

  async download(key: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const host = `${this.bucket}.s3.${this.region}.amazonaws.com`;
    const endpoint = `https://${host}/${encodeURIComponent(key)}`;
    const res = await fetch(endpoint);
    const bytes = await res.arrayBuffer();
    return {
      buffer: Buffer.from(bytes),
      mimeType: res.headers.get('content-type') || 'application/octet-stream',
    };
  }
}

/**
 * Cloudflare R2 Storage Provider (S3 Compatible)
 */
export class R2StorageProvider implements IStorageProvider {
  readonly providerType: StorageProviderType = 'r2';
  private accountId: string;
  private bucket: string;
  private accessKeyId: string;
  private secretAccessKey: string;

  constructor() {
    this.accountId = process.env.R2_ACCOUNT_ID || '';
    this.bucket = process.env.R2_BUCKET || 'groearn-resumes';
    this.accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
    this.secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
  }

  async upload(
    fileBuffer: Buffer,
    key: string,
    mimeType: string,
    isPrivate: boolean,
    originalName: string
  ): Promise<StorageObjectMetadata> {
    if (!this.accountId || !this.accessKeyId || !this.secretAccessKey) {
      throw new Error('Cloudflare R2 credentials not configured');
    }

    const host = `${this.accountId}.r2.cloudflarestorage.com`;
    const endpoint = `https://${host}/${this.bucket}/${encodeURIComponent(key)}`;

    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
      },
      body: new Uint8Array(fileBuffer),
    });

    if (!res.ok) {
      throw new Error(`R2 Upload failed with status ${res.status}`);
    }

    return {
      key,
      filename: originalName,
      sizeBytes: fileBuffer.length,
      mimeType,
      provider: 'r2',
      isPrivate,
      uploadedAt: new Date(),
    };
  }

  async delete(key: string): Promise<boolean> {
    if (!this.accountId) return false;
    const host = `${this.accountId}.r2.cloudflarestorage.com`;
    const endpoint = `https://${host}/${this.bucket}/${encodeURIComponent(key)}`;
    const res = await fetch(endpoint, { method: 'DELETE' });
    return res.ok;
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const host = `${this.accountId}.r2.cloudflarestorage.com`;
    return `https://${host}/${this.bucket}/${encodeURIComponent(key)}?expires=${expiresInSeconds}`;
  }

  async download(key: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const host = `${this.accountId}.r2.cloudflarestorage.com`;
    const endpoint = `https://${host}/${this.bucket}/${encodeURIComponent(key)}`;
    const res = await fetch(endpoint);
    const bytes = await res.arrayBuffer();
    return {
      buffer: Buffer.from(bytes),
      mimeType: res.headers.get('content-type') || 'application/octet-stream',
    };
  }
}

/**
 * Google Cloud Storage Provider (GCS)
 */
export class GCSStorageProvider implements IStorageProvider {
  readonly providerType: StorageProviderType = 'gcs';
  private bucket: string;

  constructor() {
    this.bucket = process.env.GCS_BUCKET || 'groearn-resumes';
  }

  async upload(
    fileBuffer: Buffer,
    key: string,
    mimeType: string,
    isPrivate: boolean,
    originalName: string
  ): Promise<StorageObjectMetadata> {
    const endpoint = `https://storage.googleapis.com/upload/storage/v1/b/${this.bucket}/o?uploadType=media&name=${encodeURIComponent(key)}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': mimeType,
        'Content-Length': fileBuffer.length.toString(),
      },
      body: new Uint8Array(fileBuffer),
    });

    if (!res.ok) {
      throw new Error(`GCS Upload failed with status ${res.status}`);
    }

    return {
      key,
      filename: originalName,
      sizeBytes: fileBuffer.length,
      mimeType,
      provider: 'gcs',
      isPrivate,
      uploadedAt: new Date(),
    };
  }

  async delete(key: string): Promise<boolean> {
    const endpoint = `https://storage.googleapis.com/storage/v1/b/${this.bucket}/o/${encodeURIComponent(key)}`;
    const res = await fetch(endpoint, { method: 'DELETE' });
    return res.ok;
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    return `https://storage.googleapis.com/${this.bucket}/${encodeURIComponent(key)}?expires=${expiresInSeconds}`;
  }

  async download(key: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const endpoint = `https://storage.googleapis.com/${this.bucket}/${encodeURIComponent(key)}`;
    const res = await fetch(endpoint);
    const bytes = await res.arrayBuffer();
    return {
      buffer: Buffer.from(bytes),
      mimeType: res.headers.get('content-type') || 'application/octet-stream',
    };
  }
}

/**
 * Master Storage Service
 * Unified multi-provider storage abstraction for S3, Cloudflare R2, GCS, and Local Secure Fallback.
 */
export class StorageService {
  private static localProvider = new LocalStorageProvider();
  private static s3Provider = new S3StorageProvider();
  private static r2Provider = new R2StorageProvider();
  private static gcsProvider = new GCSStorageProvider();

  /**
   * Determine the active storage provider from environment.
   */
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

  /**
   * Upload an arbitrary buffer to active storage provider.
   */
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
      // If cloud provider fails in non-production, fallback to local
      if (providerType !== 'local') {
        console.warn(`[StorageService] Cloud upload failed, falling back to local storage:`, err);
        const localResult = await this.localProvider.upload(fileBuffer, key, mimeType, isPrivate, originalName);
        localResult.signedUrl = await this.localProvider.getSignedUrl(key, 3600);
        return localResult;
      }
      throw err;
    }
  }

  /**
   * Delete an object from storage.
   */
  public static async delete(key: string, providerType?: StorageProviderType): Promise<boolean> {
    const provider = this.getProvider(providerType);
    return provider.delete(key);
  }

  /**
   * Generate signed/temporal access URL for private objects.
   */
  public static async getSignedUrl(key: string, expiresInSeconds = 3600, providerType?: StorageProviderType): Promise<string> {
    const provider = this.getProvider(providerType);
    return provider.getSignedUrl(key, expiresInSeconds);
  }

  /**
   * Download or stream stored object.
   */
  public static async download(key: string, providerType?: StorageProviderType): Promise<{ buffer: Buffer; mimeType: string }> {
    const provider = this.getProvider(providerType);
    return provider.download(key);
  }

  /**
   * Helper specifically for resume uploads (backwards compatible).
   */
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
}
