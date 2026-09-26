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
  const arn = process.env.DB_SECRET_ARN;
  const host = process.env.DB_HOST;
  const name = process.env.DB_NAME;
  const port = process.env.DB_PORT ?? "5432";
  if (!arn || !host || !name) throw new Error("DB env eksik: DB_SECRET_ARN/DB_HOST/DB_NAME");
  const sm = new SecretsManagerClient({});
  const res = await sm.send(new GetSecretValueCommand({ SecretId: arn }));
  const s = JSON.parse(res.SecretString ?? "{}") as { username: string; password: string };
  const user = encodeURIComponent(s.username);
  const pass = encodeURIComponent(s.password);
  return `postgres://${user}:${pass}@${host}:${port}/${name}?sslmode=require`;
}

export const handler: Handler = async () => {
  const url = await databaseUrl();
  const pool = new pg.Pool({ connectionString: url, ssl: { rejectUnauthorized: false }, max: 2 });
  const dir = join(process.env.LAMBDA_TASK_ROOT ?? __dirname, "migrations");
  const applied: string[] = [];
  const skipped: string[] = [];

  try {
    await pool.query(
      `CREATE TABLE IF NOT EXISTS _migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`,
    );

    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".sql") && f.startsWith("0"))
      .sort();

    for (const f of files) {
      const done = await pool.query("SELECT 1 FROM _migrations WHERE name=$1", [f]);
      if (done.rowCount) {
        skipped.push(f);
        continue;
      }
      await pool.query(readFileSync(join(dir, f), "utf8"));
      await pool.query("INSERT INTO _migrations(name) VALUES($1)", [f]);
      applied.push(f);
    }

    // Taxonomy seed (idempotent).
    await pool.query(readFileSync(join(dir, "seed_taxonomy.sql"), "utf8"));

    const result = { ok: true, applied, skipped, seeded: true };
    console.log("migrate:", JSON.stringify(result));
    return result;
  } finally {
    await pool.end();
  }
};
