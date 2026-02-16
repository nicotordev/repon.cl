/**
 * Cloudflare R2 storage service (S3-compatible API).
 * Used for product images and other uploads.
 */

import {
  PutObjectCommand,
  DeleteObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, ""); // sin trailing slash

function getClient(): S3Client | null {
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export function isR2Configured(): boolean {
  return Boolean(
    accountId && accessKeyId && secretAccessKey && bucketName && publicBaseUrl
  );
}

export function isAcceptedImageType(type: string): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(type as (typeof ACCEPTED_IMAGE_TYPES)[number]);
}

export function getAcceptedImageTypes(): string[] {
  return [...ACCEPTED_IMAGE_TYPES];
}

export function getMaxFileBytes(): number {
  return MAX_FILE_BYTES;
}

/**
 * Upload a product image to R2.
 * Key pattern: products/{storeId}/{productId}/{uuid}.{ext}
 * Returns the public URL of the uploaded object, or null if R2 is not configured or upload fails.
 */
export async function uploadProductImage(params: {
  storeId: string;
  productId: string;
  buffer: Buffer;
  contentType: string;
  originalFilename?: string;
}): Promise<string | null> {
  const client = getClient();
  if (!client || !publicBaseUrl) return null;

  const ext =
    params.contentType === "image/png"
      ? "png"
      : params.contentType === "image/webp"
        ? "webp"
        : params.contentType === "image/gif"
          ? "gif"
          : "jpg";
  const key = `products/${params.storeId}/${params.productId}/${randomUUID()}.${ext}`;

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: params.buffer,
        ContentType: params.contentType,
        CacheControl: "public, max-age=31536000",
      })
    );
    return `${publicBaseUrl}/${key}`;
  } catch (err) {
    console.error("[r2.service] uploadProductImage failed:", err);
    return null;
  }
}

/**
 * Delete an object from R2 by its public URL.
 * Extracts the key from the URL (path after public base).
 */
export async function deleteByPublicUrl(publicUrl: string): Promise<boolean> {
  const client = getClient();
  if (!client || !publicBaseUrl || !bucketName) return false;

  if (!publicUrl.startsWith(publicBaseUrl + "/")) return false;
  const key = publicUrl.slice(publicBaseUrl.length + 1);

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      })
    );
    return true;
  } catch (err) {
    console.error("[r2.service] deleteByPublicUrl failed:", err);
    return false;
  }
}
