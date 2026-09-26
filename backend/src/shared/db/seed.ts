// Taksonomi seed'ini uygular (idempotent — ON CONFLICT DO NOTHING).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "./pool.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, "../../../migrations/seed_taxonomy.sql"), "utf8");

pool
  .query(sql)
  .then(() => console.log("taxonomy seeded"))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());
