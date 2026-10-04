import { Hono } from "hono";
import { query } from "../../shared/db/pool.js";
import { auth, currentUser, requireMembership } from "../../shared/http/auth.js";
import { safeUrl } from "../../shared/media/s3.js";
import { reqLang, brandName } from "../../shared/http/lang.js";

export const notificationsRoutes = new Hono();

// List my notifications (newest first) with actor info; also mark them read.
notificationsRoutes.get("/notifications", auth, requireMembership, async (c) => {
  const { memberId } = currentUser(c);
  const lang = reqLang(c);
  const r = await query<{
    id: string; type: string; data: Record<string, unknown>; createdAt: string; readAt: string | null;
    actorId: string | null; actorName: string | null; actorAvatarKey: string | null; actorOfficial: boolean | null;
  }>(
    `SELECT n.id, n.type, n.data, n.created_at AS "createdAt", n.read_at AS "readAt",
            a.id AS "actorId", a.first_name AS "actorName", a.avatar_key AS "actorAvatarKey",
            a.is_official AS "actorOfficial"
       FROM notifications n LEFT JOIN members a ON a.id = n.actor_id
      WHERE n.user_id = $1
      ORDER BY n.created_at DESC
      LIMIT 50`,
    [memberId],
  );
  const items = await Promise.all(
    r.rows.map(async (n) => ({
      id: n.id,
      type: n.type,
      data: n.data,
      createdAt: n.createdAt,
      read: Boolean(n.readAt),
      actor: n.actorId
        ? { id: n.actorId, firstName: n.actorOfficial ? brandName(lang) : n.actorName, avatarUrl: await safeUrl(n.actorAvatarKey) }
        : null,
    })),
  );
  // Mark only the notifications we actually returned as read — not every unread row —
  // so unseen older ones (beyond this page of 50) aren't silently marked read.
  const ids = r.rows.map((n) => n.id);
  if (ids.length) {
    await query(
      "UPDATE notifications SET read_at=now() WHERE id = ANY($1::uuid[]) AND user_id=$2 AND read_at IS NULL",
      [ids, memberId],
    );
  }
  return c.json({ notifications: items });
});

// Unread count (for the bell badge).
notificationsRoutes.get("/notifications/unread", auth, requireMembership, async (c) => {
  const { memberId } = currentUser(c);
  const r = await query<{ n: string }>(
    "SELECT count(*)::int AS n FROM notifications WHERE user_id=$1 AND read_at IS NULL",
    [memberId],
  );
  return c.json({ unread: Number(r.rows[0]?.n ?? 0) });
});
