import { useI18n } from "@/lib/i18n";

// Takvim / müsaitlik — 2 durumlu aylık takvim.
// Her ay: open (müsait) · closed (müsait değil) · belirtilmemiş.
// profile.availability altında saklanır. Eski from/to/flexible alanları geriye dönük
// uyumluluk için korunur (months yoksa görünümde onlardan türetilir).
export type MonthState = "open" | "closed";

export interface Availability {
  months?: Record<string, MonthState>; // "YYYY-MM" -> durum
  note?: string;                        // "yaz ayları", "hafta sonları" gibi
  // legacy (eski kayıtlar):
  from?: string;
  to?: string;
  flexible?: boolean;
}

// Önümüzdeki 12 ay (bu aydan itibaren).
function next12Months(): { key: string; d: Date }[] {
  const out: { key: string; d: Date }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    out.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, d });
  }
  return out;
}

const monShort = (d: Date, lang: string) => d.toLocaleDateString(lang === "en" ? "en-GB" : "tr-TR", { month: "short" });

// Görünüm/düzenleme için ay haritası: months varsa onu, yoksa eski from/to aralığını
// "open" olarak türetir.
export function monthsOf(a?: Availability | null): Record<string, MonthState> {
  if (!a) return {};
  if (a.months && Object.keys(a.months).length) {
    // Eski "busy" kayıtlarını "open"a indir (artık 2 durum).
    const out: Record<string, MonthState> = {};
    for (const [k, v] of Object.entries(a.months)) out[k] = v === "closed" ? "closed" : "open";
    return out;
  }
  if (a.from || a.to) {
    const out: Record<string, MonthState> = {};
    const start = a.from ? new Date(a.from) : new Date();
    const end = a.to ? new Date(a.to) : start;
    const d = new Date(start.getFullYear(), start.getMonth(), 1);
    let guard = 0;
    while (d <= end && guard < 36) {
      out[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`] = "open";
      d.setMonth(d.getMonth() + 1);
      guard++;
    }
    return out;
  }
  return {};
}

export function availabilityEmpty(a?: Availability | null): boolean {
  if (!a) return true;
  const hasMonths = Object.values(monthsOf(a)).some(Boolean);
  return !(hasMonths || a.note);
}

// Role'e göre etiket (host → gönüllü aradığın aylar, gönüllü → müsait olduğun aylar).
export function availabilityLabel(isHost: boolean, isVolunteer: boolean, t: (tr: string, en: string) => string): string {
  if (isHost && !isVolunteer) return t("Gönüllü aradığın aylar", "Months you're looking for volunteers");
  if (isVolunteer && !isHost) return t("Müsait olduğun aylar", "Months you're available");
  return t("Uygun ayların", "Your available months");
}

// Durum renkleri (hücre + lejant). open yeşil, closed yumuşak kırmızı.
const CELL: Record<MonthState, string> = {
  open: "border-forest-600 bg-forest-600 text-white",
  closed: "border-[#e3cfc9] bg-[#f3e6e2] text-[#8a2f29]",
};
const DOT: Record<MonthState, string> = {
  open: "bg-forest-600",
  closed: "bg-[#c98b82]",
};
const stateText = (t: (tr: string, en: string) => string): Record<MonthState, string> => ({
  open: t("Müsait", "Available"),
  closed: t("Müsait değil", "Not available"),
});

function Legend() {
  const { t } = useI18n();
  const ST = stateText(t);
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-500">
      {(["open", "closed"] as MonthState[]).map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5"><span className={`size-2.5 rounded-full ${DOT[s]}`} /> {ST[s]}</span>
      ))}
    </div>
  );
}

const cycle = (s?: MonthState): MonthState | undefined =>
  s === undefined ? "open" : s === "open" ? "closed" : undefined;

const inp = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600";

export function AvailabilityField({ value, onChange, label }: { value: Availability; onChange: (a: Availability) => void; label: string }) {
  const { t, lang } = useI18n();
  const months = monthsOf(value);
  const setMonth = (key: string) => {
    const next = cycle(months[key]);
    const m = { ...months };
    if (next === undefined) delete m[key]; else m[key] = next;
    onChange({ ...value, months: m });
  };
  return (
    <div>
      <div className="mb-1 text-[13px] font-semibold text-ink-700">{label}</div>
      <p className="mb-3 text-[12.5px] text-ink-500">{t("Her aya dokunarak durumunu değiştir.", "Tap a month to change its status.")}</p>
      <div className="mb-3 grid grid-cols-4 gap-1.5 sm:grid-cols-6">
        {next12Months().map(({ key, d }) => {
          const st = months[key];
          return (
            <button key={key} type="button" onClick={() => setMonth(key)}
              className={`rounded-lg border px-1 py-2 text-center text-[13px] font-medium capitalize transition ${st ? CELL[st] : "border-dashed border-border-strong bg-surface text-ink-500 hover:border-forest-500"}`}>
              {monShort(d, lang)}
              {d.getMonth() === 0 && <span className="ml-0.5 text-[10px] opacity-80">'{String(d.getFullYear()).slice(2)}</span>}
            </button>
          );
        })}
      </div>
      <Legend />
      <input className={`${inp} mt-3`} value={value.note ?? ""} onChange={(e) => onChange({ ...value, note: e.target.value || undefined })}
        placeholder={t("Not (ör. yaz ayları, hafta sonları) — opsiyonel", "Note (e.g. summer months, weekends) — optional")} />
    </div>
  );
}

export function AvailabilityView({ value, label }: { value: Availability; label: string }) {
  const { lang } = useI18n();
  if (availabilityEmpty(value)) return null;
  const months = monthsOf(value);
  return (
    <div>
      <div className="mb-2.5 text-[13px] font-medium text-ink-600">{label}</div>
      <div className="mb-3 grid grid-cols-4 gap-1.5 sm:grid-cols-6">
        {next12Months().map(({ key, d }) => {
          const st = months[key];
          return (
            <div key={key}
              className={`rounded-lg border px-1 py-2 text-center text-[13px] font-medium capitalize ${st ? CELL[st] : "border-border bg-sand-100 text-ink-300"}`}>
              {monShort(d, lang)}
              {d.getMonth() === 0 && <span className="ml-0.5 text-[10px] opacity-80">'{String(d.getFullYear()).slice(2)}</span>}
            </div>
          );
        })}
      </div>
      <Legend />
      {value.note && <p className="mt-2.5 text-sm text-ink-600">{value.note}</p>}
    </div>
  );
}
