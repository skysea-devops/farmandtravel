// Ödeme modülü uçtan uca testleri — tüm edge senaryoları. Gerçek Postgres gerektirir
// (CI service container; migrate önce koşar). Prod deploy bu testler geçmeden yapılmaz.
//
// NOT: env app.js'ten ÖNCE ayarlanmalı (env.ts import anında parse eder), bu yüzden app /
// pool / service yalnızca dinamik import ile beforeAll içinde yüklenir.
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";

process.env.DATABASE_URL ||= "postgres://postgres:postgres@localhost:5432/postgres";
process.env.AUTH_MODE = "dev";
process.env.GUMROAD_STORE = "topraklayeniden";
process.env.GUMROAD_PERMALINK_TR = "uyelik";
process.env.GUMROAD_PERMALINK_INTL = "reconnect-membership";
process.env.GUMROAD_WEBHOOK_TOKEN = "testtoken";

const TOKEN = "testtoken";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let app: any; // Hono instance; request() ile çağrılır
let query: (text: string, params?: unknown[]) => Promise<{ rows: any[]; rowCount: number }>;
let pool: { end: () => Promise<void> };
let svc: typeof import("./service.js");

const subs = `test_${randomUUID()}`; // bu testin oluşturduğu üyeleri işaretler
let seq = 0;

async function mkMember(plan = "none", email: string | null = null): Promise<string> {
  const r = await query(
    "INSERT INTO members (cognito_sub,status,plan,contact_email) VALUES ($1,'active',$2,$3) RETURNING id",
    [`${subs}_${seq++}`, plan, email],
  );
  return r.rows[0].id;
}

function post(fields: Record<string, string>, token = TOKEN) {
  const body = new URLSearchParams(fields).toString();
  return app.request(`/webhooks/gumroad?token=${token}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
}

const planOf = async (id: string) =>
  (await query("SELECT plan FROM members WHERE id=$1", [id])).rows[0]?.plan as string;
const subRow = async (subId: string) =>
  (await query("SELECT * FROM subscriptions WHERE gumroad_subscription_id=$1", [subId])).rows[0];

// Bir satış/ilk ödeme event'i — gerçekçi Gumroad alanları.
function saleFields(opts: { permalink: string; subId: string; memberId?: string; email?: string; recurrence?: string }): Record<string, string> {
  const f: Record<string, string> = {
    sale_id: `sale_${randomUUID()}`,
    subscription_id: opts.subId,
    product_permalink: `https://topraklayeniden.gumroad.com/l/${opts.permalink}`,
    recurrence: opts.recurrence ?? "yearly",
    email: opts.email ?? "buyer@example.com",
  };
  if (opts.memberId) f["url_params[member_id]"] = opts.memberId;
  return f;
}

beforeAll(async () => {
  const appMod = await import("../../app.js");
  app = appMod.createApp();
  ({ query, pool } = await import("../../shared/db/pool.js") as any);
  svc = await import("./service.js");
});

afterAll(async () => {
  await query("DELETE FROM subscriptions WHERE member_id IN (SELECT id FROM members WHERE cognito_sub LIKE $1)", [`${subs}_%`]);
  await query("DELETE FROM members WHERE cognito_sub LIKE $1", [`${subs}_%`]);
  await pool.end();
});

describe("billing service (saf fonksiyonlar)", () => {
  it("checkoutUrl TR doğru ürün + member_id + yıllık (varsayılan)", () => {
    const u = svc.checkoutUrl("m1", null, "tr");
    expect(u).toContain("topraklayeniden.gumroad.com/l/uyelik");
    expect(u).toContain("member_id=m1");
    expect(u).toContain("wanted=true");
    expect(u).toContain("recurrence=yearly");
  });
  it("checkoutUrl 3 aylık periyodu geçirir", () => {
    expect(svc.checkoutUrl("m1", null, "tr", "quarterly")).toContain("recurrence=quarterly");
  });
  it("checkoutUrl INTL doğru ürüne gider", () => {
    expect(svc.checkoutUrl("m1", null, "intl")).toContain("/l/reconnect-membership");
  });
  it("marketOfPermalink intl/tr ayırır", () => {
    expect(svc.marketOfPermalink("https://x/l/reconnect-membership")).toBe("intl");
    expect(svc.marketOfPermalink("https://x/l/uyelik")).toBe("tr");
    expect(svc.marketOfPermalink(null)).toBe("tr");
  });
  it("periodEnd recurrence'a göre ileri tarih (+tolerans)", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(svc.periodEnd("yearly", now).getFullYear()).toBe(2027);
    expect(svc.periodEnd("quarterly", now).getMonth()).toBe(3); // Ocak+3ay ≈ Nisan (+2g)
    expect(svc.periodEnd("monthly", now) > now).toBe(true);
    expect(svc.periodEnd(null, now).getFullYear()).toBe(2027); // bilinmeyen → yıllık varsayılan
  });
});

describe("gumroad webhook — güvenlik", () => {
  it("yanlış token → 401", async () => {
    const r = await post(saleFields({ permalink: "uyelik", subId: "x" }), "wrong");
    expect(r.status).toBe(401);
  });
  it("token yoksa → 401", async () => {
    const r = await app.request("/webhooks/gumroad", { method: "POST", body: "" });
    expect(r.status).toBe(401);
  });
});

describe("gumroad webhook — satış & yenileme", () => {
  it("member_id ile satış → aktif, bitiş ileride, TR market", async () => {
    const id = await mkMember();
    const subId = `sub_${randomUUID()}`;
    const r = await post(saleFields({ permalink: "uyelik", subId, memberId: id }));
    expect(r.status).toBe(200);
    expect(await planOf(id)).toBe("active");
    const row = await subRow(subId);
    expect(row.status).toBe("active");
    expect(row.market).toBe("tr");
    expect(new Date(row.ends_at).getTime()).toBeGreaterThan(Date.now());
  });

  it("yenileme aynı aboneliği tek satırda günceller (upsert)", async () => {
    const id = await mkMember();
    const subId = `sub_${randomUUID()}`;
    await post(saleFields({ permalink: "uyelik", subId, memberId: id }));
    const first = await subRow(subId);
    await new Promise((r) => setTimeout(r, 5));
    await post(saleFields({ permalink: "uyelik", subId, memberId: id })); // member_id yok da olsa sub'tan bulur
    const cnt = await query("SELECT count(*)::int n FROM subscriptions WHERE gumroad_subscription_id=$1", [subId]);
    expect(cnt.rows[0].n).toBe(1);
    const second = await subRow(subId);
    expect(new Date(second.ends_at).getTime()).toBeGreaterThanOrEqual(new Date(first.ends_at).getTime());
    expect(await planOf(id)).toBe("active");
  });

  it("INTL permalink → market intl", async () => {
    const id = await mkMember();
    const subId = `sub_${randomUUID()}`;
    await post(saleFields({ permalink: "reconnect-membership", subId, memberId: id }));
    expect((await subRow(subId)).market).toBe("intl");
  });

  it("member_id yoksa subscription_id'den bulur", async () => {
    const id = await mkMember();
    const subId = `sub_${randomUUID()}`;
    await post(saleFields({ permalink: "uyelik", subId, memberId: id })); // kaydı oluştur
    // İkinci event member_id'siz; sub üzerinden eşleşmeli ve aktif kalmalı
    const f = saleFields({ permalink: "uyelik", subId });
    delete f["url_params[member_id]"];
    const r = await post(f);
    expect(r.status).toBe(200);
    expect(await planOf(id)).toBe("active");
  });

  it("member_id/sub yoksa e-postadan bulur", async () => {
    const id = await mkMember("none", "match@example.com");
    const subId = `sub_${randomUUID()}`;
    const f = saleFields({ permalink: "uyelik", subId, email: "match@example.com" });
    delete f["url_params[member_id]"];
    await post(f);
    expect(await planOf(id)).toBe("active");
  });
});

describe("gumroad webhook — iptal / bitiş / iade", () => {
  it("subscription_ended → pasif (none)", async () => {
    const id = await mkMember();
    const subId = `sub_${randomUUID()}`;
    await post(saleFields({ permalink: "uyelik", subId, memberId: id }));
    expect(await planOf(id)).toBe("active");
    await post({ subscription_id: subId, ended_at: new Date().toISOString(), ended_reason: "cancelled" });
    expect(await planOf(id)).toBe("none");
    expect((await subRow(subId)).status).toBe("expired");
  });

  it("iade (refunded=true) → pasif", async () => {
    const id = await mkMember();
    const subId = `sub_${randomUUID()}`;
    const f = saleFields({ permalink: "uyelik", subId, memberId: id });
    await post(f);
    await post({ ...f, refunded: "true" });
    expect(await planOf(id)).toBe("none");
  });

  it("iptal (cancelled_at, bitmemiş) → dönem sonuna kadar aktif kalır", async () => {
    const id = await mkMember();
    const subId = `sub_${randomUUID()}`;
    await post(saleFields({ permalink: "uyelik", subId, memberId: id }));
    await post({ subscription_id: subId, cancelled: "true", cancelled_at: new Date().toISOString() });
    expect(await planOf(id)).toBe("active"); // hâlâ aktif
    expect((await subRow(subId)).status).toBe("cancelled");
  });
});

describe("gumroad webhook — koruma kuralları", () => {
  it("frontier üye satışta da iptalde de frontier kalır", async () => {
    const id = await mkMember("frontier");
    const subId = `sub_${randomUUID()}`;
    await post(saleFields({ permalink: "uyelik", subId, memberId: id }));
    expect(await planOf(id)).toBe("frontier");
    await post({ subscription_id: subId, ended_at: new Date().toISOString(), ended_reason: "x" });
    expect(await planOf(id)).toBe("frontier");
  });

  it("eşleşmeyen üye → 200, sessizce yok sayılır", async () => {
    const r = await post(saleFields({ permalink: "uyelik", subId: `sub_${randomUUID()}`, email: "nobody@nowhere.test" }));
    expect(r.status).toBe(200);
    const body = (await r.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});
