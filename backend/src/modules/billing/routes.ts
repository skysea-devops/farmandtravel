import crypto from "node:crypto";
import { Hono } from "hono";
import { z } from "zod";
import { auth, currentUser } from "../../shared/http/auth.js";
import { query } from "../../shared/db/pool.js";
import { env } from "../../shared/config/env.js";
import { billingConfigured, checkoutUrl, marketOfVariant, type Market } from "./service.js";

export const billingRoutes = new Hono();

// Start a subscription checkout for the current member. `market` decides the price
// ($20 tr / $40 intl); the frontend passes it based on the domain.
const checkoutSchema = z.object({ market: z.enum(["tr", "intl"]).optional() });
billingRoutes.post("/billing/checkout", auth, async (c) => {
  const { memberId } = currentUser(c);
  if (!billingConfigured()) return c.json({ error: "unavailable", message: "Ödeme yakında" }, 503);
  const { market } = checkoutSchema.parse(await c.req.json().catch(() => ({})));
  const m = await query<{ contact_email: string | null }>(
    "SELECT contact_email FROM members WHERE id=$1",
    [memberId],
  );
  try {
    const url = checkoutUrl(memberId, m.rows[0]?.contact_email ?? null, (market ?? "tr") as Market);
    return c.json({ url });
  } catch {
    return c.json({ error: "checkout_failed", message: "Ödeme başlatılamadı" }, 502);
  }
});

// Lemon Squeezy webhook (public route). Verifies the HMAC-SHA256 signature over the
// raw body, then keeps subscriptions + members.plan in sync. Frontier (free-forever)
// members are never downgraded.
billingRoutes.post("/webhooks/lemonsqueezy", async (c) => {
  const secret = env.LS_WEBHOOK_SECRET;
  if (!secret) return c.json({ error: "unconfigured" }, 503);

  const raw = await c.req.text();
  const sig = c.req.header("x-signature") ?? "";
  const digest = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(digest);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return c.json({ error: "bad_signature" }, 401);
  }

  let evt: any;
  try { evt = JSON.parse(raw); } catch { return c.json({ error: "bad_json" }, 400); }

  const event = evt?.meta?.event_name as string | undefined;
  const data = evt?.data;
  if (!event || !data || !event.startsWith("subscription_")) return c.json({ ok: true });

  const attrs = data.attributes ?? {};
  const lsSubId = String(data.id);
  const status = String(attrs.status ?? "");
  const variant = attrs.variant_id != null ? String(attrs.variant_id) : null;
  const customer = attrs.customer_id != null ? String(attrs.customer_id) : null;
  const market = marketOfVariant(variant);

  // Resolve the member: custom_data.member_id from checkout, else an existing row.
  let mid = (evt?.meta?.custom_data?.member_id as string | undefined) ?? null;
  if (!mid) {
    const found = await query<{ member_id: string }>(
      "SELECT member_id FROM subscriptions WHERE ls_subscription_id=$1",
      [lsSubId],
    );
    mid = found.rows[0]?.member_id ?? null;
  }
  if (!mid) return c.json({ ok: true }); // can't map — ignore

  await query(
    `INSERT INTO subscriptions
       (member_id, provider, ls_subscription_id, ls_customer_id, ls_variant_id, status, market, renews_at, ends_at, updated_at)
     VALUES ($1,'lemonsqueezy',$2,$3,$4,$5,$6,$7,$8, now())
     ON CONFLICT (ls_subscription_id) DO UPDATE SET
       status=EXCLUDED.status, ls_customer_id=EXCLUDED.ls_customer_id, ls_variant_id=EXCLUDED.ls_variant_id,
       market=EXCLUDED.market, renews_at=EXCLUDED.renews_at, ends_at=EXCLUDED.ends_at, updated_at=now()`,
    [mid, lsSubId, customer, variant, status, market, attrs.renews_at ?? null, attrs.ends_at ?? null],
  );

  // 'cancelled' stays active until the period ends (LS sends 'expired' later).
  const active = ["active", "on_trial", "past_due", "cancelled"].includes(status);
  await query("UPDATE members SET plan=$2 WHERE id=$1 AND plan <> 'frontier'", [mid, active ? "active" : "none"]);

  return c.json({ ok: true });
});
