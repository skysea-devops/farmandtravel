import { useI18n } from "@/lib/i18n";
import {
  HELP_TYPES, AMENITIES, MEAL_TYPES, LANGUAGES, HOUSE_RULES, AROUND_US, WANTS_EXPERIENCE,
  labelOf, iconOf, hostIsEmpty, type HostDetails, type RuleItem, type RoutineRow, type LabeledKey,
} from "@/data/host";

const ta = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600 resize-y";
const inp = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600";
type ChipField = "helpTypes" | "amenities" | "mealTypes" | "languages";
type RuleField = "houseRules" | "around";

// Onboarding'de zorunlu host alanları dolu mu? (iş + konaklama + en az 1 yardım türü)
export function hostRequiredComplete(h: HostDetails): boolean {
  return !!(h.work?.trim() && h.accommodation?.trim() && (h.helpTypes?.length ?? 0) > 0);
}

export function HostDetailsForm({ value, onChange }: { value: HostDetails; onChange: (h: HostDetails) => void }) {
  const { t, lang } = useI18n();
  const set = (patch: Partial<HostDetails>) => onChange({ ...value, ...patch });

  const toggle = (field: ChipField, key: string) => {
    const cur = value[field] ?? [];
    set({ [field]: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key] } as Partial<HostDetails>);
  };
  const chip = (field: ChipField, k: LabeledKey) => {
    const active = (value[field] ?? []).includes(k.key);
    return (
      <button key={k.key} type="button" onClick={() => toggle(field, k.key)}
        className={`rounded-full border px-3 py-1.5 text-[13px] transition ${active ? "border-forest-600 bg-forest-600 text-white" : "border-border-strong bg-surface hover:border-forest-500"}`}>
        {lang === "en" ? k.en : k.tr}
      </button>
    );
  };

  // Rule item lists (houseRules / around): seçili olanın notu düzenlenebilir.
  const ruleItems = (field: RuleField): RuleItem[] => value[field] ?? [];
  const ruleOn = (field: RuleField, key: string) => ruleItems(field).some((r) => r.key === key);
  const toggleRule = (field: RuleField, key: string) => {
    const cur = ruleItems(field);
    set({ [field]: cur.some((r) => r.key === key) ? cur.filter((r) => r.key !== key) : [...cur, { key }] } as Partial<HostDetails>);
  };
  const setRuleNote = (field: RuleField, key: string, note: string) => {
    set({ [field]: ruleItems(field).map((r) => (r.key === key ? { ...r, note: note || undefined } : r)) } as Partial<HostDetails>);
  };
  const ruleBlock = (field: RuleField, list: LabeledKey[]) => (
    <div className="space-y-2">
      {list.map((k) => {
        const on = ruleOn(field, k.key);
        const item = ruleItems(field).find((r) => r.key === k.key);
        return (
          <div key={k.key} className={`rounded-lg border p-2.5 ${on ? "border-forest-500/60 bg-sand-100/50" : "border-border"}`}>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={on} onChange={() => toggleRule(field, k.key)} />
              <span>{k.icon} {lang === "en" ? k.en : k.tr}</span>
            </label>
            {on && (
              <input className={`${inp} mt-2`} value={item?.note ?? ""} onChange={(e) => setRuleNote(field, k.key, e.target.value)}
                placeholder={t("Kısa açıklama (opsiyonel)", "Short note (optional)")} />
            )}
          </div>
        );
      })}
    </div>
  );

  // Günlük akış satırları.
  const routine = value.dailyRoutine ?? [];
  const setRoutine = (rows: RoutineRow[]) => set({ dailyRoutine: rows });

  return (
    <div className="space-y-6">
      {/* ── Temel bilgiler ── */}
      <div className="space-y-4">
        <Field req label={t("Kısa özet / yapılacak işler", "Short summary / the help")}
          hint={t("Gönüllünün ne yapacağını birkaç cümleyle anlat.", "Describe what the volunteer will do, in a few sentences.")}>
          <textarea rows={3} className={ta} value={value.work ?? ""} onChange={(e) => set({ work: e.target.value })}
            placeholder={t("Örn: Bahçede ekim, çapalama ve hasatta yardım; işler kolaydır.", "E.g. help with planting, hoeing and harvesting; the tasks are easy.")} />
        </Field>
        <Field req label={t("Yardım türleri", "Types of help")}>
          <div className="flex flex-wrap gap-2">{HELP_TYPES.map((k) => chip("helpTypes", k))}</div>
        </Field>
        <Field req label={t("Konaklama", "Accommodation")}
          hint={t("Oda/kamp, banyo, mutfak, çamaşır, internet gibi imkanları anlat.", "Describe the room/camping, bathroom, kitchen, laundry, internet, etc.")}>
          <textarea rows={3} className={ta} value={value.accommodation ?? ""} onChange={(e) => set({ accommodation: e.target.value })}
            placeholder={t("Örn: Gönüllüler için ayrı bir odamız var; kamp için de uygun.", "E.g. we have a separate room for volunteers; camping is also fine.")} />
        </Field>
        <Field label={t("Olanaklar", "Amenities")}>
          <div className="flex flex-wrap gap-2">{AMENITIES.map((k) => chip("amenities", k))}</div>
        </Field>
        <Field label={t("Konuşulan diller", "Languages spoken")}
          hint={t("Gönüllüyle hangi dil(ler)de iletişim kurabilirsin?", "Which language(s) can you communicate in?")}>
          <div className="flex flex-wrap gap-2">{LANGUAGES.map((k) => chip("languages", k))}</div>
        </Field>
        <Field label={t("Yemek", "Meals")}
          hint={t("Standart: günde 3 öğün. Türü seç, gerekirse not ekle.", "Standard: 3 meals a day. Pick the type, add a note if needed.")}>
          <div className="mb-2 flex flex-wrap gap-2">{MEAL_TYPES.map((k) => chip("mealTypes", k))}</div>
          <input className={inp} value={value.meals ?? ""} onChange={(e) => set({ meals: e.target.value })}
            placeholder={t("Örn: günde 3 öğün; alerji/özel beslenme notu", "E.g. 3 meals a day; allergy/dietary note")} />
        </Field>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Field label={t("Minimum kalış süresi", "Minimum stay")}
            hint={t("Gönüllüden beklenen en az süre.", "The least time you expect a volunteer to stay.")}>
            <input className={inp} value={value.minStay ?? ""} onChange={(e) => set({ minStay: e.target.value })}
              placeholder={t("Örn: en az 1 hafta", "E.g. at least 1 week")} />
          </Field>
          <Field label={t("Aynı anda max gönüllü", "Max volunteers at once")}
            hint={t("Aynı dönemde kaç gönüllü ağırlayabilirsin.", "How many volunteers you can host at the same time.")}>
            <input className={inp} value={value.maxVolunteers ?? ""} onChange={(e) => set({ maxVolunteers: e.target.value })}
              placeholder={t("Örn: 2", "E.g. 2")} />
          </Field>
        </div>
        <Field label={t("Neler öğrenilebilir?", "What can volunteers learn?")}>
          <textarea rows={2} className={ta} value={value.learn ?? ""} onChange={(e) => set({ learn: e.target.value })}
            placeholder={t("Örn: ekmek, peynir, yoğurt, turşu yapımı; permakültür.", "E.g. making bread, cheese, yogurt, pickles; permaculture.")} />
        </Field>
        <Field label={t("Aradığın gönüllü", "Volunteer you're looking for")}>
          <div className="flex flex-wrap gap-2">
            {WANTS_EXPERIENCE.map((o) => (
              <button key={o.key} type="button" onClick={() => set({ wantsExperience: o.key as HostDetails["wantsExperience"] })}
                className={`rounded-full border px-3 py-1.5 text-[13px] transition ${value.wantsExperience === o.key ? "border-forest-600 bg-forest-600 text-white" : "border-border-strong bg-surface hover:border-forest-500"}`}>
                {lang === "en" ? o.en : o.tr}
              </button>
            ))}
          </div>
        </Field>
      </div>

      {/* ── 📅 Günlük akış ── */}
      <Section title={t("📅 Günlük akış", "📅 Daily routine")}
        hint={t("İstersen saatli doldur, istersen genel bırak. Satır ekleyebilirsin.", "Fill with times if you like, or keep it general. You can add rows.")}>
        <div className="space-y-2">
          {routine.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className={`${inp} w-28 shrink-0`} value={r.time ?? ""} onChange={(e) => setRoutine(routine.map((x, j) => j === i ? { ...x, time: e.target.value || undefined } : x))}
                placeholder={t("Saat (ops.)", "Time (opt.)")} />
              <input className={inp} value={r.activity} onChange={(e) => setRoutine(routine.map((x, j) => j === i ? { ...x, activity: e.target.value } : x))}
                placeholder={t("Örn: Sabah hayvan bakımı, kahvaltı, tarla işi…", "E.g. Morning animal care, breakfast, field work…")} />
              <button type="button" onClick={() => setRoutine(routine.filter((_, j) => j !== i))} className="shrink-0 text-ink-400 hover:text-clay-600" title={t("Sil", "Remove")}>✕</button>
            </div>
          ))}
          <button type="button" onClick={() => setRoutine([...routine, { activity: "" }])}
            className="rounded-full border border-dashed border-border-strong px-3 py-1.5 text-[13px] text-ink-600 hover:border-forest-500">
            {t("+ Satır ekle", "+ Add row")}
          </button>
        </div>
      </Section>

      {/* ── 🌿 İzin günleri ── */}
      <Section title={t("🌿 İzin günleri", "🌿 Days off")}
        hint={t("Standart: haftada 5 gün çalışma → 2 gün izin. İzin günlerinde ne yapılabilir?", "Standard: 5 days of work → 2 days off. What can volunteers do on days off?")}>
        <textarea rows={2} className={ta} value={value.daysOff ?? ""} onChange={(e) => set({ daysOff: e.target.value })}
          placeholder={t("Örn: 5 gün çalışma, 2 gün izin. İzin günlerinde çevreyi gezebilir, dinlenebilirsin.", "E.g. 5 days work, 2 days off. On days off you can explore the area or rest.")} />
      </Section>

      {/* ── 🏠 Ev kuralları & ipuçları ── */}
      <Section title={t("🏠 Ev kuralları & ipuçları", "🏠 House rules & tips")}
        hint={t("Geçerli olanları seç, istersen kısa not ekle.", "Pick the ones that apply, add a short note if you like.")}>
        {ruleBlock("houseRules", HOUSE_RULES)}
      </Section>

      {/* ── 🧭 Çevrede ── */}
      <Section title={t("🧭 Çevrede", "🧭 Around us")}
        hint={t("Gönüllüler gezip görmek de ister. Çevredeki imkanları seç.", "Volunteers like to explore too. Pick what's around.")}>
        {ruleBlock("around", AROUND_US)}
      </Section>
    </div>
  );
}

function Field({ label, hint, req, children }: { label: string; hint?: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-semibold text-ink-700">{label}{req && <span className="text-clay-600"> *</span>}</div>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-bg/40 p-4">
      <h3 className="font-display text-[15px] font-semibold text-forest-700">{title}</h3>
      {hint && <p className="mb-3 mt-0.5 text-xs text-ink-500">{hint}</p>}
      {children}
    </div>
  );
}

// ───────────────────────── read-only view ─────────────────────────

export function HostDetailsView({ host }: { host: HostDetails }) {
  const { t, lang } = useI18n();
  if (hostIsEmpty(host)) return null;
  const helpLabels = (host.helpTypes ?? []).map((k) => labelOf(HELP_TYPES, k, lang));
  const amenLabels = (host.amenities ?? []).map((k) => labelOf(AMENITIES, k, lang));
  const mealLabels = (host.mealTypes ?? []).map((k) => labelOf(MEAL_TYPES, k, lang));
  const langLabels = (host.languages ?? []).map((k) => labelOf(LANGUAGES, k, lang));
  const wants = host.wantsExperience ? labelOf(WANTS_EXPERIENCE, host.wantsExperience, lang) : null;
  const routine = (host.dailyRoutine ?? []).filter((r) => r.activity?.trim());
  const rules = host.houseRules ?? [];
  const around = host.around ?? [];

  return (
    <div className="space-y-5 text-sm">
      {host.work && <Row label={t("Yapılacak işler", "The help")}><p className="whitespace-pre-wrap text-ink-700">{host.work}</p></Row>}
      {helpLabels.length > 0 && <Chips label={t("Yardım türleri", "Types of help")} items={helpLabels} />}
      {host.accommodation && <Row label={t("Konaklama", "Accommodation")}><p className="whitespace-pre-wrap text-ink-700">{host.accommodation}</p></Row>}
      {host.minStay && <Row label={t("Minimum kalış", "Minimum stay")}><p className="text-ink-700">{host.minStay}</p></Row>}
      {host.maxVolunteers && <Row label={t("Aynı anda max gönüllü", "Max volunteers at once")}><p className="text-ink-700">{host.maxVolunteers}</p></Row>}
      {amenLabels.length > 0 && <Chips label={t("Olanaklar", "Amenities")} items={amenLabels} />}
      {langLabels.length > 0 && <Chips label={t("Konuşulan diller", "Languages spoken")} items={langLabels} />}
      {(mealLabels.length > 0 || host.meals) && (
        <Row label={t("Yemek", "Meals")}>
          {mealLabels.length > 0 && (
            <div className="mb-1 flex flex-wrap gap-1.5">
              {mealLabels.map((l) => <span key={l} className="rounded-full bg-sand-100 px-2.5 py-1 text-[12px] text-ink-700">{l}</span>)}
            </div>
          )}
          {host.meals && <p className="text-ink-700">{host.meals}</p>}
        </Row>
      )}
      {host.learn && <Row label={t("Neler öğrenilebilir?", "What you can learn")}><p className="whitespace-pre-wrap text-ink-700">{host.learn}</p></Row>}
      {wants && <Row label={t("Aranan gönüllü", "Volunteer wanted")}><p className="text-ink-700">{wants}</p></Row>}

      {routine.length > 0 && (
        <Row label={t("📅 Günlük akış", "📅 Daily routine")}>
          <ul className="space-y-1">
            {routine.map((r, i) => (
              <li key={i} className="flex gap-2 text-ink-700">
                {r.time && <span className="shrink-0 font-semibold text-forest-700">{r.time}</span>}
                <span>{r.activity}</span>
              </li>
            ))}
          </ul>
        </Row>
      )}

      {host.daysOff && <Row label={t("🌿 İzin günleri", "🌿 Days off")}><p className="whitespace-pre-wrap text-ink-700">{host.daysOff}</p></Row>}

      {rules.length > 0 && (
        <Row label={t("🏠 Ev kuralları & ipuçları", "🏠 House rules & tips")}>
          <ul className="space-y-1.5">
            {rules.map((r) => (
              <li key={r.key} className="text-ink-700">
                <span className="font-medium">{iconOf(HOUSE_RULES, r.key)} {labelOf(HOUSE_RULES, r.key, lang)}</span>
                {r.note && <span className="text-ink-600"> — {r.note}</span>}
              </li>
            ))}
          </ul>
        </Row>
      )}

      {around.length > 0 && (
        <Row label={t("🧭 Çevrede", "🧭 Around us")}>
          <ul className="space-y-1.5">
            {around.map((r) => (
              <li key={r.key} className="text-ink-700">
                <span className="font-medium">{iconOf(AROUND_US, r.key)} {labelOf(AROUND_US, r.key, lang)}</span>
                {r.note && <span className="text-ink-600"> — {r.note}</span>}
              </li>
            ))}
          </ul>
        </Row>
      )}

      {/* legacy alanlar (eski kayıtlar) */}
      {host.hoursNote && <Row label={t("Çalışma düzeni", "Work schedule")}><p className="text-ink-700">{host.hoursNote}</p></Row>}
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

function Chips({ label, items }: { label: string; items: string[] }) {
  return (
    <Row label={label}>
      <div className="flex flex-wrap gap-1.5">
        {items.map((l) => <span key={l} className="rounded-full bg-sand-100 px-2.5 py-1 text-[12px] text-ink-700">{l}</span>)}
      </div>
    </Row>
  );
}
