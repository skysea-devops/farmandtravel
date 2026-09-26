// Auth middleware: JWT'den cognito_sub çıkarır, members satırını yükler/oluşturur.
// AUTH_MODE=dev → doğrulama yapmadan DEV_FAKE_SUB kullanır (lokal geliştirme).
// AUTH_MODE=cognito → API Gateway JWT authorizer zaten doğruladı; sub'ı claim'den alır.
import type { Context, Next } from "hono";
import { env } from "../config/env.js";
import { query } from "../db/pool.js";
import { Unauthorized } from "../errors/index.js";

export type AuthUser = { memberId: string; sub: string };

async function ensureMember(sub: string): Promise<string> {
  const found = await query<{ id: string }>("SELECT id FROM members WHERE cognito_sub=$1", [sub]);
  if (found.rowCount && found.rows[0]) return found.rows[0].id;
  const created = await query<{ id: string }>(
    "INSERT INTO members (cognito_sub, status) VALUES ($1,'onboarding') RETURNING id",
    [sub],
  );
  return created.rows[0]!.id;
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
  const memberId = await ensureMember(sub);
  c.set("user", { memberId, sub } satisfies AuthUser);
  await next();
}

export function currentUser(c: Context): AuthUser {
  const u = c.get("user") as AuthUser | undefined;
  if (!u) throw Unauthorized();
  return u;
}
