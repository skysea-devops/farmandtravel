import { useI18n } from "@/lib/i18n";

// Müsaitlik / tarih aralığı — host "gönüllü aradığım tarihler", gönüllü
// "müsait olduğum tarihler" olarak doldurur. profile.availability altında saklanır.
export interface Availability {
  from?: string;     // YYYY-MM-DD
  to?: string;       // YYYY-MM-DD
  flexible?: boolean; // esnek / tüm yıl açık
  note?: string;     // "yaz ayları", "hafta sonları" gibi
}

export function availabilityEmpty(a?: Availability | null): boolean {
  return !a || !(a.from || a.to || a.flexible || a.note);
}

// Role'e göre etiket (host → gönüllü aradığın tarihler, gönüllü → müsait olduğun tarihler).
export function availabilityLabel(isHost: boolean, isVolunteer: boolean, t: (tr: string, en: string) => string): string {
  if (isHost && !isVolunteer) return t("Gönüllü aradığın tarihler", "Dates you're looking for volunteers");
  if (isVolunteer && !isHost) return t("Müsait olduğun tarihler", "Dates you're available");
  return t("Uygun tarihlerin", "Your available dates");
}

function fmt(iso: string, lang: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === "en" ? "en-GB" : "tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

export function availabilityText(a: Availability, lang: string, t: (tr: string, en: string) => string): string {
  const parts: string[] = [];
  if (a.from && a.to) parts.push(`${fmt(a.from, lang)} – ${fmt(a.to, lang)}`);
  else if (a.from) parts.push(t(`${fmt(a.from, lang)}'den itibaren`, `from ${fmt(a.from, lang)}`));
  else if (a.to) parts.push(t(`${fmt(a.to, lang)}'e kadar`, `until ${fmt(a.to, lang)}`));
  if (a.flexible) parts.push(t("esnek / tüm yıl", "flexible / year-round"));
  return parts.join(" · ");
}

const inp = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600";

export function AvailabilityField({ value, onChange, label }: { value: Availability; onChange: (a: Availability) => void; label: string }) {
  const { t } = useI18n();
  const set = (patch: Partial<Availability>) => onChange({ ...value, ...patch });
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-semibold text-ink-700">{label}</div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs text-ink-500">
          <span className="mb-1 block">{t("Başlangıç", "From")}</span>
          <input type="date" className={inp} value={value.from ?? ""} disabled={value.flexible}
            onChange={(e) => set({ from: e.target.value || undefined })} />
        </label>
        <label className="text-xs text-ink-500">
          <span className="mb-1 block">{t("Bitiş", "To")}</span>
          <input type="date" className={inp} value={value.to ?? ""} disabled={value.flexible} min={value.from || undefined}
            onChange={(e) => set({ to: e.target.value || undefined })} />
        </label>
        <label className="flex items-center gap-2 pb-2.5 text-[13px] text-ink-700">
          <input type="checkbox" checked={!!value.flexible} onChange={(e) => set({ flexible: e.target.checked })} />
          {t("Esnek / tüm yıl", "Flexible / year-round")}
        </label>
      </div>
      <input className={`${inp} mt-2`} value={value.note ?? ""} onChange={(e) => set({ note: e.target.value || undefined })}
        placeholder={t("Not (ör. yaz ayları, hafta sonları) — opsiyonel", "Note (e.g. summer months, weekends) — optional")} />
    </div>
  );
}

export function AvailabilityView({ value, label }: { value: Availability; label: string }) {
  const { t, lang } = useI18n();
  if (availabilityEmpty(value)) return null;
  const text = availabilityText(value, lang, t);
  return (
    <div>
      <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-clay-600">📅 {label}</div>
      {text && <p className="text-sm font-medium text-ink-800">{text}</p>}
      {value.note && <p className="text-sm text-ink-600">{value.note}</p>}
    </div>
  );
}
