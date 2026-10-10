import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Avatar } from "@/components/ui/Avatar";
import { Stars } from "@/components/ui/Stars";
import { useI18n } from "@/lib/i18n";
import { monthYear } from "@/lib/time";
import type { MatchCard } from "@/lib/types";

// One member card used everywhere matches/members are listed (Panel, Keşfet, …)
// so they look and read the same: rating, join date and match % all in one place.
export function MemberCard({ m, highlight = false }: { m: MatchCard; highlight?: boolean }) {
  const { t, lang } = useI18n();
  const loc = [m.city, m.country].filter(Boolean).join(", ");
  const shown = m.matched.length ? m.matched : m.tags;
  const pct = m.matchPct ?? (m.score > 0 ? Math.min(97, m.score * 20 + 40) : 0);
  return (
    <div className={`flex flex-col rounded-[var(--radius-lg)] border bg-surface p-5 ${highlight ? "border-moss-500 ring-1 ring-moss-500/30" : "border-border"}`}>
      <div className="mb-3 flex items-center gap-3">
        <Avatar url={m.avatarUrl} className="size-11" />
        <div className="min-w-0">
          <div className="truncate font-semibold">{m.firstName}</div>
          <div className="truncate text-[13px] text-ink-500">{loc}{m.headline ? ` · ${m.headline}` : ""}</div>
          {(m.ratingCount ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-[12px] text-ink-500"><Stars value={m.ratingAvg ?? 0} className="text-[11px]" /> {m.ratingAvg} ({m.ratingCount})</div>
          )}
          {m.joinedAt && <div className="text-[11.5px] text-ink-400">🗓️ {t("Üye:", "Member since:")} {monthYear(m.joinedAt, lang)}</div>}
        </div>
        {pct > 0 && <span className="ml-auto shrink-0 rounded-full bg-moss-500 px-2 py-0.5 text-[11px] font-semibold text-white">{t(`%${pct} uyum`, `${pct}% match`)}</span>}
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {shown.slice(0, 4).map((tg) => <Tag key={`${tg.axis}:${tg.value}`} axis={tg.axis}>{lang === "en" ? tg.labelEn : tg.labelTr}</Tag>)}
      </div>
      <div className="mt-auto">
        <Link to={`/app/uye/${m.id}`}><Button size="sm" className="w-full">{t("Profili gör", "View profile")}</Button></Link>
      </div>
    </div>
  );
}
