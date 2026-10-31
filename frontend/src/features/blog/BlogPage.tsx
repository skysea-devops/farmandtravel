import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { blog } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { BlogCard } from "@/lib/types";

function fmt(iso: string, lang: string) {
  try { return new Date(iso).toLocaleDateString(lang === "en" ? "en-GB" : "tr-TR", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return ""; }
}

export function BlogPage() {
  const { t, lang } = useI18n();
  const [items, setItems] = useState<BlogCard[] | null>(null);

  useEffect(() => {
    blog.list<{ items: BlogCard[] }>(30).then((r) => setItems(r.items)).catch(() => setItems([]));
  }, []);

  const featured = items?.[0] ?? null;
  const rest = items?.slice(1) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
      <header className="mb-10 max-w-2xl">
        <h1 className="font-display text-4xl font-semibold md:text-5xl">{t("Blog", "Blog")}</h1>
        <p className="mt-3 text-[17px] text-ink-600">
          {t("Topraktan, üretimden ve topluluktan ilham veren yazılar, rehberler ve hikâyeler.",
             "Inspiring articles, guides and stories about the soil, growing and our community.")}
        </p>
      </header>

      {items === null ? (
        <div className="py-16 text-center text-ink-500">{t("Yükleniyor…", "Loading…")}</div>
      ) : items.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong p-12 text-center text-ink-500">
          {t("Henüz yazı yok. Çok yakında.", "No posts yet. Coming soon.")}
        </div>
      ) : (
        <>
          {featured && (
            <Link to={`/blog/${featured.slug}`} className="group mb-12 grid gap-6 overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface md:grid-cols-2">
              <div className="h-64 overflow-hidden bg-sand-100 md:h-full">
                {featured.cover
                  ? <img src={featured.cover} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                  : <div className="h-full w-full bg-gradient-to-br from-moss-300 to-forest-600" />}
              </div>
              <div className="flex flex-col justify-center p-6 md:p-8">
                <span className="mb-2 text-xs font-semibold uppercase tracking-wide text-clay-600">{t("Öne çıkan", "Featured")}</span>
                <h2 className="font-display text-2xl font-semibold leading-tight text-ink-900 md:text-3xl">{featured.title}</h2>
                {featured.excerpt && <p className="mt-3 text-[15px] leading-relaxed text-ink-600">{featured.excerpt}</p>}
                <div className="mt-4 text-[13px] text-ink-400">{[featured.author, fmt(featured.date, lang)].filter(Boolean).join(" · ")}</div>
              </div>
            </Link>
          )}

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <Link key={p.id} to={`/blog/${p.slug}`} className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface transition hover:border-forest-500 hover:shadow-sm">
                <div className="h-48 overflow-hidden bg-sand-100">
                  {p.cover
                    ? <img src={p.cover} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                    : <div className="h-full w-full bg-gradient-to-br from-moss-300 to-forest-600" />}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-[18px] font-semibold leading-snug text-ink-900">{p.title}</h3>
                  {p.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-600">{p.excerpt}</p>}
                  <div className="mt-3 text-[12.5px] text-ink-400">{[p.author, fmt(p.date, lang)].filter(Boolean).join(" · ")}</div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
