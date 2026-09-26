// Tek pg pool; sorgu ve transaction yardımcıları.
import pg from "pg";
import { env } from "../config/env.js";

// RDS forces TLS (DATABASE_URL carries sslmode=require). node-postgres needs an
// explicit ssl option; the RDS CA isn't in the default trust store, so for MVP we
// encrypt without CA verification (DB lives in a private subnet). Local Postgres
// has no sslmode=require, so ssl stays off there.
const useSsl = /sslmode=require/.test(env.DATABASE_URL);

export const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  max: 5,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
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
