import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { activities as actApi, uploadImage } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { ActivityItem, ActivityKind } from "@/lib/types";

const inp = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600";

// Paylaşım formu. Üye gönderir → pending; admin gönderir → published (backend karar verir).
// admin=true iken video türü, erişim (public/members), süre, detay ve link alanları açılır.
export function ActivityForm({ onDone, admin = false }: { onDone: () => void; admin?: boolean }) {
  const { t } = useI18n();
  const [kind, setKind] = useState<ActivityKind>(admin ? "video" : "photo");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [place, setPlace] = useState("");
  const [eventDate, setEventDate] = useState(""); // datetime-local
  const [online, setOnline] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [youtubeId, setYoutubeId] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [access, setAccess] = useState<"public" | "members">("members");
  const [detail, setDetail] = useState("");
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) return;
    if (kind === "video" && youtubeId.trim().length < 1) { setMsg(t("YouTube video ID gerekli.", "YouTube video ID is required.")); return; }
    setBusy(true); setMsg(null);
    try {
      let imageKey: string | undefined;
      if (kind === "photo" && file) imageKey = await uploadImage(file, "gallery");
      const dur = durationMin.trim() ? Number(durationMin) : undefined;
      const created = await actApi.submit<ActivityItem>({
        kind, title, desc: desc || undefined, place: place || undefined, imageKey,
        eventDate: kind === "meeting" && eventDate ? new Date(eventDate).toISOString() : undefined,
        online: kind === "meeting" ? online : undefined,
        youtubeId: kind === "video" ? youtubeId.trim() : undefined,
        durationMin: kind === "video" && dur && !Number.isNaN(dur) ? dur : undefined,
        ...(admin ? { access } : {}),
        detail: detail.trim() || undefined,
        link: link.trim() || undefined,
      });
      setMsg(
        created?.status === "published"
          ? t("Yayınlandı! Sitede görünüyor.", "Published! It's live on the site.")
          : t("Gönderildi! Bir yönetici onayladıktan sonra yayınlanacak.", "Sent! It will be published once an admin approves it."),
      );
      setTitle(""); setDesc(""); setPlace(""); setEventDate(""); setFile(null); setYoutubeId(""); setDurationMin(""); setDetail(""); setLink("");
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
            {admin && <option value="video">{t("Video / seminer kaydı", "Video / recorded session")}</option>}
            <option value="photo">{t("Paylaşım (fotoğraf)", "Post (photo)")}</option>
            <option value="meeting">{t("Buluşma / etkinlik", "Meetup / event")}</option>
            <option value="announcement">{t("Duyuru", "Announcement")}</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink-700">{t("Başlık", "Title")}</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inp} required maxLength={140} />
        </label>
      </div>

      {admin && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t("Erişim", "Access")}</span>
            <select value={access} onChange={(e) => setAccess(e.target.value as "public" | "members")} className={inp}>
              <option value="members">{t("Üyelere özel (paralı)", "Members only (paid)")}</option>
              <option value="public">{t("Herkese açık (ücretsiz/tanıtım)", "Public (free / promo)")}</option>
            </select>
          </label>
        </div>
      )}

      <label className="mt-3 block text-sm">
        <span className="mb-1 block font-medium text-ink-700">{t("Açıklama", "Description")}</span>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className={inp} maxLength={2000} />
      </label>

      {kind === "video" && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t("YouTube video ID", "YouTube video ID")}</span>
            <input value={youtubeId} onChange={(e) => setYoutubeId(e.target.value)} className={inp} placeholder="jOW8K7XUX4o" maxLength={20} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t("Süre (dk)", "Duration (min)")}</span>
            <input value={durationMin} onChange={(e) => setDurationMin(e.target.value.replace(/\D/g, ""))} className={inp} placeholder="45" inputMode="numeric" />
          </label>
        </div>
      )}

      {kind === "photo" && (
        <label className="mt-3 block text-sm">
          <span className="mb-1 block font-medium text-ink-700">{t("Fotoğraf", "Photo")}</span>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
        </label>
      )}

      {kind === "meeting" && (
        <>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink-700">{t("Tarih & saat", "Date & time")}</span>
              <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className={inp} />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink-700">{t("Yer / platform", "Place / platform")}</span>
              <input value={place} onChange={(e) => setPlace(e.target.value)} className={inp} placeholder={t("Zoom / Sintra", "Zoom / Sintra")} />
            </label>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={online} onChange={(e) => setOnline(e.target.checked)} /> {t("Online buluşma", "Online meetup")}
          </label>
        </>
      )}

      {(kind === "photo" || kind === "announcement") && (
        <label className="mt-3 block text-sm">
          <span className="mb-1 block font-medium text-ink-700">{t("Yer (isteğe bağlı)", "Place (optional)")}</span>
          <input value={place} onChange={(e) => setPlace(e.target.value)} className={inp} placeholder="Konya" />
        </label>
      )}

      {(kind === "meeting" || kind === "video") && (
        <>
          <label className="mt-3 block text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t("Katılım şartları / detay", "Participation details")} <span className="font-normal text-ink-400">({t("isteğe bağlı", "optional")})</span></span>
            <textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows={2} className={inp} maxLength={4000} placeholder={t("Kimler katılabilir, ne getirmeli, nasıl hazırlanmalı…", "Who can join, what to bring, how to prepare…")} />
          </label>
          <label className="mt-3 block text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t("Kayıt / katılım linki", "Registration / join link")} <span className="font-normal text-ink-400">({t("isteğe bağlı", "optional")})</span></span>
            <input value={link} onChange={(e) => setLink(e.target.value)} className={inp} placeholder="https://" maxLength={500} />
          </label>
        </>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" disabled={busy}>{busy ? t("Gönderiliyor…", "Sending…") : t("Gönder", "Submit")}</Button>
        {msg && <span className="text-sm text-ink-600">{msg}</span>}
      </div>
    </form>
  );
}
