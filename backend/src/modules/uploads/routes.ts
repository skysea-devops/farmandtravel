import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { z } from "zod";
import { auth, currentUser } from "../../shared/http/auth.js";
import { mediaConfigured, presignPut } from "../../shared/media/s3.js";

export const uploadsRoutes = new Hono();

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

// Boyut sınırı türe göre: görsel/belge 10 MB, video 2 GB (kendi barındırılan
// Akademi/seminer videoları; doğrudan S3'e PUT edilir, API Gateway'den geçmez).
const MAX_BY_KIND: Record<string, number> = {
  avatar: 10 * 1024 * 1024,
  gallery: 10 * 1024 * 1024,
  doc: 10 * 1024 * 1024,
  video: 2 * 1024 * 1024 * 1024,
};

// kind "doc": adres doğrulama belgesi, PDF de kabul edilir. kind "video": self-host video.
const schema = z.object({
  kind: z.enum(["avatar", "gallery", "doc", "video"]),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "application/pdf", "video/mp4", "video/webm", "video/quicktime"]),
  size: z.number().int().positive(),
});

// Returns a short-lived S3 PUT URL the browser uploads to directly, plus the key
// the client then saves to the profile (avatarKey) or gallery. The declared size is
// capped and signed into the URL so oversized bodies are rejected by S3.
uploadsRoutes.post("/uploads/presign", auth, async (c) => {
  const { memberId } = currentUser(c);
  if (!mediaConfigured()) return c.json({ error: "unavailable", message: "Depolama yapılandırılmadı" }, 503);
  const { kind, contentType, size } = schema.parse(await c.req.json());
  // Video yalnızca görsel-dışı tipleri, görseller yalnızca görsel tiplerini kabul etsin.
  const isVideoType = contentType.startsWith("video/");
  if ((kind === "video") !== isVideoType) return c.json({ error: "bad_type", message: "Dosya türü uyumsuz" }, 400);
  if (size > (MAX_BY_KIND[kind] ?? 10 * 1024 * 1024)) return c.json({ error: "too_large", message: "Dosya çok büyük" }, 400);
  const key = `${kind}/${memberId}/${randomUUID()}.${EXT[contentType]}`;
  const uploadUrl = await presignPut(key, contentType, size, kind === "video" ? 3600 : 300);
  return c.json({ uploadUrl, key });
});
