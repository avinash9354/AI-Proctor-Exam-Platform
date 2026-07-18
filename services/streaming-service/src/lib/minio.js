"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.minioClient = void 0;
exports.ensureBuckets = ensureBuckets;
exports.uploadChunk = uploadChunk;
exports.getSignedUrl = getSignedUrl;
const Minio = __importStar(require("minio"));
const logger_1 = require("../utils/logger");
exports.minioClient = new Minio.Client({
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
async function ensureBuckets() {
    try {
        for (const bucket of BUCKETS) {
            const exists = await exports.minioClient.bucketExists(bucket);
            if (!exists) {
                await exports.minioClient.makeBucket(bucket, 'us-east-1');
                logger_1.logger.info(`Created MinIO bucket: ${bucket}`);
            }
        }
    }
    catch (err) {
        logger_1.logger.warn('MinIO unavailable, running in local fallback storage mode');
    }
}
async function uploadChunk(bucket, objectName, data, mimeType) {
    try {
        await exports.minioClient.putObject(bucket, objectName, data, data.length, {
            'Content-Type': mimeType,
            'x-amz-server-side-encryption': 'AES256',
        });
    }
    catch {
        logger_1.logger.warn('MinIO unavailable, skipping chunk upload');
    }
    return `${bucket}/${objectName}`;
}
async function getSignedUrl(bucket, objectName, expirySeconds = 3600) {
    try {
        return await exports.minioClient.presignedGetObject(bucket, objectName, expirySeconds);
    }
    catch {
        return `http://localhost:9000/${bucket}/${objectName}`;
    }
}
//# sourceMappingURL=minio.js.map