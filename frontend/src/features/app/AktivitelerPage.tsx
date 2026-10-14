import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { PlayCircle, Image as ImageIcon, CalendarDays, Megaphone, Lock, Users, Clock, MapPin, ChevronLeft, ExternalLink, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api, activities as actApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { listTime } from "@/lib/time";
import type { ActivityItem, Profile } from "@/lib/types";

const KIND_ICON: Record<string, LucideIcon> = { video: PlayCircle, photo: ImageIcon, meeting: CalendarDays, announcement: Megaphone };
const kindLabel = (k: string, t: (tr: string, en: string) => string) =>
  k === "video" ? t("Video", "Video") : k === "photo" ? t("Paylaşım", "Post") : k === "meeting" ? t("Etkinlik", "Event") : t("Duyuru", "Announcement");

function usePaid() {
  const [paid, setPaid] = useState<boolean | null>(null);
  useEffect(() => {
    api.getCached<Profile>("/profile/me")
      .then((p) => setPaid(!!p.isAdmin || p.plan === "frontier" || p.plan === "active"))
      .catch(() => setPaid(false));
  }, []);
  return paid;
}

export function AktivitelerPage() {
  const { id } = useParams();
  return id ? <ActivityDetail id={id} /> : <ActivityList />;
}

function ActivityList() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const paid = usePaid();
  const [items, setItems] = useState<ActivityItem[] | null>(null);

  useEffect(() => {
    actApi.list<{ items: ActivityItem[] }>(30).then((r) => setItems(r.items)).catch(() => setItems([]));
  }, []);

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display mb-1 text-2xl font-semibold">{t("Aktiviteler", "Activities")}</h1>
        <p className="text-sm text-ink-500">{t("Topluluğun videoları, seminer kayıtları ve etkinlikleri. Üyelere özel içeriğe üyelikle erişirsin.", "Community videos, recorded sessions and events. Members-only content opens with membership.")}</p>
      </div>

      {items === null ? (
        <div className="py-16 text-center text-ink-500">{t("Yükleniyor…", "Loading…")}</div>
      ) : items.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong p-10 text-center text-sm text-ink-500">
          {t("Henüz aktivite yok.", "No activities yet.")}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => {
            const Icon = KIND_ICON[a.kind] ?? Megaphone;
            const locked = a.access === "members" && paid === false;
            return (
              <button key={a.id} onClick={() => navigate(`/app/aktiviteler/${a.id}`)}
                className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface text-left transition hover:border-forest-500 hover:shadow-sm">
                <div className="relative aspect-[16/10] bg-sand-100">
                  {a.image
                    ? <img src={a.image} alt="" className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
                    : <div className="grid h-full w-full place-items-center text-moss-500"><Icon size={40} strokeWidth={1.5} /></div>}
                  <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-ink-900/70 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                    <Icon size={12} strokeWidth={2} /> {kindLabel(a.kind, t)}
                  </span>
                  {a.access === "members" && (
                    <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-clay-600/90 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                      <Lock size={11} strokeWidth={2} /> {locked ? t("Üyelere özel", "Members") : t("Üye içeriği", "Member")}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-3.5">
                  <h3 className="font-display text-[15px] font-semibold leading-snug text-ink-900">{a.title}</h3>
                  {a.desc && <p className="mt-1 line-clamp-2 text-[13px] text-ink-600">{a.desc}</p>}
                  <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-400">
                    {a.author && <span>{a.author}</span>}
                    {a.kind === "video" && a.durationMin ? <span className="inline-flex items-center gap-1"><Clock size={12} strokeWidth={1.75} /> {a.durationMin} {t("dk", "min")}</span> : null}
                    {a.kind === "meeting" && (a.participantCount ?? 0) > 0 ? <span className="inline-flex items-center gap-1"><Users size={12} strokeWidth={1.75} /> {a.participantCount}</span> : null}
                    <span className="ml-auto">{listTime(a.date)}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActivityDetail({ id }: { id: string }) {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const paid = usePaid();
  const [a, setA] = useState<ActivityItem | null | undefined>(undefined); // undefined=loading, null=not found
  const [joining, setJoining] = useState(false);

  function load() {
    actApi.detail<ActivityItem>(id).then(setA).catch(() => setA(null));
  }
  useEffect(load, [id]);

  async function toggleJoin() {
    if (!a) return;
    if (paid === false) { navigate("/app/abonelik"); return; }
    setJoining(true);
    try {
      const r = a.joined ? await actApi.leave<{ joined: boolean; participantCount: number }>(id) : await actApi.join<{ joined: boolean; participantCount: number }>(id);
      setA({ ...a, joined: r.joined, participantCount: r.participantCount });
    } finally { setJoining(false); }
  }

  if (a === undefined) return <div className="py-16 text-center text-ink-500">{t("Yükleniyor…", "Loading…")}</div>;
  if (a === null) return (
    <div className="py-16 text-center text-ink-700">
      {t("Aktivite bulunamadı.", "Activity not found.")}
      <div className="mt-3"><Link to="/app/aktiviteler" className="text-forest-600 underline">{t("← Aktiviteler", "← Activities")}</Link></div>
    </div>
  );

  const Icon = KIND_ICON[a.kind] ?? Megaphone;

  return (
    <div className="max-w-3xl">
      <Link to="/app/aktiviteler" className="mb-4 inline-flex items-center gap-1 text-sm text-forest-600 hover:underline">
        <ChevronLeft size={15} strokeWidth={2} /> {t("Aktiviteler", "Activities")}
      </Link>

      <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px] text-ink-400">
        <span className="inline-flex items-center gap-1 rounded-full bg-sand-100 px-2 py-0.5 font-medium text-ink-600"><Icon size={12} strokeWidth={2} /> {kindLabel(a.kind, t)}</span>
        {a.author && <span>{a.author}</span>}
        <span className="ml-auto">{listTime(a.date)}</span>
      </div>
      <h1 className="font-display text-2xl font-semibold leading-tight">{a.title}</h1>
      {a.desc && <p className="mt-2 text-[15px] leading-relaxed text-ink-700">{a.desc}</p>}

      {/* Kilitli (üyelere özel + ödemesiz) → teaser + paywall */}
      {a.locked ? (
        <div className="mt-5 overflow-hidden rounded-[var(--radius-lg)] border border-border">
          {a.image && <img src={a.image} alt="" className="h-52 w-full object-cover" />}
          <div className="flex flex-col items-center gap-3 bg-sand-100 px-6 py-8 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-clay-600/10 text-clay-600"><Lock size={24} strokeWidth={1.75} /></span>
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">{t("Bu içerik üyelere özel", "This content is members-only")}</h2>
              <p className="mx-auto mt-1 max-w-sm text-sm text-ink-600">{t("Seminer kayıtları, etkinlikler ve topluluğun tüm içeriğine üyelikle erişirsin.", "Membership unlocks recorded sessions, events and all community content.")}</p>
            </div>
            <Link to="/app/abonelik"><Button>{t("Üyeliğe geç", "Get membership")}</Button></Link>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          {a.kind === "video" && a.youtubeId && (
            <div className="aspect-video overflow-hidden rounded-[var(--radius-lg)] border border-border bg-black">
              <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${a.youtubeId}`} title={a.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          )}
          {a.kind === "photo" && a.image && (
            <img src={a.image} alt="" className="w-full rounded-[var(--radius-lg)] border border-border object-cover" />
          )}

          {(a.eventDate || a.when || a.place || a.online != null) && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-[var(--radius-lg)] border border-border bg-surface px-4 py-3 text-sm text-ink-700">
              {(a.eventDate || a.when) && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={15} strokeWidth={1.75} className="text-forest-600" />
                  {a.eventDate ? new Date(a.eventDate).toLocaleString(lang === "en" ? "en-GB" : "tr-TR", { dateStyle: "medium", timeStyle: "short" }) : a.when}
                  {a.past && <span className="ml-1.5 rounded-full bg-sand-200 px-2 py-0.5 text-[11px] font-medium text-ink-500">{t("Geçti", "Ended")}</span>}
                </span>
              )}
              {a.place && <span className="inline-flex items-center gap-1.5"><MapPin size={15} strokeWidth={1.75} className="text-forest-600" /> {a.place}</span>}
              {a.online != null && <span className="inline-flex items-center gap-1.5">{a.online ? <><span className="size-2 rounded-full bg-forest-500" /> {t("Online", "Online")}</> : t("Yüz yüze", "In person")}</span>}
              {(a.participantCount ?? 0) > 0 && <span className="inline-flex items-center gap-1.5"><Users size={15} strokeWidth={1.75} className="text-forest-600" /> {a.participantCount} {t("katılımcı", "joined")}</span>}
            </div>
          )}

          {a.detail && (
            <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="mb-1.5 text-[13px] font-medium text-ink-600">{t("Katılım şartları & detay", "Participation & details")}</div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">{a.detail}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2.5">
            {a.kind === "meeting" && (
              a.past && !a.joined ? (
                <span className="inline-flex items-center rounded-full bg-sand-100 px-4 py-2 text-sm font-medium text-ink-500">{t("Bu etkinlik sona erdi", "This event has ended")}</span>
              ) : (
                <Button onClick={toggleJoin} disabled={joining || (a.past && !a.joined)} variant={a.joined ? "outline" : "primary"}>
                  {a.joined ? <><Check size={16} strokeWidth={2} /> {t("Katılıyorsun", "You're in")}</> : t("Katıl", "Join")}
                </Button>
              )
            )}
            {a.link && (
              <a href={a.link} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-border-strong px-[18px] py-2.5 text-sm font-semibold text-forest-700 transition hover:bg-sand-100">
                <ExternalLink size={16} strokeWidth={1.75} /> {t("Kayıt / katılım linki", "Registration / join link")}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
