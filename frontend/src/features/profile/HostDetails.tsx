import type { LucideIcon } from "lucide-react";
import { HandHelping, Gift, Trees, ClipboardCheck, House, Users, Clock, BedDouble, Utensils, TreePalm, Sprout, Star, CalendarClock, CalendarDays, Images } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { HELP_ICONS, AMENITY_ICONS, MEAL_ICONS, AROUND_ICONS, RULE_ICONS, DomainIcon } from "@/lib/icons";
import {
  HELP_TYPES, AMENITIES, MEAL_TYPES, LANGUAGES, HOUSE_RULES, AROUND_US, WANTS_EXPERIENCE,
  labelOf, hostIsEmpty, type HostDetails, type RuleItem, type RoutineRow, type LabeledKey,
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
      <div className="mb-1.5 text-[13px] font-semibold text-ink-700">{label}{req && <span className="font-bold text-[#dc2626]"> *</span>}</div>
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

// Gruplu, çizgi-ikonlu görünüm. Ana bölümler tam-genişlik ayıraçla ayrılır:
// Ne yapacaksın · Sana neler sunuluyor · Bizimle deneyim · Gereksinimler · Ev kuralları.
export function HostDetailsView({ host, onSeePhotos }: { host: HostDetails; onSeePhotos?: () => void }) {
  const { t, lang } = useI18n();
  if (hostIsEmpty(host)) return null;

  const help = host.helpTypes ?? [];
  const amen = host.amenities ?? [];
  const mealTypes = host.mealTypes ?? [];
  const langs = host.languages ?? [];
  const wants = host.wantsExperience ? labelOf(WANTS_EXPERIENCE, host.wantsExperience, lang) : null;
  const routine = (host.dailyRoutine ?? []).filter((r) => r.activity?.trim());
  const rules = host.houseRules ?? [];
  const around = host.around ?? [];

  const hasWork = !!(host.work || help.length || host.maxVolunteers || host.hoursNote);
  const hasOffer = !!(host.accommodation || host.meals || mealTypes.length || host.daysOff || host.learn || amen.length || langs.length);
  const hasExp = !!(routine.length || around.length || host.nearby);
  const hasReq = !!(wants || host.minStay);

  return (
    <div className="divide-y divide-border">
      {/* 1 — Ne yapacaksın */}
      {hasWork && (
        <GSection icon={HandHelping} title={t("Ne yapacaksın", "What you'll do")}>
          {host.work && <p className="mb-4 whitespace-pre-wrap text-[14.5px] leading-relaxed text-ink-700">{host.work}</p>}
          {help.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {help.map((k) => (
                <span key={k} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-[13px] text-ink-700">
                  <DomainIcon map={HELP_ICONS} k={k} size={15} className="text-forest-600" />{labelOf(HELP_TYPES, k, lang)}
                </span>
              ))}
            </div>
          )}
          {(host.maxVolunteers || host.hoursNote) && (
            <div className="divide-y divide-border">
              {host.maxVolunteers && <Fact icon={Users} title={t("Aynı anda en fazla", "At once, up to")} note={host.maxVolunteers} />}
              {host.hoursNote && <Fact icon={Clock} title={t("Çalışma düzeni", "Work schedule")} note={host.hoursNote} />}
            </div>
          )}
        </GSection>
      )}

      {/* 2 — Sana neler sunuluyor */}
      {hasOffer && (
        <GSection icon={Gift} title={t("Sana neler sunuluyor", "What you get")}>
          {(host.accommodation || host.meals || mealTypes.length > 0 || host.daysOff || host.learn) && (
            <div className="mb-5 divide-y divide-border">
              {host.accommodation && (
                <Fact icon={BedDouble} title={t("Konaklama", "Accommodation")} note={host.accommodation}>
                  {onSeePhotos && (
                    <button type="button" onClick={onSeePhotos}
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-[12.5px] font-medium text-forest-700 transition hover:border-forest-500">
                      <Images size={14} strokeWidth={1.75} /> {t("Kalınacak yerin fotoğraflarını gör", "See photos of where you'll stay")}
                    </button>
                  )}
                </Fact>
              )}
              {(host.meals || mealTypes.length > 0) && (
                <div className="flex gap-3.5 py-3.5">
                  <span className="mt-0.5 shrink-0 text-ink-400"><Utensils size={18} strokeWidth={1.75} /></span>
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold text-ink-900">{t("Yemek", "Meals")}</div>
                    {mealTypes.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {mealTypes.map((k) => (
                          <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-[12px] text-ink-700">
                            <DomainIcon map={MEAL_ICONS} k={k} size={13} className="text-forest-600" />{labelOf(MEAL_TYPES, k, lang)}
                          </span>
                        ))}
                      </div>
                    )}
                    {host.meals && <p className="mt-2 text-[13.5px] leading-relaxed text-ink-600">{host.meals}</p>}
                  </div>
                </div>
              )}
              {host.daysOff && <Fact icon={TreePalm} title={t("İzin günleri", "Days off")} note={host.daysOff} />}
              {host.learn && <Fact icon={Sprout} title={t("Neler öğrenebilirsin", "What you can learn")} note={host.learn} />}
            </div>
          )}
          {(amen.length > 0 || langs.length > 0) && (
            <div className="grid gap-6 sm:grid-cols-2">
              {amen.length > 0 && (
                <ChipGroup label={t("Konaklama & olanaklar", "Facilities & amenities")}>
                  {amen.map((k) => (
                    <span key={k} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-[13px] text-ink-700">
                      <DomainIcon map={AMENITY_ICONS} k={k} size={15} className="text-forest-600" />{labelOf(AMENITIES, k, lang)}
                    </span>
                  ))}
                </ChipGroup>
              )}
              {langs.length > 0 && (
                <ChipGroup label={t("Konuşulan diller", "Languages spoken")}>
                  {langs.map((k) => (
                    <span key={k} className="rounded-full border border-border bg-surface px-3 py-1.5 text-[13px] text-ink-700">{labelOf(LANGUAGES, k, lang)}</span>
                  ))}
                </ChipGroup>
              )}
            </div>
          )}
        </GSection>
      )}

      {/* 3 — Bizimle deneyim */}
      {hasExp && (
        <GSection icon={Trees} title={t("Bizimle deneyim", "The experience")}>
          {routine.length > 0 && (
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-1.5 text-[13px] font-medium text-ink-600"><CalendarDays size={15} strokeWidth={1.75} /> {t("Tipik bir gün", "A typical day")}</div>
              <div className="ml-1 flex flex-col gap-3 border-l-2 border-sand-300 pl-4">
                {routine.map((r, i) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-[22px] top-1.5 size-2.5 rounded-full bg-moss-500 shadow-[0_0_0_3px_var(--color-bg)]" />
                    {r.time && <div className="text-[12px] font-semibold text-clay-600">{r.time}</div>}
                    <p className="text-[14px] text-ink-700">{r.activity}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {around.length > 0 && (
            <div className="rounded-[var(--radius-lg)] border border-border bg-surface px-4">
              <div className="divide-y divide-border">
                {around.map((r) => (
                  <Fact key={r.key} map={AROUND_ICONS} mapKey={r.key} title={labelOf(AROUND_US, r.key, lang)} note={r.note} />
                ))}
              </div>
            </div>
          )}
          {host.nearby && <p className="mt-4 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-700">{host.nearby}</p>}
        </GSection>
      )}

      {/* 4 — Gereksinimler */}
      {hasReq && (
        <GSection icon={ClipboardCheck} title={t("Gereksinimler", "Requirements")}>
          <div className="divide-y divide-border">
            {wants && <Fact icon={Star} title={t("Aranan gönüllü", "Volunteer wanted")} note={wants} />}
            {host.minStay && <Fact icon={CalendarClock} title={t("Minimum kalış", "Minimum stay")} note={host.minStay} />}
          </div>
        </GSection>
      )}

      {/* 5 — Ev kuralları */}
      {rules.length > 0 && (
        <GSection icon={House} title={t("Ev kuralları & ipuçları", "House rules & tips")}>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {rules.map((r) => (
              <div key={r.key} className="flex gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                <span className="mt-0.5 shrink-0 text-forest-600"><DomainIcon map={RULE_ICONS} k={r.key} size={17} /></span>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold text-ink-900">{labelOf(HOUSE_RULES, r.key, lang)}</div>
                  {r.note && <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-600">{r.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </GSection>
      )}
    </div>
  );
}

function GSection({ icon: Ic, title, hint, children }: { icon: LucideIcon; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="py-7 first:pt-0 last:pb-0">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-border bg-sand-100 text-forest-700"><Ic size={18} strokeWidth={1.75} /></span>
        <h3 className="font-display text-[19px] font-semibold text-ink-900">{title}</h3>
        {hint && <span className="ml-auto text-[12.5px] text-ink-400">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Fact({ icon: Ic, map, mapKey, title, note, children }: { icon?: LucideIcon; map?: Record<string, LucideIcon>; mapKey?: string; title: string; note?: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-3.5 py-3.5">
      <span className="mt-0.5 shrink-0 text-ink-400">
        {Ic ? <Ic size={18} strokeWidth={1.75} /> : map && mapKey ? <DomainIcon map={map} k={mapKey} /> : null}
      </span>
      <div className="min-w-0">
        <div className="text-[14px] font-semibold text-ink-900">{title}</div>
        {note && <p className="mt-0.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-600">{note}</p>}
        {children}
      </div>
    </div>
  );
}

function ChipGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 text-[13px] font-medium text-ink-600">{label}</div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
