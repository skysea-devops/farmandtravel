import { Hono } from "hono";
import { z } from "zod";
import { query } from "../../../shared/db/pool.js";
import { auth, currentUser } from "../../../shared/http/auth.js";
import { TaxonomyRepositoryPg } from "../infrastructure/TaxonomyRepositoryPg.js";
import { makeTagInferrer } from "../infrastructure/TagInferrer.js";
import { InferTags } from "../application/InferTags.js";
import { ConfirmTags } from "../application/ConfirmTags.js";
import { AXES, type Axis } from "../domain/types.js";

const taxonomyRepo = new TaxonomyRepositoryPg();
const inferTags = new InferTags(taxonomyRepo, makeTagInferrer());
const confirmTags = new ConfirmTags(taxonomyRepo);

export const tagsRoutes = new Hono();

// Aktif taksonomi (UI etiket seçici + admin için)
tagsRoutes.get("/taxonomy", async (c) => {
  const items = await taxonomyRepo.listActive();
  return c.json({ items });
});

const inferSchema = z.object({
  freeText: z.string().max(4000).default(""),
  quickPicks: z.array(z.string()).max(50).default([]),
});

// Serbest metinden AI etiket önerisi (onboarding O2)
tagsRoutes.post("/tags/infer", auth, async (c) => {
  const body = inferSchema.parse(await c.req.json());
  const { suggestions, taxonomy } = await inferTags.execute(body);
  return c.json({ suggestions, taxonomy });
});

const confirmSchema = z.object({
  tags: z
    .array(z.object({ axis: z.enum(AXES as [Axis, ...Axis[]]), value: z.string() }))
    .min(1),
});

// Onaylanan etiketleri yaz
tagsRoutes.post("/onboarding/tags/confirm", auth, async (c) => {
  const { memberId } = currentUser(c);
  const { tags } = confirmSchema.parse(await c.req.json());
  const res = await confirmTags.execute(memberId, tags);
  return c.json(res);
});

// Onboarding sonrası niyet güncelleme (ör. "gönüllü ağırlamak"ı sonradan açma).
// member_tags'i yeniden yazar. Üye YENİ yer sahibi oluyorsa (situation:farm-owner
// eklenmişse) adres/mekân doğrulaması için profili tekrar admin onayına düşürür.
tagsRoutes.post("/profile/intents", auth, async (c) => {
  const { memberId } = currentUser(c);
  const { tags } = confirmSchema.parse(await c.req.json());
  const before = await query<{ axis: string; value: string }>(
    "SELECT axis, value FROM member_tags WHERE member_id=$1", [memberId],
  );
  const wasPlaceOwner = before.rows.some((r) => r.axis === "situation" && r.value === "farm-owner");
  const res = await confirmTags.execute(memberId, tags);
  const nowPlaceOwner = tags.some((t) => t.axis === "situation" && t.value === "farm-owner");
  let review = false;
  if (nowPlaceOwner && !wasPlaceOwner) {
    const r = await query(
      "UPDATE members SET approved_at = NULL, updated_at = now() WHERE id=$1 AND is_official=false AND approved_at IS NOT NULL RETURNING id",
      [memberId],
    );
    review = (r.rowCount ?? 0) > 0;
  }
  return c.json({ ...res, review });
});
