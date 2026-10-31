import { Hono } from "hono";
import { z } from "zod";
import { auth, currentUser, requireAdmin } from "../../shared/http/auth.js";
import { query } from "../../shared/db/pool.js";
import { safeUrl } from "../../shared/media/s3.js";
import { Forbidden, NotFound } from "../../shared/errors/index.js";
import { reqLang } from "../../shared/http/lang.js";
import { translateFields } from "../../shared/text/translate.js";

export const blogRoutes = new Hono();

interface Row {
  id: string; slug: string; title: string; excerpt: string | null; body: string;
  cover_key: string | null; author_name: string | null; status: string;
  published_at: string | null; created_at: string;
}

async function toDto(r: Row, withBody: boolean) {
  return {
    id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt,
    ...(withBody ? { body: r.body } : {}),
    cover: r.cover_key ? await safeUrl(r.cover_key) : null,
    author: r.author_name, status: r.status,
    date: r.published_at ?? r.created_at,
  };
}

const COLS = "id, slug, title, excerpt, body, cover_key, author_name, status, published_at, created_at";

// Türkçe karakterleri de sadeleştiren slug üretici.
function slugify(s: string): string {
  const base = s.toLowerCase()
    .replace(/ı/g, "i").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
  return base || "yazi";
}

// ---------- PUBLIC ----------
const limitSchema = z.coerce.number().int().min(1).max(50).catch(20);
const offsetSchema = z.coerce.number().int().min(0).catch(0);

blogRoutes.get("/blog", async (c) => {
  const limit = limitSchema.parse(c.req.query("limit"));
  const offset = offsetSchema.parse(c.req.query("offset"));
  const [rows, count] = await Promise.all([
    query<Row>(`SELECT ${COLS} FROM blog_posts WHERE status='published' ORDER BY published_at DESC NULLS LAST LIMIT $1 OFFSET $2`, [limit, offset]),
    query<{ n: string }>("SELECT count(*)::int AS n FROM blog_posts WHERE status='published'"),
  ]);
  const items = await Promise.all(rows.rows.map((r) => toDto(r, false)));
  await translateFields(items, ["title", "excerpt"], reqLang(c));
  return c.json({ items, total: Number(count.rows[0]?.n ?? 0) });
});

blogRoutes.get("/blog/:slug", async (c) => {
  const r = await query<Row>(`SELECT ${COLS} FROM blog_posts WHERE slug=$1 AND status='published'`, [c.req.param("slug")]);
  const row = r.rows[0];
  if (!row) throw NotFound("Yazı bulunamadı");
  const dto = await toDto(row, true);
  await translateFields([dto], ["title", "excerpt", "body"], reqLang(c));
  return c.json(dto);
});

// ---------- ADMIN ----------
blogRoutes.get("/admin/blog", auth, requireAdmin, async (c) => {
  const r = await query<Row>(`SELECT ${COLS} FROM blog_posts ORDER BY created_at DESC`, []);
  return c.json({ items: await Promise.all(r.rows.map((r) => toDto(r, false))) });
});

const createSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().max(90).optional(),
  excerpt: z.string().max(500).optional(),
  body: z.string().min(1),
  coverKey: z.string().max(300).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

blogRoutes.post("/admin/blog", auth, requireAdmin, async (c) => {
  const { memberId } = currentUser(c);
  const b = createSchema.parse(await c.req.json());
  if (b.coverKey && !b.coverKey.startsWith(`gallery/${memberId}/`)) throw Forbidden("Bu dosya sana ait değil");
  // Benzersiz slug üret.
  let slug = slugify(b.slug || b.title);
  const ex = await query<{ slug: string }>("SELECT slug FROM blog_posts WHERE slug=$1 OR slug LIKE $2", [slug, `${slug}-%`]);
  if (ex.rows.some((r) => r.slug === slug)) slug = `${slug}-${(ex.rowCount ?? 0) + 1}`;
  const name = await query<{ first_name: string | null }>("SELECT first_name FROM members WHERE id=$1", [memberId]);
  const status = b.status ?? "draft";
  const publishedAt = status === "published" ? new Date().toISOString() : null;
  const r = await query<Row>(
    `INSERT INTO blog_posts (slug, title, excerpt, body, cover_key, author_name, status, published_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${COLS}`,
    [slug, b.title, b.excerpt ?? null, b.body, b.coverKey ?? null, name.rows[0]?.first_name ?? null, status, publishedAt],
  );
  return c.json(await toDto(r.rows[0]!, true));
});

const editSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  excerpt: z.string().max(500).nullable().optional(),
  body: z.string().min(1).optional(),
  coverKey: z.string().max(300).nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
});
const EDIT_COL: Record<string, string> = { title: "title", excerpt: "excerpt", body: "body", coverKey: "cover_key", status: "status" };

blogRoutes.patch("/admin/blog/:id", auth, requireAdmin, async (c) => {
  const { memberId } = currentUser(c);
  const b = editSchema.parse(await c.req.json());
  if (b.coverKey && !b.coverKey.startsWith(`gallery/${memberId}/`)) throw Forbidden("Bu dosya sana ait değil");
  const sets: string[] = []; const vals: unknown[] = [];
  for (const [k, col] of Object.entries(EDIT_COL)) {
    if (k in b) { vals.push((b as Record<string, unknown>)[k] ?? null); sets.push(`${col}=$${vals.length}`); }
  }
  // published'e geçerken published_at'i bir kez doldur.
  if (b.status === "published") { vals.push(new Date().toISOString()); sets.push(`published_at=COALESCE(published_at, $${vals.length})`); }
  if (!sets.length) return c.json({ error: "no_fields", message: "Güncellenecek alan yok." }, 400);
  sets.push("updated_at=now()");
  vals.push(c.req.param("id"));
  const r = await query<Row>(`UPDATE blog_posts SET ${sets.join(", ")} WHERE id=$${vals.length} RETURNING ${COLS}`, vals);
  if (!r.rowCount) throw NotFound("Yazı bulunamadı");
  return c.json(await toDto(r.rows[0]!, true));
});

blogRoutes.delete("/admin/blog/:id", auth, requireAdmin, async (c) => {
  const r = await query("DELETE FROM blog_posts WHERE id=$1", [c.req.param("id")]);
  if (!r.rowCount) throw NotFound("Yazı bulunamadı");
  return c.json({ ok: true });
});
