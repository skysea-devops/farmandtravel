// The official "Toprakla Yeniden" account: welcome message on signup + admin broadcasts.
// Reuses the normal connection+message model so these land in each member's Mesajlar.
import { query } from "../../shared/db/pool.js";

const WELCOME =
  "Aramıza hoş geldin! 🌱 Toprakla Yeniden topluluğuna katıldığın için çok mutluyuz. " +
  "Profilini tamamla, haritada çevreni keşfet ve sana uygun kişilerle bağlantı kur. " +
  "Aklına takılan olursa buradan bize yazabilirsin. İyi ki buradasın!";

let officialId: string | null = null;
async function getOfficialId(): Promise<string | null> {
  if (officialId) return officialId;
  const r = await query<{ id: string }>("SELECT id FROM members WHERE is_official=true LIMIT 1");
  officialId = r.rows[0]?.id ?? null;
  return officialId;
}

// Create the official↔member accepted connection + welcome message (once, on signup).
export async function provisionWelcome(memberId: string): Promise<void> {
  try {
    const off = await getOfficialId();
    if (!off || off === memberId) return;
    const conn = await query<{ id: string }>(
      `INSERT INTO connections (requester_id, addressee_id, status, responded_at)
       VALUES ($1,$2,'accepted',now()) RETURNING id`,
      [off, memberId],
    );
    const cid = conn.rows[0]!.id;
    await query("INSERT INTO messages (connection_id, sender_id, body) VALUES ($1,$2,$3)", [cid, off, WELCOME]);
    await query(
      "INSERT INTO notifications (user_id, actor_id, type, data) VALUES ($1,$2,'message',jsonb_build_object('connectionId',$3::text))",
      [memberId, off, cid],
    );
  } catch {
    /* best-effort: never block signup */
  }
}

// Broadcast a message from the official account to every (non-official) member.
// Ensures each member has an official thread, posts the message, and notifies. Returns
// the number of recipients.
export async function broadcast(body: string): Promise<number> {
  const off = await getOfficialId();
  if (!off) return 0;

  await query(
    `INSERT INTO connections (requester_id, addressee_id, status, responded_at)
     SELECT $1, m.id, 'accepted', now()
       FROM members m
      WHERE m.is_official = false
        AND NOT EXISTS (
          SELECT 1 FROM connections c
           WHERE (c.requester_id=$1 AND c.addressee_id=m.id) OR (c.requester_id=m.id AND c.addressee_id=$1)
        )`,
    [off],
  );
  const msg = await query(
    `INSERT INTO messages (connection_id, sender_id, body)
     SELECT c.id, $1, $2 FROM connections c
      WHERE (c.requester_id=$1 OR c.addressee_id=$1) AND c.status='accepted'
     RETURNING id`,
    [off, body],
  );
  await query(
    `INSERT INTO notifications (user_id, actor_id, type, data)
     SELECT CASE WHEN c.requester_id=$1 THEN c.addressee_id ELSE c.requester_id END, $1, 'message',
            jsonb_build_object('connectionId', c.id::text)
       FROM connections c
      WHERE (c.requester_id=$1 OR c.addressee_id=$1) AND c.status='accepted'`,
    [off],
  );
  return msg.rowCount ?? 0;
}
