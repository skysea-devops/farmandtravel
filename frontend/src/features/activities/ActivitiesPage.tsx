import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { youtubeThumb } from "@/data/activities";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { activities as actApi } from "@/lib/api";
import { Video, Camera, CalendarDays, Megaphone, Circle, MapPin, Play } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ActivityForm } from "./ActivityForm";
import type { ActivityItem, ActivityKind, ActivityEligibility } from "@/lib/types";

function useKindLabel() {
  const { t } = useI18n();
  const map: Record<ActivityKind, { Icon: LucideIcon; label: string }> = {
    video: { Icon: Video, label: t("Podcast", "Podcast") },
    photo: { Icon: Camera, label: t("Paylaşım", "Post") },
    meeting: { Icon: CalendarDays, label: t("Buluşma", "Meetup") },
    announcement: { Icon: Megaphone, label: t("Duyuru", "Announcement") },
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

// Etkinlik tarihi + saat (buluşma kartında gösterilir).
function fmtWhen(iso: string, lang: string) {
  try {
    return new Date(iso).toLocaleString(lang === "en" ? "en-GB" : "tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function langLabel(l: string | null | undefined, lang: string): string | null {
  if (!l) return null;
  if (l === "both") return lang === "en" ? "TR + EN" : "TR + EN";
  if (l === "en") return lang === "en" ? "English" : "İngilizce";
  return lang === "en" ? "Turkish" : "Türkçe";
}

export function ActivitiesPage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const nav = useNavigate();
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
                <span className="grid size-16 place-items-center rounded-full bg-white/90 text-forest-700 shadow-lg"><Play className="size-7 fill-current" /></span>
              </span>
            </button>
          )}
        </div>
        <div className="p-5">
          <div className="mb-1 flex items-center gap-1 text-xs font-semibold tracking-wide text-clay-600"><kindLabel.video.Icon className="size-3.5" /> {kindLabel.video.label} · {t("ÖNE ÇIKAN", "FEATURED")}</div>
          <h2 className="font-display text-xl font-semibold">{a.title}</h2>
          {a.desc && <p className="mt-1.5 text-sm text-ink-700">{a.desc}</p>}
          <div className="mt-2 text-xs text-ink-500">{[a.author, a.place, fmtDate(a.date, lang)].filter(Boolean).join(" · ")}</div>
        </div>
      </div>
    );
  }

  function ActivityCard({ a }: { a: ActivityItem }) {
    const kindLabel = useKindLabel();
    // Üye ise app aktiviteler detayına (linke oradan ulaşır); değilse üye olma davetine.
    const go = () => nav(user ? `/app/aktiviteler/${a.id}` : "/kayit");
    const when = a.kind === "meeting" ? (a.eventDate ? fmtWhen(a.eventDate, lang) : a.when) : null;
    const lbl = langLabel(a.lang, lang);
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={go}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } }}
        className="cursor-pointer overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface transition hover:border-forest-600 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-600"
      >
        {a.image && <div className="h-44 bg-cover bg-center bg-moss-300" style={{ backgroundImage: `url(${a.image})` }} />}
        <div className="p-5">
          <div className="mb-1 flex items-center gap-1 text-xs font-semibold tracking-wide text-clay-600">{(() => { const K = kindLabel[a.kind]; return <><K.Icon className="size-3.5" /> {K.label}</>; })()}</div>
          <h3 className="font-display text-[17px] font-semibold">{a.title}</h3>
          {a.desc && <p className="mt-1.5 text-sm text-ink-700">{a.desc}</p>}
          {(when || lbl) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {a.kind === "meeting" && when && (
                <span className="inline-flex items-center gap-2 rounded-full bg-sand-100 px-3 py-1.5 text-xs font-medium text-ink-700">
                  <span className="inline-flex items-center gap-1">{a.online ? <><Circle className="size-2.5 fill-forest-600 text-forest-600" /> Online</> : <><MapPin className="size-3.5" /> {t("Yüz yüze", "In person")}</>}</span><span>·</span><span>{when}</span>
                </span>
              )}
              {lbl && (
                <span className="inline-flex items-center rounded-full bg-moss-300/40 px-3 py-1.5 text-xs font-medium text-forest-700">
                  {t("Dil", "Language")}: {lbl}
                </span>
              )}
            </div>
          )}
          <div className="mt-3 text-xs text-ink-500">{[a.author, a.place, fmtDate(a.date, lang)].filter(Boolean).join(" · ")}</div>
        </div>
      </div>
    );
  }

}
