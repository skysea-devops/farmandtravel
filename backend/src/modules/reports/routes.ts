// Kullanıcı şikayet/bildirim sistemi. Üyeler bir başkasını (profil veya mesajlaşma
// üzerinden) bildirir; şikayetler admin panelinde incelenir ve kapatılır.
import { Hono } from "hono";
import { z } from "zod";
import { query } from "../../shared/db/pool.js";
import { auth, currentUser, requireAdmin } from "../../shared/http/auth.js";

export const reportsRoutes = new Hono();

const createSchema = z.object({
  reportedId: z.string().uuid(),
  reason: z.string().min(3).max(2000),
  context: z.enum(["profile", "message"]).optional(),
});

// Üye: bir başkasını bildir.
reportsRoutes.post("/reports", auth, async (c) => {
  const { memberId } = currentUser(c);
  const { reportedId, reason, context } = createSchema.parse(await c.req.json());
  if (reportedId === memberId) return c.json({ error: "self", message: "Kendini bildiremezsin" }, 400);
  const exists = await query("SELECT 1 FROM members WHERE id=$1 AND is_official=false", [reportedId]);
  if (!exists.rowCount) return c.json({ error: "not_found", message: "Üye bulunamadı" }, 404);
  await query(
    "INSERT INTO reports (reporter_id, reported_id, context, reason) VALUES ($1,$2,$3,$4)",
    [memberId, reportedId, context ?? null, reason.trim()],
  );
  return c.json({ ok: true });
});

// Admin: açık (çözülmemiş) şikayetler — taraf isimleriyle.
reportsRoutes.get("/admin/reports", auth, requireAdmin, async (c) => {
  const onlyOpen = c.req.query("all") !== "1";
  const rows = await query<{
    id: string; context: string | null; reason: string; handled: boolean; created_at: string;
    reporter_id: string; reporter_name: string | null;
    reported_id: string; reported_name: string | null;
  }>(
    `SELECT r.id, r.context, r.reason, r.handled, r.created_at,
            r.reporter_id, rp.first_name AS reporter_name,
            r.reported_id, rd.first_name AS reported_name
       FROM reports r
       LEFT JOIN members rp ON rp.id = r.reporter_id
       LEFT JOIN members rd ON rd.id = r.reported_id
      ${onlyOpen ? "WHERE r.handled = false" : ""}
      ORDER BY r.handled ASC, r.created_at DESC
      LIMIT 300`,
  );
  const open = await query<{ n: number }>("SELECT count(*)::int AS n FROM reports WHERE handled=false");
  return c.json({
    open: open.rows[0]?.n ?? 0,
    reports: rows.rows.map((r) => ({
      id: r.id,
      context: r.context,
      reason: r.reason,
      handled: r.handled,
      createdAt: r.created_at,
      reporterId: r.reporter_id,
      reporterName: r.reporter_name,
      reportedId: r.reported_id,
      reportedName: r.reported_name,
    })),
  });
});

// Admin: şikayeti çöz (kapat).
reportsRoutes.post("/admin/reports/:id/resolve", auth, requireAdmin, async (c) => {
  const r = await query("UPDATE reports SET handled=true WHERE id=$1 RETURNING id", [c.req.param("id")]);
  if (!r.rowCount) return c.json({ error: "not_found" }, 404);
  return c.json({ ok: true });
});
