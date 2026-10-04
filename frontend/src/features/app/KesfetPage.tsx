import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Avatar } from "@/components/ui/Avatar";
import { Stars } from "@/components/ui/Stars";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { Axis, MatchCard, MatchTag } from "@/lib/types";

const AXES: Axis[] = ["situation", "seek", "offer", "topic"];

export function KesfetPage() {
  const { t, lang } = useI18n();
  const AXIS_LABEL: Record<Axis, string> = {
    situation: t("Durum", "Situation"), seek: t("Aranan", "Seeking"), offer: t("Sunulan", "Offering"), topic: t("İlgi", "Interest"),
  };
  const tagLabel = (tg: { labelTr: string; labelEn: string }) => (lang === "en" ? tg.labelEn : tg.labelTr);
  const [members, setMembers] = useState<MatchCard[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [active, setActive] = useState<string | null>(null); // `${axis}:${value}`

  useEffect(() => {
    api.getCached<{ members: MatchCard[] }>("/members")
      .then((r) => setMembers(r.members))
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  const countries = useMemo(
    () => [...new Set(members.map((m) => m.country).filter(Boolean) as string[])].sort(),
    [members],
  );

  // Distinct tags across all members, grouped by axis, for the filter chips.
  const tagsByAxis = useMemo(() => {
    const map = new Map<string, MatchTag>();
    for (const m of members) for (const tg of m.tags) map.set(`${tg.axis}:${tg.value}`, tg);
    const grouped: Record<Axis, { value: string; labelTr: string; labelEn: string; key: string }[]> = {
      situation: [], seek: [], offer: [], topic: [],
    };
    for (const [key, tg] of map) grouped[tg.axis].push({ value: tg.value, labelTr: tg.labelTr, labelEn: tg.labelEn, key });
    return grouped;
  }, [members]);

  const filtered = members.filter((m) => {
    if (country && m.country !== country) return false;
    if (active && !m.tags.some((tg) => `${tg.axis}:${tg.value}` === active)) return false;
    if (q) {
      const hay = `${m.firstName ?? ""} ${m.headline ?? ""} ${m.city ?? ""} ${m.country ?? ""} ${m.tags.map((tg) => `${tg.labelTr} ${tg.labelEn}`).join(" ")}`.toLocaleLowerCase("tr");
      if (!hay.includes(q.toLocaleLowerCase("tr"))) return false;
    }
    return true;
  });

  return (
    <>
      <h1 className="font-display mb-1 text-2xl font-semibold">{t("Keşfet", "Discover")}</h1>
      <p className="mb-5 text-sm text-ink-500">{t("Topluluktaki insanları etiket ve konuma göre keşfet.", "Explore people in the community by tags and location.")}</p>

      {/* Filters */}
      <div className="mb-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={t("İsim, ilgi, konum ara…", "Search name, interest, location…")}
            className="min-w-[200px] flex-1 rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus:border-forest-600"
          />
          <select value={country} onChange={(e) => setCountry(e.target.value)}
            className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus:border-forest-600">
            <option value="">{t("Tüm ülkeler", "All countries")}</option>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {AXES.map((axis) => tagsByAxis[axis].length > 0 && (
          <div key={axis} className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-semibold text-ink-500">{AXIS_LABEL[axis]}:</span>
            {tagsByAxis[axis].map((tg) => (
              <button key={tg.key} onClick={() => setActive(active === tg.key ? null : tg.key)}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${active === tg.key ? "border-forest-600 bg-forest-600 text-white" : "border-border-strong bg-surface hover:border-forest-500"}`}>
                {tagLabel(tg)}
              </button>
            ))}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-ink-500">{t("Yükleniyor…", "Loading…")}</div>
      ) : err ? (
        <div className="py-16 text-center text-ink-700">{t("Yüklenemedi:", "Couldn't load:")} {err}</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-ink-500">
          {t("Bu filtreye uygun kişi bulunamadı.", "No one matches this filter.")}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => <Card key={m.id} m={m} />)}
        </div>
      )}
    </>
  );
}

function Card({ m }: { m: MatchCard }) {
  const { t, lang } = useI18n();
  const loc = [m.city, m.country].filter(Boolean).join(", ");
  const shown = m.matched.length ? m.matched : m.tags;
  return (
    <div className="flex flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div className="mb-3 flex items-center gap-3">
        <Avatar url={m.avatarUrl} className="size-11" />
        <div className="min-w-0">
          <div className="truncate font-semibold">{m.firstName}</div>
          <div className="truncate text-[13px] text-ink-500">{loc}{m.headline ? ` · ${m.headline}` : ""}</div>
          {(m.ratingCount ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-[12px] text-ink-500"><Stars value={m.ratingAvg ?? 0} className="text-[11px]" /> {m.ratingAvg} ({m.ratingCount})</div>
          )}
        </div>
        {m.score > 0 && <span className="ml-auto rounded-full bg-moss-500/15 px-2 py-0.5 text-[11px] font-semibold text-forest-700">{t(`%${Math.min(99, m.score * 40 + 20)} uyum`, `${Math.min(99, m.score * 40 + 20)}% match`)}</span>}
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
