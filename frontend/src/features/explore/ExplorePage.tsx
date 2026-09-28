import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Avatar } from "@/components/ui/Avatar";
import { Stars } from "@/components/ui/Stars";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import type { PublicMember } from "@/lib/types";
import { coordsFor } from "@/data/geo";
import type { MapPin } from "./MembersMap";

// Leaflet is heavy; load it only when this page renders (keeps it out of the app bundle).
const MembersMap = lazy(() => import("./MembersMap"));

type Dir = "all" | "offer" | "seek";

// Static (non-scrolling) photo strip for the Keşfet banner.
const BANNER_IMAGES = ["/community/s1.jpg", "/community/s7.jpg", "/community/s4.jpg", "/community/s6.jpg"];

export function ExplorePage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [all, setAll] = useState<PublicMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [dir, setDir] = useState<Dir>("all");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [topic, setTopic] = useState("");
  const [farm, setFarm] = useState(false);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);

  useEffect(() => {
    api.get<{ members: PublicMember[] }>("/public/members")
      .then((r) => setAll(r.members))
      .catch(() => setAll([]))
      .finally(() => setLoading(false));
  }, []);

  // Clicking anyone: guests get the join prompt; members go to the real profile.
  const open = (id: string) => (user ? navigate(`/app/uye/${id}`) : setModal(true));

  // Filter option lists derived from real data.
  const countries = useMemo(
    () => [...new Set(all.map((m) => m.country).filter(Boolean))] as string[],
    [all],
  );
  const cities = useMemo(
    () => [...new Set(all.filter((m) => !country || m.country === country).map((m) => m.city).filter(Boolean))] as string[],
    [all, country],
  );
  const topics = useMemo(() => {
    const map = new Map<string, string>();
    all.forEach((m) => m.tags.forEach((tag) => { if (tag.axis === "topic") map.set(tag.value, lang === "en" ? tag.labelEn : tag.labelTr); }));
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [all, lang]);

  const results = useMemo(() => {
    const needle = q.toLocaleLowerCase("tr").trim();
    return all.filter((m) => {
      if (dir !== "all" && m.dir !== dir) return false;
      if (country && m.country !== country) return false;
      if (city && m.city !== city) return false;
      if (topic && !m.tags.some((t) => t.axis === "topic" && t.value === topic)) return false;
      if (farm && !m.tags.some((t) => t.axis === "situation" && t.value === "farm-owner")) return false;
      if (needle) {
        const hay = `${m.firstName ?? ""} ${m.city ?? ""} ${m.country ?? ""} ${m.headline ?? ""} ${m.tags.map((t) => t.labelTr).join(" ")}`.toLocaleLowerCase("tr");
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [all, dir, country, city, topic, farm, q]);

  const pins = useMemo<MapPin[]>(() => {
    const out: MapPin[] = [];
    for (const m of results) {
      const c = coordsFor(m.country, m.city, m.id);
      if (c) out.push({ id: m.id, name: m.firstName ?? "Üye", city: m.city, dir: m.dir, lat: c[0], lng: c[1] });
    }
    return out;
  }, [results]);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-7">
      <div className="mb-4">
        <h1 className="font-display text-[28px] font-semibold">{t("Keşfet", "Explore")}</h1>
        <p className="text-sm text-ink-500">{t("Ülkeye, şehre ve etiketlere göre destek sunanları ve arayanları haritada bul. Bağlanmak için üyelik gerekir.", "Find people offering and seeking support on the map, by country, city and tags. Membership is required to connect.")}</p>
      </div>

      {/* çalışan-insan bandı — sabit fotoğraf şeridi (kaymaz) */}
      <div className="relative mb-4 h-44 overflow-hidden rounded-[var(--radius-lg)] bg-forest-900">
        <div className="absolute inset-0 flex">
          {BANNER_IMAGES.map((src) => (
            <div key={src} className="relative h-full flex-1 overflow-hidden">
              <div className="absolute inset-0 scale-110 bg-cover bg-center opacity-50 blur-lg" style={{ backgroundImage: `url(${src})` }} />
              <img src={src} alt="" className="relative h-full w-full object-contain" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-linear-90 from-forest-900/75 to-forest-900/15" />
        <div className="absolute bottom-0 left-0 font-display p-5 text-xl font-semibold text-white [text-shadow:0_1px_8px_rgba(0,0,0,.5)]">{t("Toprakla uğraşan bir topluluk seni bekliyor", "A community that works the land is waiting for you")}</div>
      </div>

      {/* arama */}
      <div className="mb-3 flex max-w-xl items-center gap-2 rounded-full border border-border-strong bg-surface px-[18px] py-2.5">
        <span>🔍</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("İsim, uzmanlık, şehir, konu ara…", "Search name, expertise, city, topic…")}
          className="w-full border-none bg-transparent text-sm outline-none" />
      </div>

      {/* filtreler */}
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="inline-flex gap-0.5 rounded-full bg-sand-200 p-0.5">
          {(["all", "offer", "seek"] as Dir[]).map((d) => (
            <button key={d} onClick={() => setDir(d)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold ${dir === d ? "bg-surface shadow-sm" : "text-ink-700"}`}>
              {d === "offer" && <span className="size-2.5 rounded-full bg-offer" />}
              {d === "seek" && <span className="size-2.5 rounded-full bg-seek" />}
              {d === "all" ? t("Tümü", "All") : d === "offer" ? t("Destek sunanlar", "Offering support") : t("Destek arayanlar", "Seeking support")}
            </button>
          ))}
        </div>
        <Sel value={country} onChange={(v) => { setCountry(v); setCity(""); }} placeholder={t("🌍 Tüm ülkeler", "🌍 All countries")} options={countries} />
        <select disabled={!cities.length} value={city} onChange={(e) => setCity(e.target.value)}
          className="rounded-full border border-border-strong bg-surface px-3.5 py-2 text-[13px] text-ink-700 disabled:opacity-60">
          <option value="">{t("🏙️ Tüm şehirler", "🏙️ All cities")}</option>
          {cities.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={topic} onChange={(e) => setTopic(e.target.value)}
          className="rounded-full border border-border-strong bg-surface px-3.5 py-2 text-[13px] text-ink-700">
          <option value="">{t("🌱 Tüm konular", "🌱 All topics")}</option>
          {topics.map((tp) => <option key={tp.value} value={tp.value}>{tp.label}</option>)}
        </select>
        <button onClick={() => setFarm((f) => !f)}
          className={`rounded-full border px-3.5 py-2 text-[13px] ${farm ? "border-forest-600 bg-forest-600 text-white" : "border-border-strong bg-surface text-ink-700"}`}>
          {t("🚜 Çiftlik sahipleri", "🚜 Farm owners")}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Harita */}
        <Suspense fallback={<div className="h-[560px] rounded-[var(--radius-lg)] border border-border bg-[#e8eef0]" />}>
          <MembersMap pins={pins} onPinClick={open} />
        </Suspense>

        {/* Liste */}
        <div className="flex max-h-[560px] flex-col gap-2.5 overflow-y-auto">
          <div className="text-sm text-ink-500">{loading ? t("Yükleniyor…", "Loading…") : t(`${results.length} sonuç`, `${results.length} results`)}</div>
          {results.map((m) => (
            <button key={m.id} onClick={() => open(m.id)}
              className="flex gap-3 rounded-xl border border-border bg-surface p-3 text-left transition hover:border-forest-500 hover:shadow-sm">
              <Avatar url={m.avatarUrl} className="size-14 rounded-lg" />
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {m.firstName}
                  {m.ratingCount > 0 && <span className="flex items-center gap-1 text-xs font-normal text-ink-500"><Stars value={m.ratingAvg} className="text-[11px]" /> {m.ratingAvg}</span>}
                </div>
                <div className="mb-1.5 text-xs text-ink-500">{[m.city, m.country].filter(Boolean).join(", ")}{m.headline ? ` · ${m.headline}` : ""}</div>
                <div className="flex flex-wrap gap-1.5">
                  {m.tags.slice(0, 4).map((tag) => <Tag key={`${tag.axis}-${tag.value}`} axis={tag.axis}>{lang === "en" ? tag.labelEn : tag.labelTr}</Tag>)}
                </div>
              </div>
            </button>
          ))}
          {!loading && results.length === 0 && (
            <div className="rounded-xl border border-dashed border-border-strong p-6 text-center text-sm text-ink-500">
              {all.length === 0 ? t("Henüz üye yok. İlk katılanlardan ol!", "No members yet. Be one of the first to join!") : t("Sonuç yok. Filtreleri gevşet.", "No results. Try loosening the filters.")}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3.5 flex items-center gap-2.5 rounded-xl border border-dashed border-border-strong bg-sand-100 px-4 py-3.5 text-[13.5px] text-ink-700">
        <span>🔒</span> {t("Profilleri görmek ve bağlantı kurmak için üyelik gerekir. Haritayı ve kimlerin olduğunu üye olmadan görebilirsin.", "Membership is required to view profiles and connect. You can see the map and who's here without signing up.")}
      </div>

      {modal && (
        <div onClick={() => setModal(false)} className="fixed inset-0 z-[1000] flex items-center justify-center bg-forest-900/50 p-5">
          <div onClick={(e) => e.stopPropagation()} className="max-w-sm rounded-[var(--radius-lg)] bg-surface p-7 text-center shadow-xl">
            <div className="mb-2.5 text-4xl">🌿</div>
            <h3 className="font-display mb-2 text-2xl font-semibold">{t("Bağlanmak için üye ol", "Join to connect")}</h3>
            <p className="mb-5 text-sm text-ink-500">{t("Profilleri görmek ve bağlantı kurmak için üyeliğini başlat.", "Start your membership to view profiles and connect.")}</p>
            <Link to="/kayit"><Button className="w-full" size="lg">{t("Üye ol", "Join")}</Button></Link>
            <p className="mt-3 text-sm text-ink-500">{t("Zaten üye misin?", "Already a member?")} <Link to="/giris" className="text-forest-600 underline">{t("Giriş yap", "Log in")}</Link></p>
            <Button variant="ghost" className="mt-2 w-full" onClick={() => setModal(false)}>{t("Sonra", "Later")}</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Sel({ value, onChange, placeholder, options }: { value: string; onChange: (v: string) => void; placeholder: string; options: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="rounded-full border border-border-strong bg-surface px-3.5 py-2 text-[13px] text-ink-700">
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  );
}
