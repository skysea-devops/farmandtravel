import { useI18n } from "@/lib/i18n";
import { FARM_EXPERIENCE, labelOf } from "@/data/host";

export interface VolunteerDetails {
  experience?: "experienced" | "willing"; // çiftlik deneyimi (zorunlu)
}

export function VolunteerExperienceField({ value, onChange }: { value: VolunteerDetails; onChange: (v: VolunteerDetails) => void }) {
  const { t, lang } = useI18n();
  return (
    <div>
      <div className="mb-1.5 text-[13px] font-semibold text-ink-700">
        {t("Çiftlik deneyimin", "Your farm experience")}<span className="text-clay-600"> *</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {FARM_EXPERIENCE.map((o) => (
          <button key={o.key} type="button" onClick={() => onChange({ experience: o.key as VolunteerDetails["experience"] })}
            className={`rounded-full border px-3.5 py-2 text-[13px] transition ${value.experience === o.key ? "border-forest-600 bg-forest-600 text-white" : "border-border-strong bg-surface hover:border-forest-500"}`}>
            {lang === "en" ? o.en : o.tr}
          </button>
        ))}
      </div>
    </div>
  );
}

export function VolunteerExperienceView({ value }: { value: VolunteerDetails }) {
  const { t, lang } = useI18n();
  if (!value?.experience) return null;
  return (
    <div>
      <div className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-clay-600">{t("Çiftlik deneyimi", "Farm experience")}</div>
      <p className="text-sm text-ink-700">{labelOf(FARM_EXPERIENCE, value.experience, lang)}</p>
    </div>
  );
}
