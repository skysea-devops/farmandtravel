import { useEffect, useMemo, useState } from "react";
import { youtubeThumb } from "@/data/activities";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { activities as actApi, uploadImage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
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

      {user && elig && !elig.canSubmit && (
        <div className="mb-8 rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-sand-100 p-4 text-sm text-ink-700">
          <div className="mb-1 font-semibold">{t("Aktivite paylaşmak için", "To share an activity you need")}:</div>
          <ul className="ml-4 list-disc space-y-0.5">
            <li className={elig.connections >= elig.need.connections ? "text-forest-600" : ""}>
              {t(`En az ${elig.need.connections} bağlantı`, `At least ${elig.need.connections} connections`)} — {t("sende", "you have")} {elig.connections}
            </li>
            <li className={elig.ratingAvg >= elig.need.rating ? "text-forest-600" : ""}>
              {t(`En az ${elig.need.rating} ortalama puan`, `At least ${elig.need.rating} average rating`)} — {t("sende", "you have")} {elig.ratingAvg}
            </li>
            <li className={elig.ratingCount >= elig.need.reviews ? "text-forest-600" : ""}>
              {t(`En az ${elig.need.reviews} yorum`, `At least ${elig.need.reviews} reviews`)} — {t("sende", "you have")} {elig.ratingCount}
            </li>
          </ul>
        </div>
      )}

      {formOpen && user && elig?.canSubmit && <SubmitForm onDone={() => { setFormOpen(false); load(); }} />}

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

  function SubmitForm({ onDone }: { onDone: () => void }) {
    const [kind, setKind] = useState<ActivityKind>("photo");
    const [title, setTitle] = useState("");
    const [desc, setDesc] = useState("");
    const [place, setPlace] = useState("");
    const [when, setWhen] = useState("");
    const [online, setOnline] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const inp = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600";

    async function submit(e: React.FormEvent) {
      e.preventDefault();
      if (title.trim().length < 3) return;
      setBusy(true); setMsg(null);
      try {
        let imageKey: string | undefined;
        if (kind === "photo" && file) imageKey = await uploadImage(file, "gallery");
        await actApi.submit({ kind, title, desc: desc || undefined, place: place || undefined, imageKey, when: when || undefined, online: kind === "meeting" ? online : undefined });
        setMsg(t("Gönderildi! Bir yönetici onayladıktan sonra yayınlanacak.", "Sent! It will be published once an admin approves it."));
        setTimeout(onDone, 1200);
      } catch {
        setMsg(t("Gönderilemedi, tekrar dene.", "Couldn't send, please try again."));
      } finally {
        setBusy(false);
      }
    }

    return (
      <form onSubmit={submit} className="mb-8 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h3 className="font-display mb-3 text-lg font-semibold">{t("Aktivite paylaş", "Share an activity")}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t("Tür", "Type")}</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as ActivityKind)} className={inp}>
              <option value="photo">{t("Paylaşım (fotoğraf)", "Post (photo)")}</option>
              <option value="meeting">{t("Buluşma", "Meetup")}</option>
              <option value="announcement">{t("Duyuru", "Announcement")}</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t("Başlık", "Title")}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inp} required maxLength={140} />
          </label>
        </div>
        <label className="mt-3 block text-sm">
          <span className="mb-1 block font-medium text-ink-700">{t("Açıklama", "Description")}</span>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className={inp} maxLength={2000} />
        </label>
        {kind === "photo" && (
          <label className="mt-3 block text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t("Fotoğraf", "Photo")}</span>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
          </label>
        )}
        {kind === "meeting" && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink-700">{t("Tarih/saat/yer", "Date/time/place")}</span>
              <input value={when} onChange={(e) => setWhen(e.target.value)} className={inp} placeholder={t("18 Eylül, 20:00 · Zoom", "18 Sep, 20:00 · Zoom")} />
            </label>
            <label className="mt-6 flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} /> {t("Online buluşma", "Online meetup")}
            </label>
          </div>
        )}
        {(kind === "photo" || kind === "announcement") && (
          <label className="mt-3 block text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t("Yer (isteğe bağlı)", "Place (optional)")}</span>
            <input value={place} onChange={(e) => setPlace(e.target.value)} className={inp} placeholder={t("🇹🇷 Konya", "🇹🇷 Konya")} />
          </label>
        )}
        <div className="mt-4 flex items-center gap-3">
          <Button type="submit" disabled={busy}>{busy ? t("Gönderiliyor…", "Sending…") : t("Onaya gönder", "Submit for review")}</Button>
          {msg && <span className="text-sm text-ink-600">{msg}</span>}
        </div>
      </form>
    );
  }
}
