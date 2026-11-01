import { useRef, useState } from "react";
import { Paperclip, Check } from "lucide-react";
import { uploadDoc, member as memberApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

// Adres kanıtı belgesi yükleme (resim veya PDF). Yalnızca ekip görür, profilde görünmez.
// done: belge daha önce yüklendi mi (/profile/me → proofAddress).
export function ProofUpload({ done, onChange }: { done: boolean; onChange: () => void }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true); setErr(false);
    try {
      const key = await uploadDoc(file);
      await memberApi.setProofAddress(key);
      onChange();
    } catch { setErr(true); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => input.current?.click()} disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border-strong px-3 py-2 text-sm font-medium text-ink-700 transition hover:border-forest-600 hover:text-forest-700">
          {busy ? t("Yükleniyor…", "Uploading…") : done ? t("Belgeyi değiştir", "Replace document") : <><Paperclip className="size-4" /> {t("Belge yükle", "Upload document")}</>}
        </button>
        {done && <span className="inline-flex items-center gap-1 text-sm font-medium text-forest-600"><Check className="size-4" /> {t("Belge yüklendi", "Document uploaded")}</span>}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden
        onChange={(e) => upload(e.target.files?.[0])} />
      {err && <p className="mt-1 text-xs text-[#8a2f29]">{t("Yükleme başarısız. Tekrar dene.", "Upload failed. Try again.")}</p>}
    </div>
  );
}
