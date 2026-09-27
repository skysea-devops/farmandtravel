import { Hono } from "hono";
import { z } from "zod";
import { query } from "../../shared/db/pool.js";
import { auth, currentUser } from "../../shared/http/auth.js";
import { safeUrl } from "../../shared/media/s3.js";

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

// Create/update my review of a member (only if we have an accepted connection).
const schema = z.object({
  revieweeId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
reviewsRoutes.post("/reviews", auth, async (c) => {
  const { memberId } = currentUser(c);
  const { revieweeId, rating, comment } = schema.parse(await c.req.json());
  if (revieweeId === memberId) return c.json({ error: "invalid" }, 400);
  if (!(await accepted(memberId, revieweeId))) {
    return c.json({ error: "forbidden", message: "Yalnızca bağlantı kurduğun kişileri değerlendirebilirsin" }, 403);
  }
  await query(
    `INSERT INTO reviews (reviewer_id, reviewee_id, rating, comment) VALUES ($1,$2,$3,$4)
       ON CONFLICT (reviewer_id, reviewee_id)
       DO UPDATE SET rating=EXCLUDED.rating, comment=EXCLUDED.comment, updated_at=now()`,
    [memberId, revieweeId, rating, comment ?? null],
  );
  return c.json({ ok: true });
});

// Reviews for a member + summary + whether I can review + my existing review.
reviewsRoutes.get("/members/:id/reviews", auth, async (c) => {
  const { memberId } = currentUser(c);
  const id = c.req.param("id");
  if (!id) return c.json({ error: "not_found" }, 404);

  const rows = await query<{
    rating: number; comment: string | null; createdAt: string;
    reviewerId: string; firstName: string | null; avatarKey: string | null;
  }>(
    `SELECT r.rating, r.comment, r.created_at AS "createdAt",
            o.id AS "reviewerId", o.first_name AS "firstName", o.avatar_key AS "avatarKey"
       FROM reviews r JOIN members o ON o.id = r.reviewer_id
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
  const mine = reviews.find((r) => r.reviewer.id === memberId) ?? null;
  const myReview = mine ? { rating: mine.rating, comment: mine.comment } : null;

  return c.json({
    summary: { avg, count },
    reviews,
    canReview: await accepted(memberId, id),
    myReview,
  });
});
