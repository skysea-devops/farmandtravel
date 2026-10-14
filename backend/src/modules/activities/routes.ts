import { Hono } from "hono";
import { z } from "zod";
import { auth, currentUser, requireAdmin, requireMembership } from "../../shared/http/auth.js";
import { query } from "../../shared/db/pool.js";
import { safeUrl } from "../../shared/media/s3.js";
import { Forbidden, NotFound } from "../../shared/errors/index.js";
import { reqLang } from "../../shared/http/lang.js";
import { translateFields } from "../../shared/text/translate.js";

// Free-text fields of an activity DTO that get machine-translated on the English site.
// `author` is a person's name and `kind`/`date` are structural, so they're left as-is.
const ACTIVITY_TEXT = ["title", "desc", "place", "when"] as const;

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
  author_id: string | null;
  kind: string;
  title: string;
  description: string | null;
  image_key: string | null;
  image_url: string | null;
  youtube_id: string | null;
  author_name: string | null;
  place: string | null;
  event_at: string | null;
  event_date: string | null;
  online: boolean | null;
  status: string;
  pinned: boolean;
  created_at: string;
  published_at: string | null;
  access: string;
  section: string | null;
  duration_min: number | null;
  detail: string | null;
  link: string | null;
  participant_count?: number | string | null;
}

// viewerPaid: admin/frontier/active ise true. members içerik kilidi buna göre açılır.
// Kilitliyken youtubeId / detail / link gönderilmez (teaser sızdırmaz).
async function toDto(r: ActivityRow, viewerPaid: boolean) {
  const image = r.image_key ? await safeUrl(r.image_key) : r.image_url;
  const unlocked = r.access === "public" || viewerPaid;
  return {
    id: r.id,
    kind: r.kind,
    title: r.title,
    desc: r.description,
    image,
    access: r.access,
    section: r.section ?? (r.kind === "video" ? "knowledge" : r.kind === "photo" ? "member" : "announcements"),
    youtubeId: unlocked ? r.youtube_id : null,
    author: r.author_name,
    place: r.place,
    when: r.event_at,
    eventDate: r.event_date,
    past: r.event_date ? new Date(r.event_date).getTime() < Date.now() : false,
    online: r.online,
    pinned: r.pinned,
    status: r.status,
    date: r.published_at ?? r.created_at,
    durationMin: r.duration_min ?? null,
    participantCount: Number(r.participant_count ?? 0),
    locked: !unlocked,
    detail: unlocked ? r.detail : null,
    link: unlocked ? r.link : null,
  };
}

const COLS = `id, author_id, kind, title, description, image_key, image_url, youtube_id,
              author_name, place, event_at, event_date, online, status, pinned, created_at, published_at,
              access, section, duration_min, detail, link`;
const PCOUNT = `(SELECT count(*)::int FROM activity_participants ap WHERE ap.activity_id = activities.id) AS participant_count`;
const SELECT = `SELECT ${COLS}, ${PCOUNT} FROM activities`;

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
  const items = await Promise.all(rows.rows.map((r) => toDto(r, false)));
  await translateFields(items, ACTIVITY_TEXT, reqLang(c));
  return c.json({ items, total: Number(count.rows[0]?.n ?? 0) });
});

// --- Katıl / ayrıl (RSVP) — paralı üyelik gerekir. ---
activitiesRoutes.post("/activities/:id/join", auth, requireMembership, async (c) => {
  const { memberId } = currentUser(c);
  const id = c.req.param("id");
  const ok = await query<{ event_date: string | null }>("SELECT event_date FROM activities WHERE id=$1 AND status='published'", [id]);
  if (!ok.rowCount) throw NotFound("Aktivite bulunamadı");
  const ed = ok.rows[0]?.event_date;
  if (ed && new Date(ed).getTime() < Date.now()) return c.json({ error: "event_ended", message: "Bu etkinlik sona erdi." }, 400);
  await query("INSERT INTO activity_participants (activity_id, member_id) VALUES ($1,$2) ON CONFLICT DO NOTHING", [id, memberId]);
  const cnt = await query<{ n: string }>("SELECT count(*)::int AS n FROM activity_participants WHERE activity_id=$1", [id]);
  return c.json({ joined: true, participantCount: Number(cnt.rows[0]?.n ?? 0) });
});

activitiesRoutes.delete("/activities/:id/join", auth, requireMembership, async (c) => {
  const { memberId } = currentUser(c);
  const id = c.req.param("id");
  await query("DELETE FROM activity_participants WHERE activity_id=$1 AND member_id=$2", [id, memberId]);
  const cnt = await query<{ n: string }>("SELECT count(*)::int AS n FROM activity_participants WHERE activity_id=$1", [id]);
  return c.json({ joined: false, participantCount: Number(cnt.rows[0]?.n ?? 0) });
});

// --- Member: submit an activity (goes to the moderation queue as 'pending') ---
// Per-kind required fields so broken records (photo w/o image, video w/o id, …) can't
// be created. Common fields live in `base`.
const base = {
  title: z.string().min(3).max(140),
  desc: z.string().max(2000).optional(),
  place: z.string().max(120).optional(),
  access: z.enum(["public", "members"]).optional(), // yalnız admin public yapabilir
  section: z.enum(["meetups", "knowledge", "member", "announcements"]).optional(),
  detail: z.string().max(4000).optional(),          // katılım şartları / uzun açıklama
  link: z.string().max(500).optional(),             // kayıt/katılım linki
};
const submitSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("video"), youtubeId: z.string().min(1).max(20), durationMin: z.number().int().min(1).max(100000).optional(), ...base }),
  z.object({ kind: z.literal("photo"), imageKey: z.string().min(1).max(300), ...base }),
  z.object({ kind: z.literal("meeting"), when: z.string().max(120).optional(), eventDate: z.string().datetime().optional(), online: z.boolean().optional(), ...base }),
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
  const eventDate = "eventDate" in b ? b.eventDate : undefined;
  const durationMin = "durationMin" in b ? b.durationMin : undefined;
  // Yalnız admin bir içeriği "public" (ücretsiz/tanıtım) yapabilir; üye gönderileri members.
  const access = isAdmin ? (b.access ?? "members") : "members";
  // Bölüm: video için seçilir (meetups/knowledge), değilse türden türetilir.
  const section = b.section ?? (b.kind === "video" ? "knowledge" : b.kind === "photo" ? "member" : "announcements");
  if (imageKey && !imageKey.startsWith(`gallery/${memberId}/`)) throw Forbidden("Bu dosya sana ait değil");
  const name = await query<{ first_name: string | null }>("SELECT first_name FROM members WHERE id=$1", [memberId]);
  // Admins create & publish directly; members' submissions go to the approval queue.
  const status = isAdmin ? "published" : "pending";
  const publishedAt = isAdmin ? new Date().toISOString() : null;
  const r = await query<ActivityRow>(
    `INSERT INTO activities (author_id, author_name, kind, title, description, image_key, youtube_id, place, event_at, event_date, online, status, published_at, access, section, duration_min, detail, link)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING ${COLS}`,
    [memberId, name.rows[0]?.first_name ?? null, b.kind, b.title, b.desc ?? null, imageKey ?? null, youtubeId ?? null, b.place ?? null, when ?? null, eventDate ?? null, online ?? null, status, publishedAt, access, section, durationMin ?? null, b.detail ?? null, b.link ?? null],
  );
  return c.json(await toDto(r.rows[0]!, true));
});

// --- Member: my own submissions with their status ---
activitiesRoutes.get("/activities/mine", auth, requireMembership, async (c) => {
  const { memberId } = currentUser(c);
  const r = await query<ActivityRow>(`${SELECT} WHERE author_id=$1 ORDER BY created_at DESC`, [memberId]);
  const items = await Promise.all(r.rows.map((r) => toDto(r, true)));
  await translateFields(items, ACTIVITY_TEXT, reqLang(c));
  return c.json({ items });
});

// --- Admin: moderation queue (default: pending) ---
activitiesRoutes.get("/admin/activities", auth, requireAdmin, async (c) => {
  const status = c.req.query("status") ?? "pending";
  const r = await query<ActivityRow>(`${SELECT} WHERE status=$1 ORDER BY created_at DESC`, [status]);
  return c.json({ items: await Promise.all(r.rows.map((r) => toDto(r, true))) });
});

// --- Admin: approve (publish) / reject ---
activitiesRoutes.post("/admin/activities/:id/approve", auth, requireAdmin, async (c) => {
  const r = await query<ActivityRow>(
    `UPDATE activities SET status='published', published_at=now() WHERE id=$1 RETURNING ${COLS}`,
    [c.req.param("id")],
  );
  if (!r.rowCount) throw NotFound("Aktivite bulunamadı");
  return c.json(await toDto(r.rows[0]!, true));
});

activitiesRoutes.post("/admin/activities/:id/reject", auth, requireAdmin, async (c) => {
  const r = await query("UPDATE activities SET status='rejected' WHERE id=$1", [c.req.param("id")]);
  if (!r.rowCount) throw NotFound("Aktivite bulunamadı");
  return c.json({ ok: true });
});

// --- Detail (auth): public içerik herkese açık; members içerik yalnızca paralıya açılır. ---
// Statik /activities/* rotalarından (eligibility, mine) SONRA tanımlı ki onları gölgelemesin.
// Kilitliyse teaser + locked:true döner (frontend paywall gösterir), 403 değil.
activitiesRoutes.get("/activities/:id", auth, async (c) => {
  const { memberId, isAdmin, plan } = currentUser(c);
  const paid = isAdmin || plan === "frontier" || plan === "active";
  const r = await query<ActivityRow>(`${SELECT} WHERE id=$1`, [c.req.param("id")]);
  const row = r.rows[0];
  if (!row) throw NotFound("Aktivite bulunamadı");
  if (row.status !== "published" && row.author_id !== memberId && !isAdmin) throw NotFound("Aktivite bulunamadı");
  const dto = await toDto(row, paid);
  let joined = false;
  if (!dto.locked) {
    const j = await query("SELECT 1 FROM activity_participants WHERE activity_id=$1 AND member_id=$2", [row.id, memberId]);
    joined = (j.rowCount ?? 0) > 0;
  }
  const out = { ...dto, joined };
  await translateFields([out], [...ACTIVITY_TEXT, "detail"], reqLang(c));
  return c.json(out);
});
