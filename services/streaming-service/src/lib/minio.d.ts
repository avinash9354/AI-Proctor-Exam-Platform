import * as Minio from 'minio';
export declare const minioClient: Minio.Client;
export declare function ensureBuckets(): Promise<void>;
export declare function uploadChunk(bucket: string, objectName: string, data: Buffer, mimeType: string): Promise<string>;
export declare function getSignedUrl(bucket: string, objectName: string, expirySeconds?: number): Promise<string>;
//# sourceMappingURL=minio.d.ts.map