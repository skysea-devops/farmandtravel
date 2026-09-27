// Tek pg pool; sorgu ve transaction yardımcıları.
import pg from "pg";
import { env } from "../config/env.js";

// TLS is controlled here (not via sslmode in the URL, which pg would parse and use to
// override this option -> RDS cert fails verification as "self-signed"). We encrypt
// without CA verification for MVP (DB is in a private subnet). Enabled for RDS hosts
// (or DB_SSL=true); local Postgres stays plaintext.
const useSsl = /\.rds\.amazonaws\.com/.test(env.DATABASE_URL) || process.env.DB_SSL === "true";

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 5,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  // --- Lambda tuning (avoids the "long wait / never opens" symptom) ---
  // TCP keepalive so a warm container's DB connection isn't silently dropped by the
  // VPC/NAT while the container is frozen between invocations (a dropped-but-reused
  // socket is what hangs the first query for tens of seconds).
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  // Keep the connection around long enough that the 2-min warmup ping keeps it hot,
  // so real requests on a warm container skip the reconnect handshake entirely.
  idleTimeoutMillis: 240_000,
  // Fail fast instead of hanging if a connection can't be established.
  connectionTimeoutMillis: 8_000,
  // Never let a runaway query hold a request open past the Lambda timeout.
  statement_timeout: 12_000,
  query_timeout: 12_000,
});

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params as any[]);
}

export async function withTx<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
