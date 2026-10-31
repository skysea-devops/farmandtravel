import crypto from "node:crypto";
import { Hono } from "hono";
import { z } from "zod";
import { auth, currentUser } from "../../shared/http/auth.js";
import { query } from "../../shared/db/pool.js";
import { env } from "../../shared/config/env.js";
import { billingConfigured, checkoutUrl, marketOfPermalink, periodEnd, type Market } from "./service.js";

export const billingRoutes = new Hono();

// Üye için abonelik checkout'u başlat. `market` (tr/intl) hangi ürün olduğunu belirler;
// frontend domaine göre gönderir. Ödeme sıklığını (yıllık/3 aylık) müşteri Gumroad'da seçer.
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

// Gumroad webhook (public route). Gumroad imza (HMAC) sağlamaz ve kapalı VPC'den API'ye
// geri soramayız; bu yüzden Gumroad'a kaydedilen URL gizli bir token taşır (?token=...)
// ve burada sabit-zamanlı karşılaştırırız. Body application/x-www-form-urlencoded gelir.
// Hem satış/yenileme (account Ping) hem iptal/bitiş (resource subscription) olaylarını
// tolere eder; members.plan + subscriptions senkronda tutulur. Frontier hiç düşürülmez.
billingRoutes.post("/webhooks/gumroad", async (c) => {
  const expected = env.GUMROAD_WEBHOOK_TOKEN;
  if (!expected) return c.json({ error: "unconfigured" }, 503);
  const got = c.req.query("token") ?? "";
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return c.json({ error: "bad_token" }, 401);
  }

  const raw = await c.req.text();
  const p = new URLSearchParams(raw);
  const f = (k: string) => p.get(k);
  const isTrue = (k: string) => (f(k) ?? "").toLowerCase() === "true";

  const saleId = f("sale_id");
  const subId = f("subscription_id");
  const permalink = f("product_permalink") ?? f("permalink");
  const recurrence = f("recurrence");
  const market: Market = marketOfPermalink(permalink);

  // Üyeyi çöz: checkout'tan gelen url_params[member_id], yoksa mevcut abonelik, yoksa e-posta.
  let mid = f("url_params[member_id]");
  if (!mid && subId) {
    const r = await query<{ member_id: string }>(
      "SELECT member_id FROM subscriptions WHERE gumroad_subscription_id=$1",
      [subId],
    );
    mid = r.rows[0]?.member_id ?? null;
  }
  if (!mid) {
    const email = f("email");
    if (email) {
      const r = await query<{ id: string }>("SELECT id FROM members WHERE lower(contact_email)=lower($1) LIMIT 1", [email]);
      mid = r.rows[0]?.id ?? null;
    }
  }
  if (!mid) return c.json({ ok: true }); // eşleşmedi — sessizce geç

  // Olay türünü alanlardan türet:
  //  - bitiş: ended_at / ended_reason (resource subscription "subscription_ended")
  //  - iade/itiraz: refunded / disputed / chargebacked
  //  - iptal (dönem sonuna kadar aktif): cancelled / cancelled_at
  //  - aksi halde satış/yenileme (sale_id var)
  const ended = Boolean(f("ended_at") || f("ended_reason"));
  const refunded = isTrue("refunded") || isTrue("disputed") || isTrue("chargebacked");
  const cancelledAtPeriodEnd = (isTrue("cancelled") || Boolean(f("cancelled_at"))) && !ended && !refunded;

  let status: string;
  let endsAt: string | null = null;
  let active: boolean;

  if (ended || refunded) {
    status = refunded ? "refunded" : "expired";
    endsAt = new Date().toISOString();
    active = false;
  } else if (cancelledAtPeriodEnd) {
    // İptal edildi ama dönem sonuna kadar erişim sürer.
    status = "cancelled";
    active = true;
  } else if (saleId) {
    // Satış ya da yinelenen tahsilat → aktif, bitişi recurrence'dan hesapla.
    status = "active";
    endsAt = periodEnd(recurrence).toISOString();
    active = true;
  } else {
    return c.json({ ok: true }); // anlamlandırılamayan olay
  }

  await query(
    `INSERT INTO subscriptions
       (member_id, provider, gumroad_subscription_id, gumroad_sale_id, permalink, recurrence, status, market, ends_at, updated_at)
     VALUES ($1,'gumroad',$2,$3,$4,$5,$6,$7,$8, now())
     ON CONFLICT (gumroad_subscription_id) WHERE gumroad_subscription_id IS NOT NULL DO UPDATE SET
       gumroad_sale_id=COALESCE(EXCLUDED.gumroad_sale_id, subscriptions.gumroad_sale_id),
       permalink=EXCLUDED.permalink, recurrence=EXCLUDED.recurrence, status=EXCLUDED.status,
       market=EXCLUDED.market, ends_at=EXCLUDED.ends_at, updated_at=now()`,
    [mid, subId, saleId, permalink, recurrence, status, market, endsAt],
  );

  await query("UPDATE members SET plan=$2 WHERE id=$1 AND plan <> 'frontier'", [mid, active ? "active" : "none"]);

  return c.json({ ok: true });
});
