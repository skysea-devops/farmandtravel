import { useI18n } from "@/lib/i18n";
import { HELP_TYPES, AMENITIES, labelOf, hostIsEmpty, type HostDetails } from "@/data/host";

const ta = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600 resize-y";
const inp = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600";

// Editable host (çiftlik/yer sahibi) details form — used in onboarding and profile edit.
export function HostDetailsForm({ value, onChange }: { value: HostDetails; onChange: (h: HostDetails) => void }) {
  const { t, lang } = useI18n();
  const set = (patch: Partial<HostDetails>) => onChange({ ...value, ...patch });
  const toggle = (field: "helpTypes" | "amenities", key: string) => {
    const cur = value[field] ?? [];
    set({ [field]: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key] } as Partial<HostDetails>);
  };

  const chip = (field: "helpTypes" | "amenities", k: { key: string; tr: string; en: string }) => {
    const active = (value[field] ?? []).includes(k.key);
    return (
      <button key={k.key} type="button" onClick={() => toggle(field, k.key)}
        className={`rounded-full border px-3 py-1.5 text-[13px] transition ${active ? "border-forest-600 bg-forest-600 text-white" : "border-border-strong bg-surface hover:border-forest-500"}`}>
        {lang === "en" ? k.en : k.tr}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <Field label={t("Yapılacak işler / yardım tanımı", "The help / tasks")}
        hint={t("Gönüllünün ne yapacağını anlat (ör. sebze dikimi, çapalama, hasat).", "Describe what the volunteer will do (e.g. planting, hoeing, harvest).")}>
        <textarea rows={3} className={ta} value={value.work ?? ""} onChange={(e) => set({ work: e.target.value })}
          placeholder={t("Örn: Bahçede ekim, çapalama ve hasatta yardım; işler kolaydır.", "E.g. help with planting, hoeing and harvesting in the garden; the tasks are easy.")} />
      </Field>

      <Field label={t("Yardım türleri", "Types of help")}>
        <div className="flex flex-wrap gap-2">{HELP_TYPES.map((k) => chip("helpTypes", k))}</div>
      </Field>

      <Field label={t("Çalışma düzeni (opsiyonel)", "Work schedule (optional)")}
        hint={t("Standart: günde 6 saat, haftada 5 gün (2 izin günü). Farklıysa yaz.", "Standard: 6 hours/day, 5 days/week (2 days off). Note if yours differs.")}>
        <input className={inp} value={value.hoursNote ?? ""} onChange={(e) => set({ hoursNote: e.target.value })}
          placeholder={t("Örn: günde 6 saat, haftada 5 gün", "E.g. 6 hours a day, 5 days a week")} />
      </Field>

      <Field label={t("Konaklama", "Accommodation")}
        hint={t("Oda/kamp, banyo, mutfak, çamaşır, internet gibi imkanları anlat.", "Describe the room/camping, bathroom, kitchen, laundry, internet, etc.")}>
        <textarea rows={3} className={ta} value={value.accommodation ?? ""} onChange={(e) => set({ accommodation: e.target.value })}
          placeholder={t("Örn: Gönüllüler için ayrı bir odamız var; kamp için de uygun. Banyo, mutfak ve çamaşır makinesi ortak.", "E.g. we have a separate room for volunteers; camping is also fine. Bathroom, kitchen and washing machine are shared.")} />
      </Field>

      <Field label={t("Olanaklar", "Amenities")}>
        <div className="flex flex-wrap gap-2">{AMENITIES.map((k) => chip("amenities", k))}</div>
      </Field>

      <Field label={t("Yemek", "Meals")}
        hint={t("Standart: günde 3 öğün. Özel beslenme (vejetaryen vb.) notunu ekle.", "Standard: 3 meals a day. Add any dietary note (vegetarian, etc.).")}>
        <input className={inp} value={value.meals ?? ""} onChange={(e) => set({ meals: e.target.value })}
          placeholder={t("Örn: günde 3 öğün; çoğunlukla sebze yemekleri", "E.g. 3 meals a day; mostly vegetable dishes")} />
      </Field>

      <Field label={t("Neler öğrenilebilir?", "What can volunteers learn?")}
        hint={t("Kültürel değişim / öğrenme fırsatları.", "Cultural exchange / learning opportunities.")}>
        <textarea rows={3} className={ta} value={value.learn ?? ""} onChange={(e) => set({ learn: e.target.value })}
          placeholder={t("Örn: ekmek, peynir, yoğurt, turşu, reçel yapımı; permakültür.", "E.g. making bread, cheese, yogurt, pickles, jam; permaculture.")} />
      </Field>

      <Field label={t("Çevrede / boş zaman", "Nearby / free time")}
        hint={t("İzin günlerinde gezilebilecek yerler, aktiviteler.", "Places to visit and activities on days off.")}>
        <textarea rows={2} className={ta} value={value.nearby ?? ""} onChange={(e) => set({ nearby: e.target.value })}
          placeholder={t("Örn: yakında Bergama, Ayvalık, Assos; çevrede doğa yürüyüşleri.", "E.g. Pergamon, Ayvalık, Assos nearby; local hikes around.")} />
      </Field>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-semibold text-ink-700">{label}</div>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

// Read-only host details — used on another member's public profile.
export function HostDetailsView({ host }: { host: HostDetails }) {
  const { t, lang } = useI18n();
  if (hostIsEmpty(host)) return null;
  const helpLabels = (host.helpTypes ?? []).map((k) => labelOf(HELP_TYPES, k, lang));
  const amenLabels = (host.amenities ?? []).map((k) => labelOf(AMENITIES, k, lang));
  return (
    <div className="space-y-4 text-sm">
      {host.work && <Row label={t("Yapılacak işler", "The help")}><p className="whitespace-pre-wrap text-ink-700">{host.work}</p></Row>}
      {helpLabels.length > 0 && (
        <Row label={t("Yardım türleri", "Types of help")}>
          <div className="flex flex-wrap gap-1.5">
            {helpLabels.map((l) => <span key={l} className="rounded-full bg-sand-100 px-2.5 py-1 text-[12px] text-ink-700">{l}</span>)}
          </div>
        </Row>
      )}
      {host.hoursNote && <Row label={t("Çalışma düzeni", "Work schedule")}><p className="text-ink-700">{host.hoursNote}</p></Row>}
      {host.accommodation && <Row label={t("Konaklama", "Accommodation")}><p className="whitespace-pre-wrap text-ink-700">{host.accommodation}</p></Row>}
      {amenLabels.length > 0 && (
        <Row label={t("Olanaklar", "Amenities")}>
          <div className="flex flex-wrap gap-1.5">
            {amenLabels.map((l) => <span key={l} className="rounded-full bg-sand-100 px-2.5 py-1 text-[12px] text-ink-700">{l}</span>)}
          </div>
        </Row>
      )}
      {host.meals && <Row label={t("Yemek", "Meals")}><p className="text-ink-700">{host.meals}</p></Row>}
      {host.learn && <Row label={t("Neler öğrenilebilir?", "What you can learn")}><p className="whitespace-pre-wrap text-ink-700">{host.learn}</p></Row>}
      {host.nearby && <Row label={t("Çevrede / boş zaman", "Nearby / free time")}><p className="whitespace-pre-wrap text-ink-700">{host.nearby}</p></Row>}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-clay-600">{label}</div>
      {children}
    </div>
  );
}
