import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { activities as actApi, uploadImage, uploadVideo } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { ActivityItem, ActivityKind } from "@/lib/types";

const inp = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600";

// ISO → datetime-local input değeri (yerel saat).
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Paylaşım formu. Üye gönderir → pending; admin gönderir → published (backend karar verir).
// admin=true iken video türü, erişim (public/members), süre, detay ve link alanları açılır.
// edit verilirse düzenleme modu: alanlar doldurulur, PATCH ile güncellenir, tür kilitlenir.
export function ActivityForm({ onDone, admin = false, edit }: { onDone: () => void; admin?: boolean; edit?: ActivityItem }) {
  const { t } = useI18n();
  const editing = !!edit;
  const [kind, setKind] = useState<ActivityKind>(edit ? edit.kind : admin ? "video" : "photo");
  const [title, setTitle] = useState(edit?.title ?? "");
  const [desc, setDesc] = useState(edit?.desc ?? "");
  const [place, setPlace] = useState(edit?.place ?? "");
  const [eventDate, setEventDate] = useState(edit?.eventDate ? toLocalInput(edit.eventDate) : ""); // datetime-local
  const [online, setOnline] = useState(!!edit?.online);
  const [file, setFile] = useState<File | null>(null);
  const [youtubeId, setYoutubeId] = useState(edit?.youtubeId ?? "");
  const [videoSource, setVideoSource] = useState<"youtube" | "upload">(edit?.youtubeId ? "youtube" : "upload");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPct, setVideoPct] = useState(0);
  const [durationMin, setDurationMin] = useState(edit?.durationMin ? String(edit.durationMin) : "");
  const [access, setAccess] = useState<"public" | "members">(edit?.access ?? "members");
  const [section, setSection] = useState<"meetups" | "knowledge" | "academy">(
    edit && (edit.section === "meetups" || edit.section === "knowledge" || edit.section === "academy") ? edit.section : "knowledge",
  );
  const [detail, setDetail] = useState(edit?.detail ?? "");
  const [link, setLink] = useState(edit?.link ?? "");
  const [evLang, setEvLang] = useState<"tr" | "en" | "both">(edit?.lang ?? "tr");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) return;
    if (kind === "video" && !editing) {
      if (videoSource === "youtube" && youtubeId.trim().length < 1) { setMsg(t("YouTube video ID gerekli.", "YouTube video ID is required.")); return; }
      if (videoSource === "upload" && !videoFile) { setMsg(t("Video dosyası seç.", "Choose a video file.")); return; }
    }
    setBusy(true); setMsg(null);
    try {
      let imageKey: string | undefined;
      if ((kind === "photo" || kind === "meeting") && file) imageKey = await uploadImage(file, "gallery");
      let videoKey: string | undefined;
      if (kind === "video" && videoSource === "upload" && videoFile) {
        setVideoPct(0);
        videoKey = await uploadVideo(videoFile, setVideoPct);
      }
      const dur = durationMin.trim() ? Number(durationMin) : undefined;

      // --- Düzenleme: değişebilir alanları PATCH ile gönder (kısmi). ---
      if (editing && edit) {
        await actApi.update<ActivityItem>(edit.id, {
          title, desc: desc.trim() || null, place: place.trim() || null,
          ...(kind === "meeting" ? { eventDate: eventDate ? new Date(eventDate).toISOString() : null, online } : {}),
          ...(admin ? { access } : {}),
          ...(kind === "video" ? { section } : {}),
          ...(kind === "meeting" || kind === "video" ? { lang: evLang } : {}),
          detail: detail.trim() || null,
          link: link.trim() || null,
          ...(kind === "video" && videoSource === "youtube" ? { youtubeId: youtubeId.trim() || null } : {}),
          ...(kind === "video" ? { durationMin: dur && !Number.isNaN(dur) ? dur : null } : {}),
          ...(imageKey ? { imageKey } : {}),
          ...(videoKey ? { videoKey } : {}),
        });
        setMsg(t("Güncellendi.", "Updated."));
        setTimeout(onDone, 900);
        return;
      }

      const created = await actApi.submit<ActivityItem>({
        kind, title, desc: desc || undefined, place: place || undefined, imageKey,
        eventDate: kind === "meeting" && eventDate ? new Date(eventDate).toISOString() : undefined,
        online: kind === "meeting" ? online : undefined,
        youtubeId: kind === "video" && videoSource === "youtube" ? youtubeId.trim() : undefined,
        videoKey: kind === "video" && videoSource === "upload" ? videoKey : undefined,
        durationMin: kind === "video" && dur && !Number.isNaN(dur) ? dur : undefined,
        ...(admin ? { access } : {}),
        ...(kind === "video" ? { section } : {}),
        lang: kind === "meeting" || kind === "video" ? evLang : undefined,
        detail: detail.trim() || undefined,
        link: link.trim() || undefined,
      });
      setMsg(
        created?.status === "published"
          ? t("Yayınlandı! Sitede görünüyor.", "Published! It's live on the site.")
          : t("Gönderildi! Bir yönetici onayladıktan sonra yayınlanacak.", "Sent! It will be published once an admin approves it."),
      );
      setTitle(""); setDesc(""); setPlace(""); setEventDate(""); setFile(null); setYoutubeId(""); setVideoFile(null); setVideoPct(0); setDurationMin(""); setDetail(""); setLink("");
      setTimeout(onDone, 1200);
    } catch {
      setMsg(t(editing ? "Güncellenemedi, tekrar dene." : "Gönderilemedi, tekrar dene.", editing ? "Couldn't update, please try again." : "Couldn't send, please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-8 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h3 className="font-display mb-3 text-lg font-semibold">{editing ? t("Aktiviteyi düzenle", "Edit activity") : t("Aktivite paylaş", "Share an activity")}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-ink-700">{t("Tür", "Type")}</span>
          <select value={kind} onChange={(e) => setKind(e.target.value as ActivityKind)} className={inp} disabled={editing}>
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
        <>
          <label className="mt-3 block text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t("Bölüm", "Section")}</span>
            <select value={section} onChange={(e) => setSection(e.target.value as "meetups" | "knowledge" | "academy")} className={inp}>
              <option value="meetups">{t("Topluluk Buluşmaları", "Community meetups")}</option>
              <option value="knowledge">{t("Bilgi Paylaşımı", "Knowledge sharing")}</option>
              <option value="academy">{t("Akademi (eğitim)", "Academy (training)")}</option>
            </select>
          </label>
          <label className="mt-3 block text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t("İçerik dili", "Content language")}</span>
            <select value={evLang} onChange={(e) => setEvLang(e.target.value as "tr" | "en" | "both")} className={inp}>
              <option value="tr">{t("Türkçe", "Turkish")}</option>
              <option value="en">{t("İngilizce", "English")}</option>
              <option value="both">{t("İki dilli (TR + EN)", "Bilingual (TR + EN)")}</option>
            </select>
          </label>
          <label className="mt-3 block text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t("Video kaynağı", "Video source")}</span>
            <select value={videoSource} onChange={(e) => setVideoSource(e.target.value as "youtube" | "upload")} className={inp}>
              <option value="upload">{t("Dosya yükle (üyelere özel)", "Upload file (members only)")}</option>
              <option value="youtube">{t("YouTube linki (herkese açık olabilir)", "YouTube link (can be public)")}</option>
            </select>
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {videoSource === "youtube" ? (
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink-700">{t("YouTube video ID", "YouTube video ID")}</span>
                <input value={youtubeId} onChange={(e) => setYoutubeId(e.target.value)} className={inp} placeholder="jOW8K7XUX4o" maxLength={20} />
              </label>
            ) : (
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink-700">{t("Video dosyası", "Video file")}</span>
                <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} className="text-sm" />
                {videoFile && <span className="mt-1 block text-xs text-ink-400">{(videoFile.size / 1048576).toFixed(0)} MB{busy && videoPct > 0 ? ` · ${t("yükleniyor", "uploading")} %${videoPct}` : ""}</span>}
              </label>
            )}
            <label className="text-sm">
              <span className="mb-1 block font-medium text-ink-700">{t("Süre (dk)", "Duration (min)")}</span>
              <input value={durationMin} onChange={(e) => setDurationMin(e.target.value.replace(/\D/g, ""))} className={inp} placeholder="45" inputMode="numeric" />
            </label>
          </div>
          {videoSource === "upload" && (
            <p className="mt-2 text-xs text-ink-400">{t("Yüklediğin videolar yalnızca üyelere oynatılır; dışarıya açık link verilmez.", "Uploaded videos play only for members; no public link is shared.")}</p>
          )}
        </>
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
          <label className="mt-3 block text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t("Etkinlik dili", "Event language")}</span>
            <select value={evLang} onChange={(e) => setEvLang(e.target.value as "tr" | "en" | "both")} className={inp}>
              <option value="tr">{t("Türkçe", "Turkish")}</option>
              <option value="en">{t("İngilizce", "English")}</option>
              <option value="both">{t("İki dilli (TR + EN)", "Bilingual (TR + EN)")}</option>
            </select>
          </label>
          <label className="mt-3 block text-sm">
            <span className="mb-1 block font-medium text-ink-700">{t("Görsel", "Image")} <span className="font-normal text-ink-400">({t("isteğe bağlı", "optional")})</span></span>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
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
        <Button type="submit" disabled={busy}>{busy ? (editing ? t("Kaydediliyor…", "Saving…") : t("Gönderiliyor…", "Sending…")) : editing ? t("Kaydet", "Save") : t("Gönder", "Submit")}</Button>
        {msg && <span className="text-sm text-ink-600">{msg}</span>}
      </div>
    </form>
  );
}
