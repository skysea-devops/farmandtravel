// One-off migration + seed Lambda handler (migrate.handler).
// Runs inside the VPC so it can reach RDS. Idempotent: applies each migrations/*.sql
// once (tracked in _migrations) and re-applies the taxonomy seed (ON CONFLICT DO NOTHING).
// DATABASE_URL is assembled from the RDS-managed secret, same as the API handler.
import type { Handler } from "aws-lambda";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

async function databaseUrl(): Promise<string> {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const host = process.env.DB_HOST;
  const name = process.env.DB_NAME;
  const port = process.env.DB_PORT ?? "5432";

  // Preferred: discrete creds injected at deploy time (no Secrets Manager call).
  // No sslmode in the URL: TLS is set via the pool's ssl option below (avoids pg
  // overriding it and failing RDS cert verification as "self-signed").
  if (process.env.DB_USER && process.env.DB_PASSWORD && host && name) {
    const user = encodeURIComponent(process.env.DB_USER);
    const pass = encodeURIComponent(process.env.DB_PASSWORD);
    return `postgres://${user}:${pass}@${host}:${port}/${name}`;
  }

  // Fallback: fetch the RDS-managed secret (requires a Secrets Manager VPC endpoint).
  const arn = process.env.DB_SECRET_ARN;
  if (!arn || !host || !name) throw new Error("DB env eksik: DB_SECRET_ARN/DB_HOST/DB_NAME");
  const sm = new SecretsManagerClient({});
  const res = await sm.send(new GetSecretValueCommand({ SecretId: arn }));
  const s = JSON.parse(res.SecretString ?? "{}") as { username: string; password: string };
  const user = encodeURIComponent(s.username);
  const pass = encodeURIComponent(s.password);
  return `postgres://${user}:${pass}@${host}:${port}/${name}`;
}

export const handler: Handler = async () => {
  const url = await databaseUrl();
  const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, max: 2 });
  const dir = join(process.env.LAMBDA_TASK_ROOT ?? __dirname, "migrations");
  const applied: string[] = [];
  const skipped: string[] = [];

  const client = await pool.connect();
  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS _migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`,
    );

    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".sql") && f.startsWith("0"))
      .sort();

    for (const f of files) {
      const done = await client.query("SELECT 1 FROM _migrations WHERE name=$1", [f]);
      if (done.rowCount) {
        skipped.push(f);
        continue;
      }
      // Atomic: the migration SQL and its marker commit together, so a mid-file
      // failure rolls back fully and the migration re-runs cleanly next deploy.
      try {
        await client.query("BEGIN");
        await client.query(readFileSync(join(dir, f), "utf8"));
        await client.query("INSERT INTO _migrations(name) VALUES($1)", [f]);
        await client.query("COMMIT");
        applied.push(f);
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
    }

    // Seeds: taxonomy only (idempotent). Demo members are DEV-ONLY — never seeded in
    // prod, so fake profiles can't leak into the real Keşfet.
    await client.query(readFileSync(join(dir, "seed_taxonomy.sql"), "utf8"));

    const result = { ok: true, applied, skipped, seeded: true };
    console.log("migrate:", JSON.stringify(result));
    return result;
  } finally {
    client.release();
    await pool.end();
  }
};
