import { useState } from "react";
import { Flag, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { reports as reportsApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";

// "Şikayet et / bildir" — profil ve mesajlaşmada. Admin paneline düşer.
export function ReportButton({ reportedId, context, className }: {
  reportedId: string; context: "profile" | "message"; className?: string;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (reason.trim().length < 3) return;
    setBusy(true);
    try { await reportsApi.create(reportedId, reason.trim(), context); setDone(true); }
    finally { setBusy(false); }
  }

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setDone(false); }}
        className={cn("inline-flex items-center gap-1", className ?? "text-xs text-ink-500 transition hover:text-[#8a2f29]")}>
        <Flag className="size-3.5" /> {t("Şikayet et", "Report")}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-border bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            {done ? (
              <div className="text-center">
                <div className="mb-2 flex justify-center text-forest-600"><CheckCircle2 className="size-8" /></div>
                <p className="text-sm text-ink-700">{t("Bildirimin alındı. Ekibimiz en kısa sürede inceleyecek. Teşekkürler.", "Your report was received. Our team will review it shortly. Thank you.")}</p>
                <Button size="sm" className="mt-4" onClick={() => setOpen(false)}>{t("Kapat", "Close")}</Button>
              </div>
            ) : (
              <>
                <h3 className="font-display mb-1 text-lg font-semibold">{t("Bu kullanıcıyı şikayet et", "Report this user")}</h3>
                <p className="mb-3 text-sm text-ink-500">
                  {t("Neyin yanlış olduğunu kısaca anlat (sahte profil, uygunsuz davranış, dolandırıcılık vb.). Bildirimin gizlidir; yalnızca ekip görür.",
                     "Briefly tell us what's wrong (fake profile, inappropriate behaviour, fraud, etc.). Your report is confidential; only the team sees it.")}
                </p>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} maxLength={2000}
                  placeholder={t("Şikayetinin nedeni…", "Reason for your report…")}
                  className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600" />
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>{t("Vazgeç", "Cancel")}</Button>
                  <Button size="sm" disabled={busy || reason.trim().length < 3} onClick={submit}>{busy ? t("Gönderiliyor…", "Sending…") : t("Gönder", "Send")}</Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
