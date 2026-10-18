import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PlayCircle, Image as ImageIcon, CalendarDays, Megaphone, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { activities as actApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { listTime } from "@/lib/time";
import type { ActivityItem } from "@/lib/types";

const KIND_ICON: Record<string, LucideIcon> = { video: PlayCircle, photo: ImageIcon, meeting: CalendarDays, announcement: Megaphone };

// Ortak "Son etkinlikler" şeridi — hem app Aktiviteler sayfasında hem ana sayfada.
// Sabit (pinned) içerikler başta gelir; kartlar app aktivite detayına gider.
export function LatestActivities({ limit = 4, excludeId, showHeader = true }: { limit?: number; excludeId?: string; showHeader?: boolean }) {
  const { t } = useI18n();
  const [items, setItems] = useState<ActivityItem[] | null>(null);

  useEffect(() => {
    actApi.list<{ items: ActivityItem[] }>(limit + 2).then((r) => setItems(r.items)).catch(() => setItems([]));
  }, [limit]);

  const kindLabel = (k: string) =>
    k === "video" ? t("Video", "Video") : k === "photo" ? t("Paylaşım", "Post") : k === "meeting" ? t("Etkinlik", "Event") : t("Duyuru", "Announcement");

  const list = (items ?? []).filter((a) => a.id !== excludeId).slice(0, limit);
  if (!items || list.length === 0) return null;

  return (
    <section>
      {showHeader && (
        <div className="mb-3 flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold">{t("Son etkinlikler", "Latest")}</h2>
          <Link to="/app/aktiviteler" className="text-sm font-medium text-forest-600 hover:underline">{t("Tümü", "See all")}</Link>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {list.map((a) => {
          const Icon = KIND_ICON[a.kind] ?? Megaphone;
          return (
            <Link key={a.id} to={`/app/aktiviteler/${a.id}`}
              className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface transition hover:border-forest-500 hover:shadow-sm">
              <div className="relative h-36 shrink-0 overflow-hidden bg-sand-100">
                {a.image
                  ? <img src={a.image} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
                  : <div className="grid h-full w-full place-items-center text-moss-500"><Icon size={34} strokeWidth={1.5} /></div>}
                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-ink-900/70 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                  <Icon size={11} strokeWidth={2} /> {kindLabel(a.kind)}
                </span>
                {a.pinned && <span className="absolute right-2 top-2 rounded-full bg-forest-600/90 px-2 py-0.5 text-[11px] font-medium text-white">{t("Sabit", "Pinned")}</span>}
                {a.access === "members" && !a.pinned && <span className="absolute right-2 top-2 inline-flex items-center rounded-full bg-clay-600/90 p-1 text-white"><Lock size={11} strokeWidth={2} /></span>}
              </div>
              <div className="flex flex-1 flex-col p-3">
                <h3 className="font-display line-clamp-2 text-[14px] font-semibold leading-snug text-ink-900">{a.title}</h3>
                <div className="mt-2 flex items-center justify-between gap-2 text-[11.5px] text-ink-400">
                  <span className="truncate">{a.author ?? ""}</span>
                  <span className="shrink-0">{listTime(a.date)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
