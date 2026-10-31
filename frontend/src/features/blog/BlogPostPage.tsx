import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { blog } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { Markdown } from "@/components/Markdown";
import type { BlogPost } from "@/lib/types";

function fmt(iso: string, lang: string) {
  try { return new Date(iso).toLocaleDateString(lang === "en" ? "en-GB" : "tr-TR", { day: "numeric", month: "long", year: "numeric" }); }
  catch { return ""; }
}

export function BlogPostPage() {
  const { slug } = useParams();
  const { t, lang } = useI18n();
  const [p, setP] = useState<BlogPost | null | undefined>(undefined);

  useEffect(() => {
    if (!slug) return;
    blog.detail<BlogPost>(slug).then(setP).catch(() => setP(null));
  }, [slug]);

  if (p === undefined) return <div className="py-20 text-center text-ink-500">{t("Yükleniyor…", "Loading…")}</div>;
  if (p === null) return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <p className="text-ink-600">{t("Yazı bulunamadı.", "Post not found.")}</p>
      <Link to="/blog" className="mt-4 inline-block text-forest-600 hover:underline">{t("Bloga dön", "Back to blog")}</Link>
    </div>
  );

  return (
    <article className="mx-auto max-w-3xl px-6 py-10 md:py-14">
      <Link to="/blog" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-forest-600 hover:underline">
        <ChevronLeft size={16} strokeWidth={2} /> {t("Topluluk Bloğumuz", "Community Blog")}
      </Link>

      <h1 className="font-display text-3xl font-semibold leading-tight text-ink-900 md:text-4xl">{p.title}</h1>
      <div className="mt-3 text-sm text-ink-400">{[p.author, fmt(p.date, lang)].filter(Boolean).join(" · ")}</div>

      {p.cover && (
        <img src={p.cover} alt="" className="mt-6 max-h-[460px] w-full rounded-[var(--radius-lg)] border border-border object-cover" />
      )}

      <div className="mt-8">
        <Markdown text={p.body} />
      </div>

      <div className="mt-12 border-t border-border pt-6">
        <Link to="/blog" className="text-sm font-medium text-forest-600 hover:underline">← {t("Tüm yazılar", "All posts")}</Link>
      </div>
    </article>
  );
}
