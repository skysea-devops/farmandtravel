import { Hono } from "hono";
import { z } from "zod";
import { query } from "../../shared/db/pool.js";
import { auth, currentUser } from "../../shared/http/auth.js";
import { safeUrl } from "../../shared/media/s3.js";

export const savedRoutes = new Hono();

const schema = z.object({ memberId: z.string().uuid() });

savedRoutes.post("/saved", auth, async (c) => {
  const { memberId } = currentUser(c);
  const { memberId: target } = schema.parse(await c.req.json());
  if (target === memberId) return c.json({ error: "invalid" }, 400);
  await query(
    "INSERT INTO saved_members (saver_id, saved_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
    [memberId, target],
  );
  return c.json({ saved: true });
});

savedRoutes.delete("/saved/:memberId", auth, async (c) => {
  const { memberId } = currentUser(c);
  await query("DELETE FROM saved_members WHERE saver_id=$1 AND saved_id=$2", [memberId, c.req.param("memberId")]);
  return c.json({ saved: false });
});

// Saved members as cards.
savedRoutes.get("/saved", auth, async (c) => {
  const { memberId } = currentUser(c);
  const r = await query<{
    id: string; firstName: string | null; country: string | null; city: string | null;
    headline: string | null; avatarKey: string | null;
    tags: { axis: string; value: string; labelTr: string; labelEn: string }[];
  }>(
    `SELECT m.id, m.first_name AS "firstName", m.country, m.city, m.headline, m.avatar_key AS "avatarKey",
            COALESCE((
              SELECT json_agg(json_build_object('axis', mt.axis, 'value', mt.value,
                                                'labelTr', tx.label_tr, 'labelEn', tx.label_en))
                FROM member_tags mt LEFT JOIN taxonomy tx ON tx.axis=mt.axis AND tx.value=mt.value
               WHERE mt.member_id = m.id), '[]') AS tags
       FROM saved_members s JOIN members m ON m.id = s.saved_id
      WHERE s.saver_id = $1
      ORDER BY s.created_at DESC`,
    [memberId],
  );
  const members = await Promise.all(
    r.rows.map(async (m) => ({ ...m, avatarUrl: await safeUrl(m.avatarKey) })),
  );
  return c.json({ members });
});
