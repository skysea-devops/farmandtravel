import { useRef, useState } from "react";
import { api, uploadImage } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { HOST_PHOTO_CATEGORIES } from "@/data/host";
import type { Photo } from "@/lib/types";

// Host fotoğrafları — Worldpackers benzeri kategorili yükleme.
// 6 kategori; "Çiftlik geneli" ve "Yatma yeri" zorunlu (işaretli), diğerleri teşvik.
// Fotoğraflar member_photos tablosuna category ile yazılır; sahibinin görünümünde düzenlenir.

export function HostPhotos({ photos, onChange }: { photos: Photo[]; onChange: () => void }) {
  const { t, lang } = useI18n();
  const [busy, setBusy] = useState<string | null>(null);
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  const byCat = (key: string) => photos.filter((p) => p.category === key);

  async function upload(cat: string, files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(cat);
    try {
      for (const file of Array.from(files)) {
        const key = await uploadImage(file, "gallery");
        await api.post("/profile/photos", { key, category: cat });
      }
      api.invalidate();
      onChange();
    } catch {
      /* sessizce geç — limit/ağ hatası */
    } finally {
      setBusy(null);
      const el = inputs.current[cat];
      if (el) el.value = "";
    }
  }

  async function remove(id: string) {
    setBusy(id);
    try { await api.del(`/profile/photos/${id}`); api.invalidate(); onChange(); }
    finally { setBusy(null); }
  }

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-ink-500">
        {t(
          "Gönüllüler kalacakları yeri görmek ister. Net fotoğraflar daha çok ve daha uygun başvuru getirir. ",
          "Volunteers want to see where they'll stay. Clear photos bring more and better-matched applications. ",
        )}
        <span className="font-bold text-[#dc2626]">*</span>{" "}
        {t("işaretli kategoriler zorunludur.", "marked categories are required.")}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {HOST_PHOTO_CATEGORIES.map((cat) => {
          const mine = byCat(cat.key);
          const label = lang === "en" ? cat.en : cat.tr;
          return (
            <div key={cat.key} className="rounded-[var(--radius-lg)] border border-border bg-surface p-3">
              <div className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink-800">
                <span>{cat.icon}</span>
                <span>{label}</span>
                {cat.required && <span className="font-bold text-[#dc2626]" title={t("Zorunlu", "Required")}>*</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {mine.map((ph) => (
                  <div key={ph.id} className="group relative size-20 overflow-hidden rounded-lg bg-sand-100">
                    {ph.url && <img src={ph.url} alt={label} className="size-full object-cover" />}
                    <button
                      type="button"
                      onClick={() => remove(ph.id)}
                      disabled={busy === ph.id}
                      className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-ink-900/70 text-[11px] text-white opacity-0 transition group-hover:opacity-100"
                      aria-label={t("Kaldır", "Remove")}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => inputs.current[cat.key]?.click()}
                  disabled={busy === cat.key}
                  className="grid size-20 place-items-center rounded-lg border border-dashed border-border-strong text-xs text-ink-500 transition hover:border-forest-600 hover:text-forest-700"
                >
                  {busy === cat.key ? "…" : t("+ Ekle", "+ Add")}
                </button>
              </div>
              <input
                ref={(el) => { inputs.current[cat.key] = el; }}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={(e) => upload(cat.key, e.target.files)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Zorunlu host fotoğrafları tamam mı? (çiftlik geneli + yatma yeri en az birer tane)
export function hostPhotosComplete(photos: Photo[] | undefined | null): boolean {
  const list = photos ?? [];
  return HOST_PHOTO_CATEGORIES.filter((c) => c.required).every(
    (c) => list.some((p) => p.category === c.key),
  );
}
