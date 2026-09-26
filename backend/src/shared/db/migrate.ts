// Basit migration runner: migrations/*.sql dosyalarını sırayla, bir kez uygular.
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "./pool.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "../../../migrations");

async function run() {
  await pool.query(`CREATE TABLE IF NOT EXISTS _migrations (
    name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql") && f.startsWith("0")) // seed ayrı çalışır
    .sort();

  for (const file of files) {
    const done = await pool.query("SELECT 1 FROM _migrations WHERE name=$1", [file]);
    if (done.rowCount) {
      console.log(`- skip ${file}`);
      continue;
    }
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log(`+ apply ${file}`);
    await pool.query(sql);
    await pool.query("INSERT INTO _migrations(name) VALUES($1)", [file]);
  }
  console.log("migrations done");
  await pool.end();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
