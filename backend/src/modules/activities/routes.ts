import { Hono } from "hono";
import { z } from "zod";
import { auth, currentUser, requireAdmin, requireMembership } from "../../shared/http/auth.js";
import { query } from "../../shared/db/pool.js";
import { safeUrl } from "../../shared/media/s3.js";
import { Forbidden, NotFound } from "../../shared/errors/index.js";

export const activitiesRoutes = new Hono();

// To submit an activity a member must be an established, well-regarded member:
// enough accepted connections + a good rating from enough reviews.
const MIN_CONNECTIONS = 20;
const MIN_RATING = 4; // average, out of 5
const MIN_REVIEWS = 10;

async function eligibility(memberId: string) {
  const [conn, rev] = await Promise.all([
    query<{ n: string }>(
      "SELECT count(*)::int AS n FROM connections WHERE (requester_id=$1 OR addressee_id=$1) AND status='accepted'",
      [memberId],
    ),
    query<{ n: string; avg: string }>(
      "SELECT count(*)::int AS n, COALESCE(round(avg(rating)::numeric,1),0) AS avg FROM visible_reviews WHERE reviewee_id=$1",
      [memberId],
    ),
  ]);
  const connections = Number(conn.rows[0]?.n ?? 0);
  const ratingCount = Number(rev.rows[0]?.n ?? 0);
  const ratingAvg = Number(rev.rows[0]?.avg ?? 0);
  const eligible = connections >= MIN_CONNECTIONS && ratingCount >= MIN_REVIEWS && ratingAvg >= MIN_RATING;
  return {
    eligible,
    connections,
    ratingCount,
    ratingAvg,
    need: { connections: MIN_CONNECTIONS, reviews: MIN_REVIEWS, rating: MIN_RATING },
  };
}

// Frontend uses this to show requirements + enable/disable the submit form.
activitiesRoutes.get("/activities/eligibility", auth, requireMembership, async (c) => {
  const { memberId, isAdmin } = currentUser(c);
  const e = await eligibility(memberId);
  return c.json({ ...e, isAdmin, canSubmit: isAdmin || e.eligible });
});

interface ActivityRow {
  id: string;
  kind: string;
  title: string;
  description: string | null;
  image_key: string | null;
  image_url: string | null;
  youtube_id: string | null;
  author_name: string | null;
  place: string | null;
  event_at: string | null;
  online: boolean | null;
  status: string;
  pinned: boolean;
  created_at: string;
  published_at: string | null;
}

async function toDto(r: ActivityRow) {
  const image = r.image_key ? await safeUrl(r.image_key) : r.image_url;
  return {
    id: r.id,
    kind: r.kind,
    title: r.title,
    desc: r.description,
    image,
    youtubeId: r.youtube_id,
    author: r.author_name,
    place: r.place,
    when: r.event_at,
    online: r.online,
    pinned: r.pinned,
    status: r.status,
    date: r.published_at ?? r.created_at,
  };
}

const COLS = `id, kind, title, description, image_key, image_url, youtube_id,
              author_name, place, event_at, online, status, pinned, created_at, published_at`;
const SELECT = `SELECT ${COLS} FROM activities`;

// --- PUBLIC: published feed (pinned first, then newest). Paginated for the archive. ---
const limitSchema = z.coerce.number().int().min(1).max(50).catch(20);
const offsetSchema = z.coerce.number().int().min(0).catch(0);
activitiesRoutes.get("/activities", async (c) => {
  const limit = limitSchema.parse(c.req.query("limit"));
  const offset = offsetSchema.parse(c.req.query("offset"));
  const [rows, count] = await Promise.all([
    query<ActivityRow>(
      `${SELECT} WHERE status='published' ORDER BY pinned DESC, published_at DESC NULLS LAST LIMIT $1 OFFSET $2`,
      [limit, offset],
    ),
    query<{ n: string }>("SELECT count(*)::int AS n FROM activities WHERE status='published'"),
  ]);
  const items = await Promise.all(rows.rows.map(toDto));
  return c.json({ items, total: Number(count.rows[0]?.n ?? 0) });
});

// --- Member: submit an activity (goes to the moderation queue as 'pending') ---
// Per-kind required fields so broken records (photo w/o image, video w/o id, …) can't
// be created. Common fields live in `base`.
const base = {
  title: z.string().min(3).max(140),
  desc: z.string().max(2000).optional(),
  place: z.string().max(120).optional(),
};
const submitSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("video"), youtubeId: z.string().min(1).max(20), ...base }),
  z.object({ kind: z.literal("photo"), imageKey: z.string().min(1).max(300), ...base }),
  z.object({ kind: z.literal("meeting"), when: z.string().min(1).max(120), online: z.boolean().optional(), ...base }),
  z.object({ kind: z.literal("announcement"), ...base }),
]);
activitiesRoutes.post("/activities", auth, requireMembership, async (c) => {
  const { memberId, isAdmin } = currentUser(c);
  const b = submitSchema.parse(await c.req.json());
  if (!isAdmin) {
    const elig = await eligibility(memberId);
    if (!elig.eligible) {
      return c.json({ error: "not_eligible", message: "Aktivite paylaşmak için yeterli bağlantı, puan ve yorumun yok.", ...elig }, 403);
    }
  }
  // Pull kind-specific fields safely out of the narrowed union.
  const imageKey = "imageKey" in b ? b.imageKey : undefined;
  const youtubeId = "youtubeId" in b ? b.youtubeId : undefined;
  const when = "when" in b ? b.when : undefined;
  const online = "online" in b ? b.online : undefined;
  if (imageKey && !imageKey.startsWith(`gallery/${memberId}/`)) throw Forbidden("Bu dosya sana ait değil");
  const name = await query<{ first_name: string | null }>("SELECT first_name FROM members WHERE id=$1", [memberId]);
  // Admins create & publish directly; members' submissions go to the approval queue.
  const status = isAdmin ? "published" : "pending";
  const publishedAt = isAdmin ? new Date().toISOString() : null;
  const r = await query<ActivityRow>(
    `INSERT INTO activities (author_id, author_name, kind, title, description, image_key, youtube_id, place, event_at, online, status, published_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING ${COLS}`,
    [memberId, name.rows[0]?.first_name ?? null, b.kind, b.title, b.desc ?? null, imageKey ?? null, youtubeId ?? null, b.place ?? null, when ?? null, online ?? null, status, publishedAt],
  );
  return c.json(await toDto(r.rows[0]!));
});

// --- Member: my own submissions with their status ---
activitiesRoutes.get("/activities/mine", auth, requireMembership, async (c) => {
  const { memberId } = currentUser(c);
  const r = await query<ActivityRow>(`${SELECT} WHERE author_id=$1 ORDER BY created_at DESC`, [memberId]);
  return c.json({ items: await Promise.all(r.rows.map(toDto)) });
});

// --- Admin: moderation queue (default: pending) ---
activitiesRoutes.get("/admin/activities", auth, requireAdmin, async (c) => {
  const status = c.req.query("status") ?? "pending";
  const r = await query<ActivityRow>(`${SELECT} WHERE status=$1 ORDER BY created_at DESC`, [status]);
  return c.json({ items: await Promise.all(r.rows.map(toDto)) });
});

// --- Admin: approve (publish) / reject ---
activitiesRoutes.post("/admin/activities/:id/approve", auth, requireAdmin, async (c) => {
  const r = await query<ActivityRow>(
    `UPDATE activities SET status='published', published_at=now() WHERE id=$1 RETURNING ${COLS}`,
    [c.req.param("id")],
  );
  if (!r.rowCount) throw NotFound("Aktivite bulunamadı");
  return c.json(await toDto(r.rows[0]!));
});

activitiesRoutes.post("/admin/activities/:id/reject", auth, requireAdmin, async (c) => {
  const r = await query("UPDATE activities SET status='rejected' WHERE id=$1", [c.req.param("id")]);
  if (!r.rowCount) throw NotFound("Aktivite bulunamadı");
  return c.json({ ok: true });
});
