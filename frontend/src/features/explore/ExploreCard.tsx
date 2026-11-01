import { BedDouble, Utensils, Wifi, Clock, CalendarCheck, Leaf, type LucideIcon } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Tag } from "@/components/ui/Tag";
import { Stars } from "@/components/ui/Stars";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";
import type { PublicMember } from "@/lib/types";
import { ROLE_META, isHost, joinedLabel } from "./roles";

// Üst-düzey, taranabilir olanak çipleri (host kartında). Anahtarları gruplar:
// barınma / yemek / internet — "Min süre" ayrı chip.
function amenityChips(host: NonNullable<PublicMember["host"]>, t: (tr: string, en: string) => string): { Icon: LucideIcon; label: string }[] {
  const a = new Set(host.amenities);
  const out: { Icon: LucideIcon; label: string }[] = [];
  if (a.has("private_room") || a.has("shared_room") || a.has("camping")) out.push({ Icon: BedDouble, label: t("Barınma", "Lodging") });
  if (a.has("shared_kitchen")) out.push({ Icon: Utensils, label: t("Yemek", "Meals") });
  if (a.has("wifi")) out.push({ Icon: Wifi, label: t("İnternet", "Wi-Fi") });
  return out;
}

function Chip({ Icon, children }: { Icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sand-100 px-2.5 py-1 text-[12px] font-medium text-ink-700">
      <Icon className="size-3.5 text-ink-500" /> {children}
    </span>
  );
}

export function ExploreCard({ m, onOpen, selected }: { m: PublicMember; onOpen: (id: string) => void; selected?: boolean }) {
  const { t, lang } = useI18n();
  const role = ROLE_META[m.category];
  const host = isHost(m.category) ? m.host : null;
  const topics = m.tags.filter((tg) => tg.axis === "topic").slice(0, 3);
  const joined = joinedLabel(m.joinedAt, lang);
  const months = m.availMonths ?? [];
  const monthLabel = months.length
    ? months.slice(0, 2).map((k) => new Date(k + "-01").toLocaleDateString(lang === "en" ? "en-GB" : "tr-TR", { month: "short" })).join(", ") + (months.length > 2 ? "…" : "")
    : null;

  return (
    <div
      id={`xm-${m.id}`}
      onClick={() => onOpen(m.id)}
      className={`flex cursor-pointer gap-3.5 rounded-xl border bg-surface p-3.5 transition hover:border-forest-500 hover:shadow-sm ${selected ? "border-forest-600 ring-2 ring-forest-500/30" : "border-border"}`}
    >
      <Avatar url={m.avatarUrl} className="size-16 shrink-0 rounded-lg sm:size-24" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-semibold">{m.firstName}</span>
              {m.ratingCount > 0 && <span className="flex items-center gap-1 text-xs font-normal text-ink-500"><Stars value={m.ratingAvg} /> {m.ratingAvg}</span>}
            </div>
            <div className="truncate text-[12.5px] text-ink-500">
              {[m.city, m.country].filter(Boolean).join(", ")}{joined ? ` · ${joined}` : ""}
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold text-white" style={{ background: role.color }}>
            <role.Icon className="size-3" /> {t(role.tr, role.en)}
          </span>
        </div>

        {topics.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {topics.map((tg) => <Tag key={`${tg.axis}-${tg.value}`} axis={tg.axis}>{lang === "en" ? tg.labelEn : tg.labelTr}</Tag>)}
          </div>
        )}

        {m.blurb && <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-600">{m.blurb}</p>}

        {/* Rol-duyarlı meta çipleri */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {host && amenityChips(host, t).map((c) => <Chip key={c.label} Icon={c.Icon}>{c.label}</Chip>)}
          {host?.minStay && <Chip Icon={Clock}>{host.minStay}</Chip>}
          {host?.mealTypes?.includes("vegetarian") && <Chip Icon={Leaf}>{t("Vejetaryen", "Vegetarian")}</Chip>}
          {monthLabel && <Chip Icon={CalendarCheck}>{t(`Müsait: ${monthLabel}`, `Available: ${monthLabel}`)}</Chip>}
        </div>

        <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => onOpen(m.id)}>{t("Profili İncele", "View profile")}</Button>
          <Button size="sm" onClick={() => onOpen(m.id)}>{t("Bağlantı Kur", "Connect")}</Button>
        </div>
      </div>
    </div>
  );
}
