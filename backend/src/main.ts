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
    process.env.DATABASE_URL = `postgres://${user}:${pass}@${host}:${port}/${name}?sslmode=require`;
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
  process.env.DATABASE_URL = `postgres://${user}:${pass}@${host}:${port}/${name}?sslmode=require`;
}

let cached: Handler | undefined;

export const handler: Handler = async (event, context, callback) => {
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
