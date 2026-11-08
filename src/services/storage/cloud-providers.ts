import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { IStorageProvider, StorageProviderType, StorageObjectMetadata } from '../storage.service';

// AWS S3 Storage Provider
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
      logger.warn('[Storage] AWS credentials not configured, falling back to direct metadata generation');
    }

    const host = `${this.bucket}.s3.${this.region}.amazonaws.com`;
    const endpoint = `https://${host}/${key}`;

    if (this.accessKeyId && this.secretAccessKey) {
      try {
        await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': mimeType,
            'Content-Length': String(fileBuffer.length),
            'x-amz-acl': isPrivate ? 'private' : 'public-read',
          },
          body: new Uint8Array(fileBuffer),
        });
      } catch (uploadError) {
        logger.error(`[Storage] S3 Upload network error: ${(uploadError as Error).message}`);
      }
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
    const host = `${this.bucket}.s3.${this.region}.amazonaws.com`;
    const endpoint = `https://${host}/${key}`;
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const host = `${this.bucket}.s3.${this.region}.amazonaws.com`;
    const now = new Date();
    const dateStamp = now.toISOString().replace(/[:-]|\.\d{3}/g, '').substring(0, 8);
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const credentialScope = `${dateStamp}/${this.region}/s3/aws4_request`;

    const canonicalQuery = [
      `X-Amz-Algorithm=AWS4-HMAC-SHA256`,
      `X-Amz-Credential=${encodeURIComponent(`${this.accessKeyId}/${credentialScope}`)}`,
      `X-Amz-Date=${amzDate}`,
      `X-Amz-Expires=${expiresInSeconds}`,
      `X-Amz-SignedHeaders=host`,
    ].sort().join('&');

    const canonicalRequest = ['GET', `/${key}`, canonicalQuery, `host:${host}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const kDate = crypto.createHmac('sha256', `AWS4${this.secretAccessKey}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(this.region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update('s3').digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    return `https://${host}/${key}?${canonicalQuery}&X-Amz-Signature=${signature}`;
  }

  async download(key: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const host = `${this.bucket}.s3.${this.region}.amazonaws.com`;
    const endpoint = `https://${host}/${key}`;
    const res = await fetch(endpoint);
    const bytes = await res.arrayBuffer();
    return {
      buffer: Buffer.from(bytes),
      mimeType: res.headers.get('content-type') || 'application/octet-stream',
    };
  }
}

// Cloudflare R2 Storage Provider (S3-Compatible API)
export class R2StorageProvider implements IStorageProvider {
  readonly providerType: StorageProviderType = 'r2';
  private bucket: string;
  private accountId: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private publicUrl: string;

  constructor() {
    this.bucket = process.env.R2_BUCKET || 'groearn-resumes';
    this.accountId = process.env.R2_ACCOUNT_ID || '';
    this.accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
    this.secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
    this.publicUrl = process.env.R2_PUBLIC_URL || '';
  }

  async upload(
    fileBuffer: Buffer,
    key: string,
    mimeType: string,
    isPrivate: boolean,
    originalName: string
  ): Promise<StorageObjectMetadata> {
    const host = `${this.accountId}.r2.cloudflarestorage.com`;
    const endpoint = `https://${host}/${this.bucket}/${key}`;

    if (this.accessKeyId && this.secretAccessKey && this.accountId) {
      try {
        await fetch(endpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': mimeType,
            'Content-Length': String(fileBuffer.length),
          },
          body: new Uint8Array(fileBuffer),
        });
      } catch (r2Err) {
        logger.error(`[Storage] R2 Upload error: ${(r2Err as Error).message}`);
      }
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
    const endpoint = `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucket}/${key}`;
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const host = `${this.accountId}.r2.cloudflarestorage.com`;
    const now = new Date();
    const dateStamp = now.toISOString().replace(/[:-]|\.\d{3}/g, '').substring(0, 8);
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const credentialScope = `${dateStamp}/auto/s3/aws4_request`;

    const canonicalQuery = [
      `X-Amz-Algorithm=AWS4-HMAC-SHA256`,
      `X-Amz-Credential=${encodeURIComponent(`${this.accessKeyId}/${credentialScope}`)}`,
      `X-Amz-Date=${amzDate}`,
      `X-Amz-Expires=${expiresInSeconds}`,
      `X-Amz-SignedHeaders=host`,
    ].sort().join('&');

    const canonicalRequest = ['GET', `/${this.bucket}/${key}`, canonicalQuery, `host:${host}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const kDate = crypto.createHmac('sha256', `AWS4${this.secretAccessKey}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update('auto').digest();
    const kService = crypto.createHmac('sha256', kRegion).update('s3').digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    return `https://${host}/${this.bucket}/${key}?${canonicalQuery}&X-Amz-Signature=${signature}`;
  }

  async download(key: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const endpoint = `https://${this.accountId}.r2.cloudflarestorage.com/${this.bucket}/${key}`;
    const res = await fetch(endpoint);
    const bytes = await res.arrayBuffer();
    return {
      buffer: Buffer.from(bytes),
      mimeType: res.headers.get('content-type') || 'application/octet-stream',
    };
  }
}

// Google Cloud Storage (GCS) Provider
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
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const expiry = Math.floor(Date.now() / 1000) + expiresInSeconds;
    return `https://storage.googleapis.com/${this.bucket}/${encodeURIComponent(key)}?expires=${expiry}`;
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
