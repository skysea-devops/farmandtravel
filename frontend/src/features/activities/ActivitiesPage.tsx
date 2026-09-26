import { useState } from "react";
import { ACTIVITIES, youtubeThumb, type Activity } from "@/data/activities";

const kindLabel: Record<Activity["kind"], string> = {
  video: "🎥 Podcast",
  photo: "📷 Paylaşım",
  meeting: "📅 Buluşma",
  announcement: "📢 Duyuru",
};

export function ActivitiesPage() {
  const featured = ACTIVITIES.find((a) => a.kind === "video") ?? ACTIVITIES[0];
  const rest = ACTIVITIES.filter((a) => a.id !== featured.id);

  return (
    <div className="container-x py-10">
      <h1 className="font-display text-[28px] font-semibold">Aktiviteler</h1>
      <p className="mb-8 text-sm text-ink-500">
        Topluluktan paylaşımlar, online ve yüz yüze buluşmalar, duyurular ve podcast'ler.
      </p>

      {/* Öne çıkan: kurucu podcast */}
      {featured.youtubeId && <FeaturedVideo activity={featured} />}

      {/* Akış */}
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {rest.map((a) => <ActivityCard key={a.id} a={a} />)}
      </div>
    </div>
  );
}

function FeaturedVideo({ activity }: { activity: Activity }) {
  const [play, setPlay] = useState(false);
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
          <button onClick={() => setPlay(true)} className="group relative h-full w-full" aria-label="Videoyu oynat">
            <img src={youtubeThumb(activity.youtubeId!)} alt="" className="h-full w-full object-cover" />
            <span className="absolute inset-0 grid place-items-center bg-forest-900/30 transition group-hover:bg-forest-900/40">
              <span className="grid size-16 place-items-center rounded-full bg-white/90 text-2xl text-forest-700 shadow-lg">▶</span>
            </span>
          </button>
        )}
      </div>
      <div className="p-5">
        <div className="mb-1 text-xs font-semibold tracking-wide text-clay-600">{kindLabel.video} · ÖNE ÇIKAN</div>
        <h2 className="font-display text-xl font-semibold">{activity.title}</h2>
        <p className="mt-1.5 text-sm text-ink-700">{activity.desc}</p>
        <div className="mt-2 text-xs text-ink-500">{activity.author} · {activity.place} · {activity.date}</div>
      </div>
    </div>
  );
}

function ActivityCard({ a }: { a: Activity }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
      {a.image && <div className="h-44 bg-cover bg-center bg-moss-300" style={{ backgroundImage: `url(${a.image})` }} />}
      <div className="p-5">
        <div className="mb-1 text-xs font-semibold tracking-wide text-clay-600">{kindLabel[a.kind]}</div>
        <h3 className="font-display text-[17px] font-semibold">{a.title}</h3>
        <p className="mt-1.5 text-sm text-ink-700">{a.desc}</p>
        {a.kind === "meeting" && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-sand-100 px-3 py-1.5 text-xs font-medium text-ink-700">
            <span>{a.online ? "🟢 Online" : "📍 Yüz yüze"}</span><span>·</span><span>{a.when}</span>
          </div>
        )}
        <div className="mt-3 text-xs text-ink-500">
          {a.author ? `${a.author} · ${a.place} · ` : ""}{a.date}
        </div>
      </div>
    </div>
  );
}
