// AWS Lambda handler (API Gateway HTTP API v2).
// Cold start: if DATABASE_URL is absent but DB_SECRET_ARN is set (prod), resolve the
// RDS-managed password from Secrets Manager and assemble DATABASE_URL before the app
// (and its pg pool) are imported. Locally, DATABASE_URL is set directly and this is skipped.
import type { Handler } from "aws-lambda";

async function ensureDatabaseUrl(): Promise<void> {
  if (process.env.DATABASE_URL) return;
  const host = process.env.DB_HOST;
  const name = process.env.DB_NAME;
  const port = process.env.DB_PORT ?? "5432";

  // Preferred: discrete creds injected at deploy time (no Secrets Manager call).
  if (process.env.DB_USER && process.env.DB_PASSWORD && host && name) {
    const user = encodeURIComponent(process.env.DB_USER);
    const pass = encodeURIComponent(process.env.DB_PASSWORD);
    // No sslmode in the URL: TLS is controlled by pool.ts's ssl option, otherwise
    // pg parses sslmode and overrides it (RDS cert -> "self-signed" verify error).
    process.env.DATABASE_URL = `postgres://${user}:${pass}@${host}:${port}/${name}`;
    return;
  }

  // Fallback: fetch the RDS-managed secret (requires a Secrets Manager VPC endpoint).
  const secretArn = process.env.DB_SECRET_ARN;
  if (!secretArn || !host || !name) return; // env.ts will surface a clear error

  const { SecretsManagerClient, GetSecretValueCommand } = await import(
    "@aws-sdk/client-secrets-manager"
  );
  const sm = new SecretsManagerClient({});
  const res = await sm.send(new GetSecretValueCommand({ SecretId: secretArn }));
  const secret = JSON.parse(res.SecretString ?? "{}") as { username: string; password: string };
  const user = encodeURIComponent(secret.username);
  const pass = encodeURIComponent(secret.password);
  process.env.DATABASE_URL = `postgres://${user}:${pass}@${host}:${port}/${name}`;
}

let cached: Handler | undefined;

export const handler: Handler = async (event, context, callback) => {
  // Warm-up ping (EventBridge): open the DB connection and return fast so the
  // container + pg pool stay warm, avoiding cold starts for real requests.
  if (event && (event as { warmup?: boolean }).warmup) {
    await ensureDatabaseUrl();
    try {
      const { pool } = await import("./shared/db/pool.js");
      await pool.query("SELECT 1");
    } catch {
      /* ignore */
    }
    return { warmed: true };
  }

  // Daily retention purge (EventBridge): hard-delete members anonymized more than
  // 3 months ago. CASCADE removes their messages/connections/reviews for good.
  if (event && (event as { task?: string }).task === "purge") {
    await ensureDatabaseUrl();
    try {
      const { pool } = await import("./shared/db/pool.js");
      const r = await pool.query(
        "DELETE FROM members WHERE status='deleted' AND deleted_at < now() - interval '3 months'",
      );
      return { purged: r.rowCount ?? 0 };
    } catch (e) {
      return { purged: 0, error: String(e) };
    }
  }

  if (!cached) {
    await ensureDatabaseUrl();
    const [{ handle }, { createApp }] = await Promise.all([
      import("hono/aws-lambda"),
      import("./app.js"),
    ]);
    cached = handle(createApp()) as unknown as Handler;
  }
  return cached(event, context, callback);
};
