// Bundles the Lambda code into dist-lambda/ for deployment.
// - main.js  (handler: main.handler)    — the API (Hono lambdalith)
// - migrate.js (handler: migrate.handler) — one-off DB migrate + seed
// - migrations/                          — .sql files read at runtime
// AWS SDK v3 ships in the nodejs20.x runtime, so it's marked external (smaller zip).
import { build } from "esbuild";
import { mkdirSync, rmSync, cpSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist-lambda");

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

await build({
  entryPoints: [join(root, "src/main.ts"), join(root, "src/migrate.ts")],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outdir: out,
  // Bundle client-s3 + presigner (guarantee availability); the others are in the
  // nodejs20 runtime so keep them external to stay small.
  external: ["@aws-sdk/client-secrets-manager", "@aws-sdk/client-bedrock-runtime", "pg-native"],
  logLevel: "info",
});

// The bundle is CommonJS; mark the folder so nodejs20.x loads .js as CJS
// (the backend package is "type":"module", which must not leak into the zip).
writeFileSync(join(out, "package.json"), JSON.stringify({ type: "commonjs" }) + "\n");

// SQL files are read from disk at runtime by the migrate handler.
cpSync(join(root, "migrations"), join(out, "migrations"), { recursive: true });

console.log("lambda bundle ready:", out);
