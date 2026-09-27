// Auth middleware: JWT'den cognito_sub çıkarır, members satırını yükler/oluşturur.
// AUTH_MODE=dev → doğrulama yapmadan DEV_FAKE_SUB kullanır (lokal geliştirme).
// AUTH_MODE=cognito → API Gateway JWT authorizer zaten doğruladı; sub'ı claim'den alır.
import type { Context, Next } from "hono";
import { env } from "../config/env.js";
import { query } from "../db/pool.js";
import { Unauthorized, Forbidden } from "../errors/index.js";

export type AuthUser = { memberId: string; sub: string };

// Everyone who joins before this date is grandfathered as a free "frontier" member
// (the initial community). Later sign-ups start on 'none' and must subscribe.
const FRONTIER_CUTOFF = Date.parse("2026-10-03T00:00:00+03:00");

// Idempotent get-or-create for the member row keyed by cognito_sub. Uses an upsert
// (not SELECT-then-INSERT) so two parallel first requests from a brand-new user
// can't both try to INSERT and hit the unique(cognito_sub) violation.
async function ensureMember(sub: string): Promise<{ id: string; status: string }> {
  const plan = Date.now() < FRONTIER_CUTOFF ? "frontier" : "none";
  const r = await query<{ id: string; status: string }>(
    `INSERT INTO members (cognito_sub, status, plan) VALUES ($1,'onboarding',$2)
       ON CONFLICT (cognito_sub) DO UPDATE SET cognito_sub = EXCLUDED.cognito_sub
     RETURNING id, status`,
    [sub, plan],
  );
  return r.rows[0]!;
}

export async function auth(c: Context, next: Next) {
  let sub: string | undefined;

  if (env.AUTH_MODE === "dev") {
    // Lokal: header ile kullanıcı taklidi ("x-dev-sub"), yoksa sabit.
    sub = c.req.header("x-dev-sub") ?? env.DEV_FAKE_SUB;
  } else {
    // API Gateway JWT authorizer claim'i event'e koyar; Hono aws-lambda adapter'ı
    // bunu c.env.event üzerinden geçirir. Basit yol: Authorization'dan decode edilmiş sub.
    const event = (c.env as any)?.event;
    sub = event?.requestContext?.authorizer?.jwt?.claims?.sub;
  }

  if (!sub) throw Unauthorized();
  const member = await ensureMember(sub);
  // Suspended members are blocked at the door for every authenticated route.
  if (member.status === "suspended") throw Forbidden("Hesabın askıya alındı");
  c.set("user", { memberId: member.id, sub } satisfies AuthUser);
  await next();
}

export function currentUser(c: Context): AuthUser {
  const u = c.get("user") as AuthUser | undefined;
  if (!u) throw Unauthorized();
  return u;
}
