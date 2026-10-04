// Auth middleware: JWT'den cognito_sub çıkarır, members satırını yükler/oluşturur.
// AUTH_MODE=dev → doğrulama yapmadan DEV_FAKE_SUB kullanır (lokal geliştirme).
// AUTH_MODE=cognito → API Gateway JWT authorizer zaten doğruladı; sub'ı claim'den alır.
import type { Context, Next } from "hono";
import { env } from "../config/env.js";
import { query } from "../db/pool.js";
import { Unauthorized, Forbidden } from "../errors/index.js";
import { provisionWelcome } from "../../modules/messages/official.js";

export type AuthUser = { memberId: string; sub: string; groups: string[]; isAdmin: boolean; plan: string; status: string };

// cognito:groups arrives from the HTTP API JWT authorizer as a string like "[admin]"
// or "admin" (sometimes comma/space separated). Normalize to a string[].
function parseGroups(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw !== "string" || !raw) return [];
  return raw.replace(/^\[|\]$/g, "").split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
}

// Everyone who joins before this cutoff is grandfathered as a free "frontier" member
// (the initial community); later sign-ups start on 'none' and must subscribe. The date
// is env-driven so it can be pushed until Lemon Squeezy billing is live (no code deploy).
const FRONTIER_CUTOFF = Date.parse(env.FRONTIER_CUTOFF);

// Idempotent get-or-create for the member row keyed by cognito_sub. Uses an upsert
// (not SELECT-then-INSERT) so two parallel first requests from a brand-new user
// can't both try to INSERT and hit the unique(cognito_sub) violation.
async function ensureMember(sub: string, lang: "tr" | "en"): Promise<{ id: string; status: string; plan: string }> {
  const plan = Date.now() < FRONTIER_CUTOFF ? "frontier" : "none";
  // (xmax = 0) is true only for a fresh INSERT (not the ON CONFLICT update path).
  const r = await query<{ id: string; status: string; plan: string; inserted: boolean }>(
    `INSERT INTO members (cognito_sub, status, plan) VALUES ($1,'onboarding',$2)
       ON CONFLICT (cognito_sub) DO UPDATE SET cognito_sub = EXCLUDED.cognito_sub
     RETURNING id, status, plan, (xmax = 0) AS inserted`,
    [sub, plan],
  );
  const row = r.rows[0]!;
  if (row.inserted) await provisionWelcome(row.id, lang); // first login → welcome message
  return { id: row.id, status: row.status, plan: row.plan };
}

export async function auth(c: Context, next: Next) {
  let sub: string | undefined;
  let groups: string[] = [];

  if (env.AUTH_MODE === "dev") {
    // Lokal: header ile kullanıcı taklidi ("x-dev-sub"), yoksa sabit. x-dev-groups ile rol.
    sub = c.req.header("x-dev-sub") ?? env.DEV_FAKE_SUB;
    groups = parseGroups(c.req.header("x-dev-groups") ?? "admin"); // dev: admin by default
  } else {
    // API Gateway JWT authorizer claim'i event'e koyar; Hono aws-lambda adapter'ı
    // bunu c.env.event üzerinden geçirir.
    const claims = (c.env as any)?.event?.requestContext?.authorizer?.jwt?.claims;
    sub = claims?.sub;
    groups = parseGroups(claims?.["cognito:groups"]);
  }

  if (!sub) throw Unauthorized();
  // Welcome-message language from the calling site (reconnectwithsoil.com → English).
  const origin = c.req.header("origin") ?? c.req.header("referer") ?? "";
  const lang = /reconnectwithsoil\.com/.test(origin) ? "en" : "tr";
  const member = await ensureMember(sub, lang);
  // Suspended members are blocked at the door for every authenticated route.
  if (member.status === "suspended") throw Forbidden("Hesabın askıya alındı");
  // A deleted (anonymized) account can't be used again, even if its Cognito user
  // still exists (e.g. browser-side deleteUser failed) — prevents a ghost re-login.
  if (member.status === "deleted") throw Forbidden("Bu hesap silindi");
  c.set("user", {
    memberId: member.id, sub, groups, isAdmin: groups.includes("admin"),
    plan: member.plan, status: member.status,
  } satisfies AuthUser);
  await next();
}

export function currentUser(c: Context): AuthUser {
  const u = c.get("user") as AuthUser | undefined;
  if (!u) throw Unauthorized();
  return u;
}

// Guard for admin-only routes; use after `auth`.
export async function requireAdmin(c: Context, next: Next) {
  if (!currentUser(c).isAdmin) throw Forbidden("Bu işlem için yetkin yok");
  await next();
}

// Paywall guard; use after `auth`. Admins and frontier/active members pass; everyone
// else (plan='none') gets a 403 the frontend turns into the subscribe screen. Profile,
// onboarding, billing, account deletion and public routes must NOT use this.
export async function requireMembership(c: Context, next: Next) {
  const u = currentUser(c);
  if (u.isAdmin || u.plan === "frontier" || u.plan === "active") {
    await next();
    return;
  }
  return c.json({ error: "membership_required", message: "Bu özellik için aktif üyelik gerekli." }, 403);
}
