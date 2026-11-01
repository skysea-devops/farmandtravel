import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Lock, Sprout, SlidersHorizontal, List, Map as MapIcon, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { api } from "@/lib/api";
import type { PublicMember } from "@/lib/types";
import { coordsFor } from "@/data/geo";
import type { MapPin } from "./MembersMap";
import { MAP_COLORS } from "./categories";
import { ROLE_META, SUPPORT_META, supportOf, type Role, type Support } from "./roles";
import { ExploreCard } from "./ExploreCard";

const MembersMap = lazy(() => import("./MembersMap"));

const BANNER_IMAGES = ["/community/s1.jpg", "/community/s7.jpg", "/community/s4.jpg", "/community/s6.jpg"];

// Üst-düzey olanak filtreleri (kart çipleriyle aynı gruplama).
const AMEN_FILTERS: { key: string; tr: string; en: string; match: (a: string[]) => boolean }[] = [
  { key: "lodging", tr: "Barınma", en: "Lodging", match: (a) => a.some((x) => ["private_room", "shared_room", "camping"].includes(x)) },
  { key: "meals", tr: "Yemek", en: "Meals", match: (a) => a.includes("shared_kitchen") },
  { key: "wifi", tr: "İnternet", en: "Wi-Fi", match: (a) => a.includes("wifi") },
];

const nowMonthKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };

type RoleFilter = "all" | Role;
type Avail = "all" | "month" | "any";

export function ExplorePage() {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [all, setAll] = useState<PublicMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [role, setRole] = useState<RoleFilter>("all");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [topics, setTopics] = useState<Set<string>>(new Set());
  const [supports, setSupports] = useState<Set<Support>>(new Set());
  const [amenities, setAmenities] = useState<Set<string>>(new Set());
  const [avail, setAvail] = useState<Avail>("all");
  const [q, setQ] = useState("");

  const [view, setView] = useState<"list" | "map">("list");
  const [sheet, setSheet] = useState(false);
  const [modal, setModal] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    api.get<{ members: PublicMember[] }>("/public/members")
      .then((r) => setAll(r.members))
      .catch(() => setAll([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user) { setMyId(null); return; }
    api.getCached<{ id: string }>("/profile/me").then((p) => setMyId(p.id)).catch(() => {});
  }, [user]);

  const open = (id: string) =>
    !user ? setModal(true) : navigate(id === myId ? "/app/profil" : `/app/uye/${id}`);

  const selectFromPin = (id: string) => {
    setSelectedId(id);
    setView("list");
    requestAnimationFrame(() => document.getElementById(`xm-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  const countries = useMemo(() => [...new Set(all.map((m) => m.country).filter(Boolean))] as string[], [all]);
  const cities = useMemo(() => [...new Set(all.filter((m) => !country || m.country === country).map((m) => m.city).filter(Boolean))] as string[], [all, country]);
  const topicOptions = useMemo(() => {
    const map = new Map<string, string>();
    all.forEach((m) => m.tags.forEach((tag) => { if (tag.axis === "topic") map.set(tag.value, lang === "en" ? tag.labelEn : tag.labelTr); }));
    return [...map.entries()].map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label, "tr"));
  }, [all, lang]);
  const roleCounts = useMemo(() => {
    const c: Record<RoleFilter, number> = { all: all.length, host_active: 0, host_idle: 0, volunteer: 0, other: 0 };
    all.forEach((m) => { c[m.category]++; });
    return c;
  }, [all]);

  const nowKey = nowMonthKey();
  const results = useMemo(() => {
    const needle = q.toLocaleLowerCase("tr").trim();
    return all.filter((m) => {
      if (role !== "all" && m.category !== role) return false;
      if (country && m.country !== country) return false;
      if (city && m.city !== city) return false;
      if (topics.size && !m.tags.some((tg) => tg.axis === "topic" && topics.has(tg.value))) return false;
      if (supports.size) { const s = supportOf(m.tags); if (![...supports].some((x) => s.has(x))) return false; }
      if (amenities.size) {
        const a = m.host?.amenities;
        if (!a) return false;
        if (![...amenities].every((k) => AMEN_FILTERS.find((f) => f.key === k)!.match(a))) return false;
      }
      if (avail === "month" && !(m.availMonths ?? []).includes(nowKey)) return false;
      if (avail === "any" && !(m.availMonths ?? []).length) return false;
      if (needle) {
        const hay = `${m.firstName ?? ""} ${m.city ?? ""} ${m.country ?? ""} ${m.headline ?? ""} ${m.blurb ?? ""} ${m.tags.map((t) => t.labelTr).join(" ")}`.toLocaleLowerCase("tr");
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [all, role, country, city, topics, supports, amenities, avail, q, nowKey]);

  const pins = useMemo<MapPin[]>(() => {
    const out: MapPin[] = [];
    for (const m of results) {
      const c = coordsFor(m.country, m.city, m.id);
      if (c) out.push({ id: m.id, name: m.firstName ?? "Üye", city: m.city, category: m.category, lat: c[0], lng: c[1] });
    }
    return out;
  }, [results]);

  const activeFilters = (role !== "all" ? 1 : 0) + (country ? 1 : 0) + (city ? 1 : 0) + topics.size + supports.size + amenities.size + (avail !== "all" ? 1 : 0);
  const clearAll = () => { setRole("all"); setCountry(""); setCity(""); setTopics(new Set()); setSupports(new Set()); setAmenities(new Set()); setAvail("all"); };
  const toggle = <T,>(set: Set<T>, val: T, setter: (s: Set<T>) => void) => {
    const n = new Set(set); n.has(val) ? n.delete(val) : n.add(val); setter(n);
  };

  const filtersPanel = (
    <div className="space-y-5 text-sm">
      {/* Rol */}
      <FilterGroup title={t("Üyelik tipi", "Member type")}>
        {(["all", "host_active", "host_idle", "volunteer", "other"] as RoleFilter[]).map((r) => (
          <label key={r} className="flex cursor-pointer items-center gap-2 py-1">
            <input type="radio" name="role" checked={role === r} onChange={() => setRole(r)} className="accent-forest-600" />
            {r !== "all" && <span className="size-2.5 rounded-full" style={{ background: MAP_COLORS[r] }} />}
            <span className="flex-1">{r === "all" ? t("Tümü", "All") : t(ROLE_META[r].tr, ROLE_META[r].en)}</span>
            <span className="text-xs text-ink-400">{roleCounts[r]}</span>
          </label>
        ))}
      </FilterGroup>

      {/* Şehir / bölge */}
      <FilterGroup title={t("Şehir veya bölge", "City or region")}>
        <select value={country} onChange={(e) => { setCountry(e.target.value); setCity(""); }} className={selCls}>
          <option value="">{t("Tüm ülkeler", "All countries")}</option>
          {countries.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select disabled={!cities.length} value={city} onChange={(e) => setCity(e.target.value)} className={`${selCls} mt-2 disabled:opacity-60`}>
          <option value="">{t("Tüm şehirler", "All cities")}</option>
          {cities.map((c) => <option key={c}>{c}</option>)}
        </select>
      </FilterGroup>

      {/* Paylaşılan bilgi alanı */}
      {topicOptions.length > 0 && (
        <FilterGroup title={t("Paylaşılan bilgi alanı", "Knowledge area")}>
          <div className="max-h-44 space-y-0.5 overflow-y-auto pr-1">
            {topicOptions.map((tp) => (
              <label key={tp.value} className="flex cursor-pointer items-center gap-2 py-1">
                <input type="checkbox" checked={topics.has(tp.value)} onChange={() => toggle(topics, tp.value, setTopics)} className="accent-forest-600" />
                <span className="flex-1">{tp.label}</span>
              </label>
            ))}
          </div>
        </FilterGroup>
      )}

      {/* Destek türü */}
      <FilterGroup title={t("Destek türü", "Type of support")}>
        {SUPPORT_META.map((s) => (
          <label key={s.key} className="flex cursor-pointer items-center gap-2 py-1">
            <input type="checkbox" checked={supports.has(s.key)} onChange={() => toggle(supports, s.key, setSupports)} className="accent-forest-600" />
            <span className="flex-1">{t(s.tr, s.en)}</span>
          </label>
        ))}
      </FilterGroup>

      {/* Olanaklar */}
      <FilterGroup title={t("İmkânlar (ev sahipleri)", "Amenities (hosts)")}>
        {AMEN_FILTERS.map((a) => (
          <label key={a.key} className="flex cursor-pointer items-center gap-2 py-1">
            <input type="checkbox" checked={amenities.has(a.key)} onChange={() => toggle(amenities, a.key, setAmenities)} className="accent-forest-600" />
            <span className="flex-1">{t(a.tr, a.en)}</span>
          </label>
        ))}
      </FilterGroup>

      {/* Müsaitlik */}
      <FilterGroup title={t("Müsaitlik", "Availability")}>
        {([["all", t("Hepsi", "Any")], ["month", t("Bu ay müsait", "Available this month")], ["any", t("Bir dönem müsait", "Has open dates")]] as [Avail, string][]).map(([v, label]) => (
          <label key={v} className="flex cursor-pointer items-center gap-2 py-1">
            <input type="radio" name="avail" checked={avail === v} onChange={() => setAvail(v)} className="accent-forest-600" />
            <span className="flex-1">{label}</span>
          </label>
        ))}
      </FilterGroup>

      {activeFilters > 0 && (
        <button onClick={clearAll} className="text-[13px] font-semibold text-forest-600 hover:underline">{t("Filtreleri temizle", "Clear filters")}</button>
      )}
    </div>
  );
  // filtersPanel bitti

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-7 md:px-6">
      <div className="mb-4">
        <h1 className="font-display text-[28px] font-semibold">{t("Keşfet", "Explore")}</h1>
        <p className="text-sm text-ink-500">{t("Üreticileri, bilgi paylaşanları, gönüllüleri ve destekçileri bul; role, konuya ve konuma göre filtrele. Haritayı ve kimlerin olduğunu üye olmadan görebilirsin.", "Find producers, knowledge-sharers, volunteers and supporters; filter by role, topic and location. You can see the map and who's here without signing up.")}</p>
      </div>

      <div className="relative mb-4 h-40 overflow-hidden rounded-[var(--radius-lg)] bg-forest-900">
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

      <div className="mb-4 flex items-center gap-2 rounded-full border border-border-strong bg-surface px-[18px] py-2.5">
        <Search size={16} strokeWidth={1.75} className="shrink-0 text-ink-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("İsim, uzmanlık, şehir, konu ara…", "Search name, expertise, city, topic…")}
          className="w-full border-none bg-transparent text-sm outline-none" />
      </div>

      {/* Mobil: filtre aç + görünüm */}
      <div className="mb-3 flex items-center justify-between gap-2 lg:hidden">
        <button onClick={() => setSheet(true)} className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-4 py-2 text-[13px] font-semibold">
          <SlidersHorizontal className="size-4" /> {t("Filtrele", "Filters")}{activeFilters > 0 ? ` (${activeFilters})` : ""}
        </button>
        <ViewToggle view={view} setView={setView} t={t} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        {/* Masaüstü sol filtre paneli */}
        <aside className="hidden lg:block">
          <div className="sticky top-5 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            {filtersPanel}
          </div>
        </aside>

        {/* Sonuç alanı */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="text-sm text-ink-500">{loading ? t("Yükleniyor…", "Loading…") : t(`${results.length} sonuç`, `${results.length} results`)}</div>
            <div className="hidden lg:block"><ViewToggle view={view} setView={setView} t={t} /></div>
          </div>

          {view === "map" ? (
            <Suspense fallback={<div className="h-[720px] rounded-[var(--radius-lg)] border border-border bg-[#e8eef0]" />}>
              <MembersMap pins={pins} onPinClick={selectFromPin} />
            </Suspense>
          ) : (
            <div className="flex flex-col gap-3">
              {results.map((m) => (
                <ExploreCard key={m.id} m={m} onOpen={open} selected={selectedId === m.id} />
              ))}
              {!loading && results.length === 0 && (
                <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong p-8 text-center">
                  <p className="text-sm text-ink-600">{all.length === 0
                    ? t("Henüz üye yok. İlk katılanlardan sen ol!", "No members yet. Be one of the first to join!")
                    : t("Bu kriterlere uygun üye bulunamadı. Filtreleri genişletebilir ya da bu bölgede ilk sen olabilirsin.", "No members match these filters. Try widening them, or be the first here.")}</p>
                  {all.length > 0 && activeFilters > 0 && <button onClick={clearAll} className="mt-2 text-[13px] font-semibold text-forest-600 hover:underline">{t("Filtreleri temizle", "Clear filters")}</button>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-dashed border-border-strong bg-sand-100 px-4 py-3.5 text-[13.5px] text-ink-700">
        <Lock size={16} strokeWidth={1.75} className="shrink-0 text-ink-400" /> {t("Profilleri görmek ve bağlantı kurmak için üyelik gerekir. Haritayı ve kimlerin olduğunu üye olmadan görebilirsin.", "Membership is required to view profiles and connect. You can see the map and who's here without signing up.")}
      </div>

      {/* Mobil bottom sheet filtre */}
      {sheet && (
        <div className="fixed inset-0 z-[1000] lg:hidden" onClick={() => setSheet(false)}>
          <div className="absolute inset-0 bg-forest-900/40" />
          <div onClick={(e) => e.stopPropagation()} className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-bg p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">{t("Filtreler", "Filters")}</h3>
              <button onClick={() => setSheet(false)} aria-label={t("Kapat", "Close")}><X className="size-5" /></button>
            </div>
            {filtersPanel}
            <Button className="mt-5 w-full" onClick={() => setSheet(false)}>{t(`Sonuçları gör (${results.length})`, `Show results (${results.length})`)}</Button>
          </div>
        </div>
      )}

      {modal && (
        <div onClick={() => setModal(false)} className="fixed inset-0 z-[1000] flex items-center justify-center bg-forest-900/50 p-5">
          <div onClick={(e) => e.stopPropagation()} className="max-w-sm rounded-[var(--radius-lg)] bg-surface p-7 text-center shadow-xl">
            <div className="mb-3 flex justify-center"><span className="grid size-14 place-items-center rounded-full bg-offer-bg text-forest-700"><Sprout size={28} strokeWidth={1.75} /></span></div>
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

const selCls = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-[13px] text-ink-700";

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-ink-400">{title}</div>
      {children}
    </div>
  );
}

function ViewToggle({ view, setView, t }: { view: "list" | "map"; setView: (v: "list" | "map") => void; t: (tr: string, en: string) => string }) {
  return (
    <div className="inline-flex rounded-full bg-sand-200 p-0.5 text-[13px] font-semibold">
      <button onClick={() => setView("list")} className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 ${view === "list" ? "bg-surface shadow-sm" : "text-ink-600"}`}>
        <List className="size-4" /> {t("Liste", "List")}
      </button>
      <button onClick={() => setView("map")} className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 ${view === "map" ? "bg-surface shadow-sm" : "text-ink-600"}`}>
        <MapIcon className="size-4" /> {t("Harita", "Map")}
      </button>
    </div>
  );
}
