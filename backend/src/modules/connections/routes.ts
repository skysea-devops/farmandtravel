import { Hono } from "hono";
import { z } from "zod";
import { query } from "../../shared/db/pool.js";
import { auth, currentUser, requireMembership } from "../../shared/http/auth.js";
import { safeUrl } from "../../shared/media/s3.js";
import { notify } from "../notifications/service.js";

async function signMembers(rows: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
  return Promise.all(
    rows.map(async (r) => {
      const member = r.member as { avatarKey?: string | null } | null;
      return member ? { ...r, member: { ...member, avatarUrl: await safeUrl(member.avatarKey) } } : r;
    }),
  );
}

export const connectionsRoutes = new Hono();

interface ConnRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  message: string | null;
  created_at: string;
  responded_at: string | null;
}

// A member card (public) joined with their tags — reused for connection lists.
const MEMBER_JSON = `
  json_build_object(
    'id', o.id, 'firstName', o.first_name, 'country', o.country, 'city', o.city,
    'headline', o.headline, 'avatarKey', o.avatar_key,
    'tags', COALESCE((
      SELECT json_agg(json_build_object('axis', mt.axis, 'value', mt.value,
                                        'labelTr', tx.label_tr, 'labelEn', tx.label_en))
        FROM member_tags mt LEFT JOIN taxonomy tx ON tx.axis = mt.axis AND tx.value = mt.value
       WHERE mt.member_id = o.id), '[]')
  )`;

// --- Send a connection request ---
const createSchema = z.object({ toId: z.string().uuid(), message: z.string().max(500).optional() });
connectionsRoutes.post("/connections", auth, requireMembership, async (c) => {
  const { memberId } = currentUser(c);
  const { toId, message } = createSchema.parse(await c.req.json());
  if (toId === memberId) return c.json({ error: "invalid", message: "Kendine istek gönderemezsin" }, 400);

  // Target must be a real, usable member (not official/deleted/suspended).
  const tgt = await query<{ status: string }>("SELECT status FROM members WHERE id=$1 AND is_official=false", [toId]);
  const ts = tgt.rows[0]?.status;
  if (!ts || !["active", "profile_complete"].includes(ts)) {
    return c.json({ error: "not_found", message: "Üye bulunamadı" }, 404);
  }

  // Race-safe: insert directly, relying on the unordered unique pair index. If two
  // cross requests arrive at once, one inserts and the other hits the conflict and
  // reads the existing row instead of 500ing.
  const ins = await query<ConnRow>(
    `INSERT INTO connections (requester_id, addressee_id, message) VALUES ($1,$2,$3)
       ON CONFLICT (LEAST(requester_id, addressee_id), GREATEST(requester_id, addressee_id)) DO NOTHING
       RETURNING *`,
    [memberId, toId, message ?? null],
  );
  if (ins.rows[0]) {
    await notify(toId, memberId, "connection_request", { connectionId: ins.rows[0].id });
    return c.json({ status: "pending", connectionId: ins.rows[0].id, direction: "outgoing" });
  }

  // Conflict → a connection already exists; return its current state.
  const existing = await query<ConnRow>(
    `SELECT * FROM connections
      WHERE (requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1)
      LIMIT 1`,
    [memberId, toId],
  );
  const r = existing.rows[0];
  if (!r) return c.json({ error: "conflict", message: "İstek işlenemedi" }, 409);
  return c.json({ status: r.status, connectionId: r.id, direction: r.requester_id === memberId ? "outgoing" : "incoming" });
});

// --- My connections: incoming pending, outgoing pending, accepted (with contact) ---
connectionsRoutes.get("/connections", auth, requireMembership, async (c) => {
  const { memberId } = currentUser(c);

  const incoming = await query(
    `SELECT c.id AS "connectionId", c.message, c.created_at AS "createdAt", ${MEMBER_JSON} AS member
       FROM connections c JOIN members o ON o.id = c.requester_id
      WHERE c.addressee_id = $1 AND c.status = 'pending'
      ORDER BY c.created_at DESC`,
    [memberId],
  );
  const outgoing = await query(
    `SELECT c.id AS "connectionId", c.created_at AS "createdAt", ${MEMBER_JSON} AS member
       FROM connections c JOIN members o ON o.id = c.addressee_id
      WHERE c.requester_id = $1 AND c.status = 'pending'
      ORDER BY c.created_at DESC`,
    [memberId],
  );
  const accepted = await query(
    `SELECT c.id AS "connectionId", c.responded_at AS "since",
            ${MEMBER_JSON} AS member,
            json_build_object('lastName', o.last_name, 'contactEmail', o.contact_email,
                              'phone', o.phone, 'socials', o.socials, 'employer', o.employer,
                              'addressExact', o.address_exact) AS contact
       FROM connections c
       JOIN members o ON o.id = CASE WHEN c.requester_id = $1 THEN c.addressee_id ELSE c.requester_id END
      WHERE (c.requester_id = $1 OR c.addressee_id = $1) AND c.status = 'accepted'
      ORDER BY c.responded_at DESC NULLS LAST`,
    [memberId],
  );

  return c.json({
    incoming: await signMembers(incoming.rows),
    outgoing: await signMembers(outgoing.rows),
    accepted: await signMembers(accepted.rows),
  });
});

async function respond(memberId: string, id: string, status: "accepted" | "rejected") {
  const r = await query<ConnRow>(
    `UPDATE connections SET status=$3, responded_at=now()
      WHERE id=$1 AND addressee_id=$2 AND status='pending' RETURNING *`,
    [id, memberId, status],
  );
  return r.rowCount ? r.rows[0]! : null;
}

connectionsRoutes.post("/connections/:id/accept", auth, requireMembership, async (c) => {
  const { memberId } = currentUser(c);
  const id = c.req.param("id");
  const updated = id ? await respond(memberId, id, "accepted") : null;
  if (!updated) return c.json({ error: "not_found", message: "İstek bulunamadı" }, 404);
  await notify(updated.requester_id, memberId, "connection_accepted", { connectionId: updated.id });
  return c.json({ status: "accepted", connectionId: updated.id });
});

connectionsRoutes.post("/connections/:id/reject", auth, requireMembership, async (c) => {
  const { memberId } = currentUser(c);
  const id = c.req.param("id");
  const updated = id ? await respond(memberId, id, "rejected") : null;
  if (!updated) return c.json({ error: "not_found", message: "İstek bulunamadı" }, 404);
  return c.json({ status: "rejected", connectionId: updated.id });
});
