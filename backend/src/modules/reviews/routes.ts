import { Hono } from "hono";
import { z } from "zod";
import { query } from "../../shared/db/pool.js";
import { auth, currentUser, requireAdmin, requireMembership } from "../../shared/http/auth.js";
import { safeUrl } from "../../shared/media/s3.js";
import { isProfane } from "../../shared/text/profanity.js";
import { notify } from "../notifications/service.js";
import { isUuid } from "../../shared/validation.js";
import { reqLang } from "../../shared/http/lang.js";
import { translateFields } from "../../shared/text/translate.js";

export const reviewsRoutes = new Hono();

async function accepted(a: string, b: string): Promise<boolean> {
  const r = await query(
    `SELECT 1 FROM connections
      WHERE status='accepted'
        AND ((requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1))
      LIMIT 1`,
    [a, b],
  );
  return (r.rowCount ?? 0) > 0;
}

// Create my review of a member (only if we have an accepted connection).
// ONE-TIME: a review can't be edited once given (admin moderation would be
// meaningless if it could change afterwards). A second attempt is rejected.
// Publishing pipeline: 5 stars + clean comment -> auto (reveals on reciprocity or
// after 15 days); 4 stars or below, or a profane comment -> held for admin.
const schema = z.object({
  revieweeId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
reviewsRoutes.post("/reviews", auth, requireMembership, async (c) => {
  const { memberId } = currentUser(c);
  const { revieweeId, rating, comment } = schema.parse(await c.req.json());
  if (revieweeId === memberId) return c.json({ error: "invalid" }, 400);
  if (!(await accepted(memberId, revieweeId))) {
    return c.json({ error: "forbidden", message: "Yalnızca bağlantı kurduğun kişileri değerlendirebilirsin" }, 403);
  }

  const flagged = isProfane(comment);
  const moderation = rating <= 4 || flagged ? "held" : "auto";

  // ON CONFLICT DO NOTHING + RETURNING: a row comes back only on a fresh insert.
  // No row => a review already exists => reject (one-time, race-safe).
  const ins = await query<{ id: string }>(
    `INSERT INTO reviews (reviewer_id, reviewee_id, rating, comment, moderation, flagged)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (reviewer_id, reviewee_id) DO NOTHING
       RETURNING id`,
    [memberId, revieweeId, rating, comment ?? null, moderation, flagged],
  );
  if (!ins.rows[0]) {
    return c.json({ error: "already_reviewed", message: "Bu üyeyi zaten değerlendirdin; değerlendirme değiştirilemez." }, 409);
  }
  // Only ping the reviewee for reviews that are (or may become) visible to them.
  if (moderation === "auto") await notify(revieweeId, memberId, "review", {});
  return c.json({ ok: true, status: moderation === "held" ? "held" : "pending" });
});

// My own reviews: received (about me, only the visible ones) + written (all mine,
// each tagged with its publishing state so I can see what's pending/held).
reviewsRoutes.get("/reviews/me", auth, requireMembership, async (c) => {
  const { memberId } = currentUser(c);

  const recv = await query<{
    rating: number; comment: string | null; createdAt: string;
    otherId: string; firstName: string | null; avatarKey: string | null;
  }>(
    `SELECT r.rating, r.comment, r.created_at AS "createdAt",
            o.id AS "otherId", o.first_name AS "firstName", o.avatar_key AS "avatarKey"
       FROM visible_reviews r JOIN members o ON o.id = r.reviewer_id
      WHERE r.reviewee_id = $1
      ORDER BY r.created_at DESC`,
    [memberId],
  );
  const sent = await query<{
    rating: number; comment: string | null; createdAt: string; moderation: string;
    windowPassed: boolean; reciprocal: boolean;
    otherId: string; firstName: string | null; avatarKey: string | null;
  }>(
    `SELECT r.rating, r.comment, r.created_at AS "createdAt", r.moderation,
            (now() >= r.created_at + interval '15 days') AS "windowPassed",
            EXISTS (SELECT 1 FROM reviews r2
                     WHERE r2.reviewer_id = r.reviewee_id AND r2.reviewee_id = r.reviewer_id
                       AND r2.moderation <> 'rejected') AS "reciprocal",
            o.id AS "otherId", o.first_name AS "firstName", o.avatar_key AS "avatarKey"
       FROM reviews r JOIN members o ON o.id = r.reviewee_id
      WHERE r.reviewer_id = $1
      ORDER BY r.created_at DESC`,
    [memberId],
  );
  // Reviews written about me that aren't visible yet because I haven't reciprocated.
  const pend = await query<{ n: number }>(
    `SELECT count(*)::int AS n
       FROM reviews r
      WHERE r.reviewee_id = $1 AND r.moderation = 'auto'
        AND now() < r.created_at + interval '15 days'
        AND NOT EXISTS (SELECT 1 FROM reviews r2
                         WHERE r2.reviewer_id = $1 AND r2.reviewee_id = r.reviewer_id)`,
    [memberId],
  );

  const received = await Promise.all(
    recv.rows.map(async (r) => ({
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      reviewer: { id: r.otherId, firstName: r.firstName, avatarUrl: await safeUrl(r.avatarKey) },
    })),
  );
  const written = await Promise.all(
    sent.rows.map(async (r) => {
      let state: "published" | "held" | "pending" | "rejected";
      if (r.moderation === "rejected") state = "rejected";
      else if (r.moderation === "held") state = "held";
      else if (r.moderation === "approved") state = "published";
      else state = r.reciprocal || r.windowPassed ? "published" : "pending";
      return {
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        state,
        reviewee: { id: r.otherId, firstName: r.firstName, avatarUrl: await safeUrl(r.avatarKey) },
      };
    }),
  );
  const count = received.length;
  const avg = count ? Math.round((received.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;

  const lang = reqLang(c);
  await translateFields(received, ["comment"], lang);
  await translateFields(written, ["comment"], lang);

  return c.json({
    received: { summary: { avg, count }, reviews: received },
    written,
    pendingReceived: Number(pend.rows[0]?.n ?? 0),
  });
});

// Public reviews for a member: only the visible ones (+ summary over visible).
// My own review of them is returned separately so I can always see/edit it.
reviewsRoutes.get("/members/:id/reviews", auth, requireMembership, async (c) => {
  const { memberId } = currentUser(c);
  const id = c.req.param("id");
  if (!isUuid(id)) return c.json({ error: "not_found", message: "Üye bulunamadı" }, 404);

  const rows = await query<{
    rating: number; comment: string | null; createdAt: string;
    reviewerId: string; firstName: string | null; avatarKey: string | null;
  }>(
    `SELECT r.rating, r.comment, r.created_at AS "createdAt",
            o.id AS "reviewerId", o.first_name AS "firstName", o.avatar_key AS "avatarKey"
       FROM visible_reviews r JOIN members o ON o.id = r.reviewer_id
      WHERE r.reviewee_id = $1
      ORDER BY r.created_at DESC`,
    [id],
  );
  const reviews = await Promise.all(
    rows.rows.map(async (r) => ({
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      reviewer: { id: r.reviewerId, firstName: r.firstName, avatarUrl: await safeUrl(r.avatarKey) },
    })),
  );
  const count = reviews.length;
  const avg = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;

  // My existing review of this member (from base table, any state) for editing.
  const mineRow = await query<{ rating: number; comment: string | null; moderation: string }>(
    `SELECT rating, comment, moderation FROM reviews WHERE reviewer_id=$1 AND reviewee_id=$2`,
    [memberId, id],
  );
  const mine = mineRow.rows[0];
  const myReview = mine ? { rating: mine.rating, comment: mine.comment, state: mine.moderation } : null;

  // English site: translate others' comments (my own stays as I wrote it).
  const lang = reqLang(c);
  await translateFields(reviews, ["comment"], lang);

  return c.json({
    summary: { avg, count },
    reviews,
    canReview: await accepted(memberId, id),
    myReview,
  });
});

// Admin: queue of reviews held for moderation (low rating or profane comment).
reviewsRoutes.get("/admin/reviews", auth, requireAdmin, async (c) => {
  const rows = await query<{
    id: string; rating: number; comment: string | null; flagged: boolean; createdAt: string;
    reviewerId: string; reviewerName: string | null;
    revieweeId: string; revieweeName: string | null;
  }>(
    `SELECT r.id, r.rating, r.comment, r.flagged, r.created_at AS "createdAt",
            rv.id AS "reviewerId", rv.first_name AS "reviewerName",
            re.id AS "revieweeId", re.first_name AS "revieweeName"
       FROM reviews r
       JOIN members rv ON rv.id = r.reviewer_id
       JOIN members re ON re.id = r.reviewee_id
      WHERE r.moderation = 'held'
      ORDER BY r.created_at ASC`,
  );
  return c.json({ reviews: rows.rows });
});

// Admin: approve a held review -> it becomes visible immediately.
reviewsRoutes.post("/admin/reviews/:id/approve", auth, requireAdmin, async (c) => {
  const { memberId } = currentUser(c);
  const id = c.req.param("id");
  const note = (await c.req.json().catch(() => ({}))) as { note?: string };
  const r = await query<{ reviewer_id: string; reviewee_id: string }>(
    `UPDATE reviews SET moderation='approved', admin_note=$2, moderated_at=now(), moderated_by=$3
      WHERE id=$1 AND moderation='held'
      RETURNING reviewer_id, reviewee_id`,
    [id, note.note ?? null, memberId],
  );
  const row = r.rows[0];
  if (!row) return c.json({ error: "not_found" }, 404);
  await notify(row.reviewee_id, row.reviewer_id, "review", {});
  return c.json({ ok: true });
});

// Admin: reject a held review -> never visible.
reviewsRoutes.post("/admin/reviews/:id/reject", auth, requireAdmin, async (c) => {
  const { memberId } = currentUser(c);
  const id = c.req.param("id");
  const note = (await c.req.json().catch(() => ({}))) as { note?: string };
  const r = await query(
    `UPDATE reviews SET moderation='rejected', admin_note=$2, moderated_at=now(), moderated_by=$3
      WHERE id=$1 AND moderation='held'
      RETURNING id`,
    [id, note.note ?? null, memberId],
  );
  if (!r.rows[0]) return c.json({ error: "not_found" }, 404);
  return c.json({ ok: true });
});
