// On-read machine translation with a DB cache (table: translations).
//
// translateMany(texts, lang) returns a same-length array with each text translated to
// `lang`. The base language is Turkish, so lang="tr" is a no-op. Only distinct, non-empty
// strings are translated; results are cached by sha256(source)+lang so each string is
// translated at most once ever. Bedrock (Haiku) does the translation in ONE batched call
// per request for the cache misses. Any failure falls back to the original text — a
// translation problem must never break a response.
import { createHash } from "node:crypto";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { env } from "../config/env.js";
import { query } from "../db/pool.js";

const client = env.AI_MODE === "bedrock" ? new BedrockRuntimeClient({ region: env.BEDROCK_REGION }) : null;

const hash = (s: string) => createHash("sha256").update(s).digest("hex");

export type Lang = "tr" | "en";

export async function translateMany(
  texts: (string | null | undefined)[],
  lang: string,
): Promise<(string | null)[]> {
  // Base language or translation disabled (stub/local): pass through unchanged.
  if (lang !== "en" || !client) return texts.map((t) => t ?? null);

  // Distinct non-empty sources, keyed by hash.
  const uniq = new Map<string, string>();
  for (const t of texts) {
    const s = (t ?? "").trim();
    if (s) uniq.set(hash(s), s);
  }
  if (uniq.size === 0) return texts.map((t) => t ?? null);

  const out = new Map<string, string>(); // hash -> translated

  // 1) Cache hits.
  try {
    const hits = await query<{ source_hash: string; translated: string }>(
      `SELECT source_hash, translated FROM translations
        WHERE target_lang = $1 AND source_hash = ANY($2::text[])`,
      [lang, [...uniq.keys()]],
    );
    for (const r of hits.rows) out.set(r.source_hash, r.translated);
  } catch { /* cache read failure → treat all as misses */ }

  // 2) Translate misses in one batched Bedrock call, then persist.
  const misses = [...uniq.entries()].filter(([h]) => !out.has(h));
  if (misses.length > 0) {
    try {
      const translated = await bedrockTranslate(misses.map(([, s]) => s));
      if (translated.length === misses.length) {
        const rows = misses.map(([h, s], i) => {
          const tr = (translated[i] ?? "").trim() || s;
          out.set(h, tr);
          return { h, s, tr };
        });
        await cacheStore(rows, lang);
      }
    } catch { /* leave misses untranslated (fall back to source below) */ }
  }

  // 3) Map every input back to its translation (or original on miss/failure).
  return texts.map((t) => {
    const s = (t ?? "").trim();
    if (!s) return t ?? null;
    return out.get(hash(s)) ?? (t ?? null);
  });
}

// Convenience for a single value.
export async function translateOne(text: string | null | undefined, lang: string): Promise<string | null> {
  return (await translateMany([text], lang))[0] ?? null;
}

// Translate the named free-text fields of a list of rows IN PLACE, batching every string
// across all rows into a single translateMany call. A field is only overwritten when a
// translation came back, so originals (and non-null types) are preserved on miss/no-op.
export async function translateFields<T extends Record<string, unknown>>(
  rows: T[],
  fields: readonly (keyof T)[],
  lang: string,
): Promise<void> {
  if (lang !== "en" || rows.length === 0) return;
  const flat: (string | null | undefined)[] = [];
  for (const r of rows) for (const f of fields) flat.push(r[f] as string | null | undefined);
  const tr = await translateMany(flat, lang);
  let i = 0;
  for (const r of rows) {
    for (const f of fields) {
      const v = tr[i++];
      if (v != null) (r as Record<string, unknown>)[f as string] = v;
    }
  }
}

async function bedrockTranslate(sources: string[]): Promise<string[]> {
  const prompt = `Translate each string in the JSON array below into natural English for a farming / eco community platform.
Rules:
- Return ONLY a JSON array of strings, same length and order as the input.
- Keep emojis, URLs, @handles, hashtags, numbers, and proper nouns (people's names, city names, brand names) unchanged.
- If a string is already English, return it unchanged.
- Do not add quotes, notes, or any text outside the JSON array.
Input: ${JSON.stringify(sources)}`;

  const body = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 4000,
    messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
  };
  const res = await client!.send(
    new InvokeModelCommand({
      modelId: env.BEDROCK_MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(body),
    }),
  );
  const decoded = JSON.parse(new TextDecoder().decode(res.body));
  const text: string = decoded?.content?.[0]?.text ?? "[]";
  const arr = JSON.parse(text.slice(text.indexOf("["), text.lastIndexOf("]") + 1));
  if (!Array.isArray(arr)) throw new Error("bad translation response");
  return arr.map((x) => (typeof x === "string" ? x : String(x)));
}

async function cacheStore(rows: { h: string; s: string; tr: string }[], lang: string): Promise<void> {
  if (rows.length === 0) return;
  // Multi-row upsert; ignore conflicts (another request may have cached the same string).
  const values: string[] = [];
  const params: unknown[] = [];
  rows.forEach((r, i) => {
    const b = i * 4;
    values.push(`($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4})`);
    params.push(r.h, lang, r.s, r.tr);
  });
  await query(
    `INSERT INTO translations (source_hash, target_lang, source_text, translated)
     VALUES ${values.join(", ")}
     ON CONFLICT (source_hash, target_lang) DO NOTHING`,
    params,
  );
}
