import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { activities as actApi, uploadImage } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { ActivityItem, ActivityKind } from "@/lib/types";

const inp = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600";

// Shared submit form. Members submit → pending; admins submit → published (backend decides).
export function ActivityForm({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const [kind, setKind] = useState<ActivityKind>("photo");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [place, setPlace] = useState("");
  const [when, setWhen] = useState("");
  const [online, setOnline] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) return;
    setBusy(true); setMsg(null);
    try {
      let imageKey: string | undefined;
      if (kind === "photo" && file) imageKey = await uploadImage(file, "gallery");
      const created = await actApi.submit<ActivityItem>({
        kind, title, desc: desc || undefined, place: place || undefined, imageKey,
        when: when || undefined, online: kind === "meeting" ? online : undefined,
      });
      setMsg(
        created?.status === "published"
          ? t("Yayınlandı! Sitede görünüyor.", "Published! It's live on the site.")
          : t("Gönderildi! Bir yönetici onayladıktan sonra yayınlanacak.", "Sent! It will be published once an admin approves it."),
      );
      setTitle(""); setDesc(""); setPlace(""); setWhen(""); setFile(null);
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
        <Button type="submit" disabled={busy}>{busy ? t("Gönderiliyor…", "Sending…") : t("Gönder", "Submit")}</Button>
        {msg && <span className="text-sm text-ink-600">{msg}</span>}
      </div>
    </form>
  );
}
