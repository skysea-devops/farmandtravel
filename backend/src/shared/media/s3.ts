// S3 media helpers: presigned PUT for direct browser upload, presigned GET for
// display. The media bucket is private; URLs are short-lived signed links.
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION ?? "eu-central-1";
const bucket = process.env.MEDIA_BUCKET ?? "";

let client: S3Client | null = null;
function s3(): S3Client {
  return (client ??= new S3Client({ region }));
}

export function mediaConfigured(): boolean {
  return Boolean(bucket);
}

export function presignPut(key: string, contentType: string, ttl = 300): Promise<string> {
  return getSignedUrl(s3(), new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }), {
    expiresIn: ttl,
  });
}

export function presignGet(key: string, ttl = 3600): Promise<string> {
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: ttl });
}

export async function deleteObject(key: string): Promise<void> {
  await s3().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

// Best-effort presign; returns null on missing key or any error (never blocks a list).
export async function safeUrl(key: string | null | undefined): Promise<string | null> {
  if (!key || !bucket) return null;
  try {
    return await presignGet(key);
  } catch {
    return null;
  }
}

// Add avatarUrl to an object that has avatarKey (leaves others untouched).
export async function withAvatarUrl<T extends { avatarKey?: string | null }>(o: T): Promise<T & { avatarUrl: string | null }> {
  return { ...o, avatarUrl: await safeUrl(o.avatarKey) };
}

export async function withAvatarUrls<T extends { avatarKey?: string | null }>(list: T[]): Promise<(T & { avatarUrl: string | null })[]> {
  return Promise.all(list.map(withAvatarUrl));
}
