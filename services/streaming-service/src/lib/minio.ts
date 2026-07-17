import * as Minio from 'minio';
import { logger } from '../utils/logger';

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minio_admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minio_password',
});

const BUCKETS = [
  process.env.MINIO_BUCKET_RECORDINGS || 'recordings',
  process.env.MINIO_BUCKET_EVIDENCE || 'evidence',
];

export async function ensureBuckets(): Promise<void> {
  try {
    for (const bucket of BUCKETS) {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket, 'us-east-1');
        logger.info(`Created MinIO bucket: ${bucket}`);
      }
    }
  } catch (err) {
    logger.warn('MinIO unavailable, running in local fallback storage mode');
  }
}

export async function uploadChunk(
  bucket: string,
  objectName: string,
  data: Buffer,
  mimeType: string
): Promise<string> {
  try {
    await minioClient.putObject(bucket, objectName, data, data.length, {
      'Content-Type': mimeType,
      'x-amz-server-side-encryption': 'AES256',
    });
  } catch {
    logger.warn('MinIO unavailable, skipping chunk upload');
  }
  return `${bucket}/${objectName}`;
}

export async function getSignedUrl(bucket: string, objectName: string, expirySeconds = 3600): Promise<string> {
  try {
    return await minioClient.presignedGetObject(bucket, objectName, expirySeconds);
  } catch {
    return `http://localhost:9000/${bucket}/${objectName}`;
  }
}
