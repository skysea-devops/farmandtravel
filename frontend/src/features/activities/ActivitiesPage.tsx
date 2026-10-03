import { useEffect, useMemo, useState } from "react";
import { youtubeThumb } from "@/data/activities";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { activities as actApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ActivityForm } from "./ActivityForm";
import type { ActivityItem, ActivityKind, ActivityEligibility } from "@/lib/types";

function useKindLabel() {
  const { t } = useI18n();
  const map: Record<ActivityKind, string> = {
    video: t("🎥 Podcast", "🎥 Podcast"),
    photo: t("📷 Paylaşım", "📷 Post"),
    meeting: t("📅 Buluşma", "📅 Meetup"),
    announcement: t("📢 Duyuru", "📢 Announcement"),
  };
  return map;
}

function fmtDate(iso: string, lang: string) {
  try {
    return new Date(iso).toLocaleDateString(lang === "en" ? "en-GB" : "tr-TR", { day: "numeric", month: "long" });
  } catch {
    return "";
  }
}

export function ActivitiesPage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [elig, setElig] = useState<ActivityEligibility | null>(null);

  const load = () => actApi.list<{ items: ActivityItem[] }>(50).then((r) => setItems(r.items)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (user) actApi.eligibility<ActivityEligibility>().then(setElig).catch(() => setElig(null));
  }, [user]);

  // Generic requirement numbers (match backend); use live values when available.
  const need = elig?.need ?? { connections: 20, rating: 4, reviews: 10 };

  const featured = useMemo(() => items.find((a) => a.pinned && a.youtubeId) ?? null, [items]);
  const rest = useMemo(() => items.filter((a) => a.id !== featured?.id), [items, featured]);
  const shown = showAll ? rest : rest.slice(0, 5);

  return (
    <div className="container-x py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-semibold">{t("Aktiviteler", "Activities")}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {t("Topluluktan paylaşımlar, online ve yüz yüze buluşmalar, duyurular ve podcast'ler.", "Posts from the community, online and in-person meetups, announcements and podcasts.")}
          </p>
        </div>
        {user && elig?.canSubmit && (
          <Button size="sm" onClick={() => setFormOpen((o) => !o)}>{formOpen ? t("Kapat", "Close") : t("＋ Aktivite paylaş", "＋ Share an activity")}</Button>
        )}
      </div>

      {formOpen && user && elig?.canSubmit && <ActivityForm onDone={() => { setFormOpen(false); load(); }} />}

      {loading ? (
        <div className="py-16 text-center text-ink-500">{t("Yükleniyor…", "Loading…")}</div>
      ) : (
        <>
          {featured && <FeaturedVideo a={featured} />}

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {shown.map((a) => <ActivityCard key={a.id} a={a} />)}
          </div>

          {rest.length > 5 && (
            <div className="mt-6 text-center">
              <Button variant="outline" onClick={() => setShowAll((s) => !s)}>
                {showAll ? t("Daha az göster", "Show less") : t(`Arşiv — tümünü gör (${rest.length})`, `Archive — see all (${rest.length})`)}
              </Button>
            </div>
          )}

          {rest.length === 0 && !featured && (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong p-10 text-center text-sm text-ink-500">
              {t("Henüz aktivite yok.", "No activities yet.")}
            </div>
          )}

          {/* Genel bilgi (kişisel ilerleme Profil sayfasında). */}
          <div className="mt-12 rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-sand-100 p-4 text-sm text-ink-600">
            <span className="font-semibold">{t("Aktivite paylaşmak için", "To share an activity")}:</span>{" "}
            {t(
              `en az ${need.connections} bağlantı, ${need.rating.toFixed(1)} ortalama puan ve ${need.reviews} değerlendirme gerekir. Durumunu “Profilim” sayfandan görebilirsin.`,
              `you need at least ${need.connections} connections, a ${need.rating.toFixed(1)} average rating and ${need.reviews} reviews. You can see your progress on your profile page.`,
            )}
          </div>
        </>
      )}
    </div>
  );

  function FeaturedVideo({ a }: { a: ActivityItem }) {
    const [play, setPlay] = useState(false);
    const kindLabel = useKindLabel();
    return (
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
        <div className="relative aspect-video bg-forest-900">
          {play ? (
            <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${a.youtubeId}?autoplay=1`} title={a.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          ) : (
            <button onClick={() => setPlay(true)} className="group relative h-full w-full" aria-label={t("Videoyu oynat", "Play video")}>
              <img src={youtubeThumb(a.youtubeId!)} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 grid place-items-center bg-forest-900/30 transition group-hover:bg-forest-900/40">
                <span className="grid size-16 place-items-center rounded-full bg-white/90 text-2xl text-forest-700 shadow-lg">▶</span>
              </span>
            </button>
          )}
        </div>
        <div className="p-5">
          <div className="mb-1 text-xs font-semibold tracking-wide text-clay-600">{kindLabel.video} · {t("ÖNE ÇIKAN", "FEATURED")}</div>
          <h2 className="font-display text-xl font-semibold">{a.title}</h2>
          {a.desc && <p className="mt-1.5 text-sm text-ink-700">{a.desc}</p>}
          <div className="mt-2 text-xs text-ink-500">{[a.author, a.place, fmtDate(a.date, lang)].filter(Boolean).join(" · ")}</div>
        </div>
      </div>
    );
  }

  function ActivityCard({ a }: { a: ActivityItem }) {
    const kindLabel = useKindLabel();
    return (
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
        {a.image && <div className="h-44 bg-cover bg-center bg-moss-300" style={{ backgroundImage: `url(${a.image})` }} />}
        <div className="p-5">
          <div className="mb-1 text-xs font-semibold tracking-wide text-clay-600">{kindLabel[a.kind]}</div>
          <h3 className="font-display text-[17px] font-semibold">{a.title}</h3>
          {a.desc && <p className="mt-1.5 text-sm text-ink-700">{a.desc}</p>}
          {a.kind === "meeting" && a.when && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-sand-100 px-3 py-1.5 text-xs font-medium text-ink-700">
              <span>{a.online ? t("🟢 Online", "🟢 Online") : t("📍 Yüz yüze", "📍 In person")}</span><span>·</span><span>{a.when}</span>
            </div>
          )}
          <div className="mt-3 text-xs text-ink-500">{[a.author, a.place, fmtDate(a.date, lang)].filter(Boolean).join(" · ")}</div>
        </div>
      </div>
    );
  }

}
