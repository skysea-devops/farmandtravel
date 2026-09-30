import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { z } from "zod";
import { auth, currentUser } from "../../../shared/http/auth.js";
import { query } from "../../../shared/db/pool.js";
import { safeUrl, deleteObject } from "../../../shared/media/s3.js";
import { Forbidden } from "../../../shared/errors/index.js";
import { MemberRepositoryPg } from "../infrastructure/MemberRepositoryPg.js";
import { GetMyProfile, SaveOnboardingDraft, UpdateProfile } from "../application/profile.js";

// Uploaded keys are minted as `${kind}/${memberId}/${uuid}.ext` by /uploads/presign.
// Before we store a key against a member we re-check the prefix so nobody can attach
// (and later delete) another member's S3 object by passing a foreign key.
function assertOwnsKey(memberId: string, kind: "avatar" | "gallery", key: string) {
  if (!key.startsWith(`${kind}/${memberId}/`)) throw Forbidden("Bu dosya sana ait değil");
}

const repo = new MemberRepositoryPg();
const getMyProfile = new GetMyProfile(repo);
const saveDraft = new SaveOnboardingDraft(repo);
const updateProfile = new UpdateProfile(repo);

export const membersRoutes = new Hono();

export interface MemberPhoto {
  id: string;
  caption: string | null;
  url: string | null;
}
export async function loadPhotos(memberId: string): Promise<MemberPhoto[]> {
  const r = await query<{ id: string; s3_key: string; caption: string | null }>(
    "SELECT id, s3_key, caption FROM member_photos WHERE member_id=$1 ORDER BY sort, created_at",
    [memberId],
  );
  return Promise.all(
    r.rows.map(async (p) => ({ id: p.id, caption: p.caption, url: await safeUrl(p.s3_key) })),
  );
}

// Onboarding anketi taslağını kaydet (O1)
const draftSchema = z.object({ draft: z.record(z.unknown()) });
membersRoutes.post("/onboarding/draft", auth, async (c) => {
  const { memberId } = currentUser(c);
  const { draft } = draftSchema.parse(await c.req.json());
  await saveDraft.execute(memberId, draft);
  return c.json({ ok: true });
});

// Kendi profilim (owner projection)
membersRoutes.get("/profile/me", auth, async (c) => {
  const { memberId, isAdmin } = currentUser(c);
  const me = await getMyProfile.execute(memberId);
  const [avatarUrl, photos] = await Promise.all([safeUrl(me.avatarKey), loadPhotos(memberId)]);
  return c.json({ ...me, avatarUrl, photos, isAdmin });
});

// Gallery: add a photo (key comes from a prior /uploads/presign upload).
const addPhotoSchema = z.object({ key: z.string().min(1), caption: z.string().max(300).optional() });
membersRoutes.post("/profile/photos", auth, async (c) => {
  const { memberId } = currentUser(c);
  const { key, caption } = addPhotoSchema.parse(await c.req.json());
  assertOwnsKey(memberId, "gallery", key);
  const count = await query<{ n: string }>(
    "SELECT count(*)::int AS n FROM member_photos WHERE member_id=$1",
    [memberId],
  );
  if (Number(count.rows[0]?.n ?? 0) >= 12) {
    return c.json({ error: "limit", message: "En fazla 12 fotoğraf ekleyebilirsin" }, 400);
  }
  const r = await query<{ id: string; s3_key: string; caption: string | null }>(
    "INSERT INTO member_photos (id, member_id, s3_key, caption) VALUES ($1,$2,$3,$4) RETURNING id, s3_key, caption",
    [randomUUID(), memberId, key, caption ?? null],
  );
  const p = r.rows[0]!;
  return c.json({ id: p.id, caption: p.caption, url: await safeUrl(p.s3_key) });
});

// Gallery: delete a photo (own only) + remove the S3 object.
membersRoutes.delete("/profile/photos/:id", auth, async (c) => {
  const { memberId } = currentUser(c);
  const id = c.req.param("id");
  const r = await query<{ s3_key: string }>(
    "DELETE FROM member_photos WHERE id=$1 AND member_id=$2 RETURNING s3_key",
    [id, memberId],
  );
  if (!r.rowCount) return c.json({ error: "not_found" }, 404);
  try { await deleteObject(r.rows[0]!.s3_key); } catch { /* ignore */ }
  return c.json({ ok: true });
});

// Profil oluştur/güncelle (O3)
const profileSchema = z.object({
  firstName: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  city: z.string().optional(),
  languages: z.array(z.string()).optional(),
  headline: z.string().optional(),
  bio: z.string().max(2000).optional(),
  avatarKey: z.string().optional(),
  lastName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  phone: z.string().optional(),
  socials: z.record(z.unknown()).optional(),
  employer: z.string().optional(),
  addressExact: z.string().optional(),
  profile: z.record(z.unknown()).optional(),
});
membersRoutes.put("/profile", auth, async (c) => {
  const { memberId } = currentUser(c);
  const patch = profileSchema.parse(await c.req.json());
  if (patch.avatarKey) assertOwnsKey(memberId, "avatar", patch.avatarKey);
  const updated = await updateProfile.execute(memberId, patch);
  return c.json(updated);
});
