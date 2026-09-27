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
};

const schema = z.object({
  kind: z.enum(["avatar", "gallery"]),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
});

// Returns a short-lived S3 PUT URL the browser uploads to directly, plus the key
// the client then saves to the profile (avatarKey) or gallery.
uploadsRoutes.post("/uploads/presign", auth, async (c) => {
  const { memberId } = currentUser(c);
  if (!mediaConfigured()) return c.json({ error: "unavailable", message: "Depolama yapılandırılmadı" }, 503);
  const { kind, contentType } = schema.parse(await c.req.json());
  const key = `${kind}/${memberId}/${randomUUID()}.${EXT[contentType]}`;
  const uploadUrl = await presignPut(key, contentType);
  return c.json({ uploadUrl, key });
});
