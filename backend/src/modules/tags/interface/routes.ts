import { Hono } from "hono";
import { z } from "zod";
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
