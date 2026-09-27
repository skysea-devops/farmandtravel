import { Hono } from "hono";
import { z } from "zod";
import { query } from "../../shared/db/pool.js";
import { auth, currentUser } from "../../shared/http/auth.js";

export const messagesRoutes = new Hono();

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
messagesRoutes.get("/messages", auth, async (c) => {
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
  const conversations = r.rows.map((row: Record<string, unknown>) => ({
    connectionId: row.connectionId,
    member: row.member,
    lastBody: row.lastBody ?? null,
    lastAt: row.lastAt ?? null,
    lastSender: row.lastSender ?? null,
    unread: Number(row.unread ?? 0),
  }));
  return c.json({ conversations });
});

// Thread: messages of a connection. Marks incoming messages read.
messagesRoutes.get("/messages/:connectionId", auth, async (c) => {
  const { memberId } = currentUser(c);
  const cid = c.req.param("connectionId");
  const other = cid ? await participant(memberId, cid) : null;
  if (!other) return c.json({ error: "not_found", message: "Sohbet bulunamadı" }, 404);

  await query(
    `UPDATE messages SET read_at=now()
      WHERE connection_id=$1 AND sender_id<>$2 AND read_at IS NULL`,
    [cid, memberId],
  );

  const r = await query(
    `SELECT id, sender_id AS "senderId", body, created_at AS "createdAt"
       FROM messages WHERE connection_id=$1 ORDER BY created_at ASC`,
    [cid],
  );
  const om = await query(
    `SELECT id, first_name AS "firstName", country, city, headline, avatar_key AS "avatarKey"
       FROM members WHERE id=$1`,
    [other],
  );
  return c.json({ connectionId: cid, me: memberId, other: om.rows[0] ?? null, messages: r.rows });
});

// Send a message.
const sendSchema = z.object({ body: z.string().min(1).max(4000) });
messagesRoutes.post("/messages/:connectionId", auth, async (c) => {
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
  return c.json(r.rows[0]);
});
