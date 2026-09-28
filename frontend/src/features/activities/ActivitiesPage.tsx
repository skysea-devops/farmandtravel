import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ACTIVITIES, youtubeThumb, type Activity } from "@/data/activities";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

function useKindLabel() {
  const { t } = useI18n();
  const map: Record<Activity["kind"], string> = {
    video: t("🎥 Podcast", "🎥 Podcast"),
    photo: t("📷 Paylaşım", "📷 Post"),
    meeting: t("📅 Buluşma", "📅 Meetup"),
    announcement: t("📢 Duyuru", "📢 Announcement"),
  };
  return map;
}

export function ActivitiesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  // Podcast (video) is open to everyone; other activities prompt sign-up.
  const gate = () => navigate(user ? "/app" : "/kayit");
  const featured = ACTIVITIES.find((a) => a.kind === "video") ?? ACTIVITIES[0];
  const rest = ACTIVITIES.filter((a) => a.id !== featured.id);

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-[28px] font-semibold">{t("Aktiviteler", "Activities")}</h1>
      <p className="mb-8 text-sm text-ink-500">
        {t("Topluluktan paylaşımlar, online ve yüz yüze buluşmalar, duyurular ve podcast'ler.", "Posts from the community, online and in-person meetups, announcements and podcasts.")}
      </p>

      {/* Öne çıkan: kurucu podcast */}
      {featured.youtubeId && <FeaturedVideo activity={featured} />}

      {/* Akış */}
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {rest.map((a) => <ActivityCard key={a.id} a={a} onClick={gate} />)}
      </div>
    </div>
  );
}

function FeaturedVideo({ activity }: { activity: Activity }) {
  const [play, setPlay] = useState(false);
  const { t } = useI18n();
  const kindLabel = useKindLabel();
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
      <div className="relative aspect-video bg-forest-900">
        {play ? (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${activity.youtubeId}?autoplay=1`}
            title={activity.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button onClick={() => setPlay(true)} className="group relative h-full w-full" aria-label={t("Videoyu oynat", "Play video")}>
            <img src={youtubeThumb(activity.youtubeId!)} alt="" className="h-full w-full object-cover" />
            <span className="absolute inset-0 grid place-items-center bg-forest-900/30 transition group-hover:bg-forest-900/40">
              <span className="grid size-16 place-items-center rounded-full bg-white/90 text-2xl text-forest-700 shadow-lg">▶</span>
            </span>
          </button>
        )}
      </div>
      <div className="p-5">
        <div className="mb-1 text-xs font-semibold tracking-wide text-clay-600">{kindLabel.video} · {t("ÖNE ÇIKAN", "FEATURED")}</div>
        <h2 className="font-display text-xl font-semibold">{activity.title}</h2>
        <p className="mt-1.5 text-sm text-ink-700">{activity.desc}</p>
        <div className="mt-2 text-xs text-ink-500">{activity.author} · {activity.place} · {activity.date}</div>
      </div>
    </div>
  );
}

function ActivityCard({ a, onClick }: { a: Activity; onClick: () => void }) {
  const { t } = useI18n();
  const kindLabel = useKindLabel();
  return (
    <button onClick={onClick} className="group block overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface text-left transition hover:border-forest-500 hover:shadow-sm">
      {a.image && <div className="h-44 bg-cover bg-center bg-moss-300" style={{ backgroundImage: `url(${a.image})` }} />}
      <div className="p-5">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wide text-clay-600">{kindLabel[a.kind]}</span>
          <span className="text-xs text-ink-400 opacity-0 transition group-hover:opacity-100">{t("🔒 Üye ol", "🔒 Join")}</span>
        </div>
        <h3 className="font-display text-[17px] font-semibold">{a.title}</h3>
        <p className="mt-1.5 text-sm text-ink-700">{a.desc}</p>
        {a.kind === "meeting" && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-sand-100 px-3 py-1.5 text-xs font-medium text-ink-700">
            <span>{a.online ? t("🟢 Online", "🟢 Online") : t("📍 Yüz yüze", "📍 In person")}</span><span>·</span><span>{a.when}</span>
          </div>
        )}
        <div className="mt-3 text-xs text-ink-500">
          {a.author ? `${a.author} · ${a.place} · ` : ""}{a.date}
        </div>
      </div>
    </button>
  );
}
