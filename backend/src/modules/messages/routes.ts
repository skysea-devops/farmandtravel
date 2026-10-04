import { Hono } from "hono";
import { z } from "zod";
import { query } from "../../shared/db/pool.js";
import { auth, currentUser, requireAdmin, requireMembership } from "../../shared/http/auth.js";
import { safeUrl } from "../../shared/media/s3.js";
import { notify } from "../notifications/service.js";
import { broadcast, messageMember, getOfficialId } from "./official.js";
import { reqLang } from "../../shared/http/lang.js";
import { translateFields } from "../../shared/text/translate.js";

export const messagesRoutes = new Hono();

// Admin: broadcast a message from the official "Toprakla Yeniden" account to everyone.
const broadcastSchema = z.object({ body: z.string().min(1).max(4000) });
messagesRoutes.post("/admin/broadcast", auth, requireAdmin, async (c) => {
  const { body } = broadcastSchema.parse(await c.req.json());
  const recipients = await broadcast(body);
  return c.json({ ok: true, recipients });
});

// Admin: search members by name/email to pick a recipient.
messagesRoutes.get("/admin/members", auth, requireAdmin, async (c) => {
  const q = (c.req.query("q") ?? "").trim();
  if (q.length < 2) return c.json({ members: [] });
  const r = await query<{ id: string; first_name: string | null; last_name: string | null; city: string | null; country: string | null }>(
    `SELECT id, first_name, last_name, city, country FROM members
      WHERE is_official = false AND status <> 'deleted'
        AND (first_name ILIKE $1 OR last_name ILIKE $1 OR contact_email ILIKE $1)
      ORDER BY first_name NULLS LAST LIMIT 20`,
    [`%${q}%`],
  );
  return c.json({
    members: r.rows.map((m) => ({
      id: m.id,
      firstName: m.first_name,
      lastName: m.last_name,
      city: m.city,
      country: m.country,
    })),
  });
});

// Admin: message a single member from the official account (no connection needed).
const dmSchema = z.object({ memberId: z.string().uuid(), body: z.string().min(1).max(4000) });
messagesRoutes.post("/admin/message", auth, requireAdmin, async (c) => {
  const { memberId, body } = dmSchema.parse(await c.req.json());
  const connectionId = await messageMember(memberId, body);
  return c.json({ ok: true, connectionId });
});

// Admin: inbox of the official "Toprakla Yeniden" account — every thread with real
// activity (more than the auto welcome message), so admins see what they sent and the
// members' replies. Replies come in through the same messages table.
messagesRoutes.get("/admin/inbox", auth, requireAdmin, async (c) => {
  const off = await getOfficialId();
  if (!off) return c.json({ conversations: [] });
  const r = await query(
    `SELECT c.id AS "connectionId",
            json_build_object('id', o.id, 'firstName', o.first_name, 'lastName', o.last_name,
                              'city', o.city, 'country', o.country, 'avatarKey', o.avatar_key) AS member,
            lm.body AS "lastBody", lm.created_at AS "lastAt", lm.sender_id AS "lastSender",
            COALESCE(u.n, 0) AS "unread"
       FROM connections c
       JOIN members o ON o.id = CASE WHEN c.requester_id=$1 THEN c.addressee_id ELSE c.requester_id END
       LEFT JOIN LATERAL (
         SELECT body, created_at, sender_id FROM messages
          WHERE connection_id=c.id ORDER BY created_at DESC LIMIT 1
       ) lm ON true
       LEFT JOIN LATERAL (
         SELECT count(*)::int AS n FROM messages
          WHERE connection_id=c.id AND sender_id<>$1 AND read_at IS NULL
       ) u ON true
      WHERE (c.requester_id=$1 OR c.addressee_id=$1) AND c.status='accepted'
        AND (SELECT count(*) FROM messages m2 WHERE m2.connection_id=c.id) > 1
      ORDER BY lm.created_at DESC NULLS LAST`,
    [off],
  );
  const conversations = await Promise.all(
    r.rows.map(async (row: Record<string, unknown>) => {
      const member = row.member as { avatarKey?: string | null };
      return {
        connectionId: row.connectionId,
        member: { ...member, avatarUrl: await safeUrl(member?.avatarKey) },
        lastBody: row.lastBody ?? null,
        lastAt: row.lastAt ?? null,
        lastSender: row.lastSender ?? null,
        unread: Number(row.unread ?? 0),
      };
    }),
  );
  return c.json({ conversations });
});

// Admin: one official thread — marks the member's messages read, returns the exchange.
messagesRoutes.get("/admin/inbox/:connectionId", auth, requireAdmin, async (c) => {
  const off = await getOfficialId();
  const cid = c.req.param("connectionId");
  const other = off && cid ? await participant(off, cid) : null;
  if (!off || !other) return c.json({ error: "not_found", message: "Sohbet bulunamadı" }, 404);

  await query(
    `UPDATE messages SET read_at=now()
      WHERE connection_id=$1 AND sender_id<>$2 AND read_at IS NULL`,
    [cid, off],
  );
  const r = await query(
    `SELECT id, sender_id AS "senderId", body, created_at AS "createdAt"
       FROM messages WHERE connection_id=$1 ORDER BY created_at ASC`,
    [cid],
  );
  const om = await query<{ avatarKey: string | null }>(
    `SELECT id, first_name AS "firstName", last_name AS "lastName", country, city, avatar_key AS "avatarKey"
       FROM members WHERE id=$1`,
    [other],
  );
  const member = om.rows[0] ? { ...om.rows[0], avatarUrl: await safeUrl(om.rows[0].avatarKey) } : null;
  return c.json({ connectionId: cid, officialId: off, member, messages: r.rows });
});

// Admin: reply from the official account in an existing thread.
messagesRoutes.post("/admin/inbox/:connectionId", auth, requireAdmin, async (c) => {
  const off = await getOfficialId();
  const cid = c.req.param("connectionId");
  const other = off && cid ? await participant(off, cid) : null;
  if (!off || !other) return c.json({ error: "not_found", message: "Sohbet bulunamadı" }, 404);
  const { body } = sendSchema.parse(await c.req.json());
  const r = await query(
    `INSERT INTO messages (connection_id, sender_id, body) VALUES ($1,$2,$3)
      RETURNING id, sender_id AS "senderId", body, created_at AS "createdAt"`,
    [cid, off, body],
  );
  await notify(other, off, "message", { connectionId: cid });
  return c.json(r.rows[0]);
});

// Returns the other member id if `me` is part of this ACCEPTED connection, else null.
async function participant(me: string, connectionId: string): Promise<string | null> {
  const r = await query<{ other: string }>(
    `SELECT CASE WHEN requester_id=$1 THEN addressee_id ELSE requester_id END AS other
       FROM connections
      WHERE id=$2 AND status='accepted' AND (requester_id=$1 OR addressee_id=$1)`,
    [me, connectionId],
  );
  return r.rows[0]?.other ?? null;
}

// Conversation list: accepted connections + last message + unread count.
messagesRoutes.get("/messages", auth, requireMembership, async (c) => {
  const { memberId } = currentUser(c);
  const r = await query(
    `SELECT c.id AS "connectionId",
            json_build_object('id', o.id, 'firstName', o.first_name, 'country', o.country,
                              'city', o.city, 'headline', o.headline, 'avatarKey', o.avatar_key) AS member,
            lm.body AS "lastBody", lm.created_at AS "lastAt", lm.sender_id AS "lastSender",
            COALESCE(u.n, 0) AS "unread"
       FROM connections c
       JOIN members o ON o.id = CASE WHEN c.requester_id=$1 THEN c.addressee_id ELSE c.requester_id END
       LEFT JOIN LATERAL (
         SELECT body, created_at, sender_id FROM messages
          WHERE connection_id=c.id ORDER BY created_at DESC LIMIT 1
       ) lm ON true
       LEFT JOIN LATERAL (
         SELECT count(*)::int AS n FROM messages
          WHERE connection_id=c.id AND sender_id<>$1 AND read_at IS NULL
       ) u ON true
      WHERE (c.requester_id=$1 OR c.addressee_id=$1) AND c.status='accepted'
      ORDER BY lm.created_at DESC NULLS LAST`,
    [memberId],
  );
  const conversations = await Promise.all(
    r.rows.map(async (row: Record<string, unknown>) => {
      const member = row.member as { avatarKey?: string | null };
      return {
        connectionId: row.connectionId,
        member: { ...member, avatarUrl: await safeUrl(member?.avatarKey) },
        lastBody: row.lastBody ?? null,
        lastAt: row.lastAt ?? null,
        lastSender: row.lastSender ?? null,
        unread: Number(row.unread ?? 0),
      };
    }),
  );
  await translateFields(conversations, ["lastBody"], reqLang(c));
  return c.json({ conversations });
});

// Thread: messages of a connection. Marks incoming messages read.
messagesRoutes.get("/messages/:connectionId", auth, requireMembership, async (c) => {
  const { memberId } = currentUser(c);
  const cid = c.req.param("connectionId");
  const other = cid ? await participant(memberId, cid) : null;
  if (!other) return c.json({ error: "not_found", message: "Sohbet bulunamadı" }, 404);

  await query(
    `UPDATE messages SET read_at=now()
      WHERE connection_id=$1 AND sender_id<>$2 AND read_at IS NULL`,
    [cid, memberId],
  );

  // Paginated so a long conversation never loads thousands of rows:
  //   (default)        → latest PAGE messages + hasMore
  //   ?before=<ISO>    → the PAGE older than that cursor (load-older)
  //   ?after=<ISO>     → only messages newer than that cursor (lightweight poll)
  const PAGE = 50;
  const after = c.req.query("after");
  const before = c.req.query("before");
  let messages: unknown[];
  let hasMore = false;

  if (after) {
    const r = await query(
      `SELECT id, sender_id AS "senderId", body, created_at AS "createdAt"
         FROM messages WHERE connection_id=$1 AND created_at > $2
        ORDER BY created_at ASC LIMIT 200`,
      [cid, after],
    );
    messages = r.rows;
  } else {
    const r = await query(
      `SELECT id, sender_id AS "senderId", body, created_at AS "createdAt"
         FROM messages WHERE connection_id=$1 ${before ? "AND created_at < $3" : ""}
        ORDER BY created_at DESC LIMIT $2`,
      before ? [cid, PAGE + 1, before] : [cid, PAGE + 1],
    );
    hasMore = r.rows.length > PAGE;
    messages = r.rows.slice(0, PAGE).reverse(); // oldest→newest for display
  }

  // Other-member info only on the first/older page (not every poll).
  let otherRow = null;
  if (!after) {
    const om = await query<{ avatarKey: string | null }>(
      `SELECT id, first_name AS "firstName", country, city, headline, avatar_key AS "avatarKey"
         FROM members WHERE id=$1`,
      [other],
    );
    otherRow = om.rows[0] ? { ...om.rows[0], avatarUrl: await safeUrl(om.rows[0].avatarKey) } : null;
  }
  await translateFields(messages as Record<string, unknown>[], ["body"], reqLang(c));
  return c.json({ connectionId: cid, me: memberId, other: otherRow, messages, hasMore });
});

// Send a message.
const sendSchema = z.object({ body: z.string().min(1).max(4000) });
messagesRoutes.post("/messages/:connectionId", auth, requireMembership, async (c) => {
  const { memberId } = currentUser(c);
  const cid = c.req.param("connectionId");
  const other = cid ? await participant(memberId, cid) : null;
  if (!other) return c.json({ error: "not_found", message: "Sohbet bulunamadı" }, 404);
  const { body } = sendSchema.parse(await c.req.json());
  const r = await query(
    `INSERT INTO messages (connection_id, sender_id, body) VALUES ($1,$2,$3)
      RETURNING id, sender_id AS "senderId", body, created_at AS "createdAt"`,
    [cid, memberId, body],
  );
  await notify(other, memberId, "message", { connectionId: cid });
  return c.json(r.rows[0]);
});
