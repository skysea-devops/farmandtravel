import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Avatar } from "@/components/ui/Avatar";
import { Stars } from "@/components/ui/Stars";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { PublicMember } from "@/lib/types";
import { coordsFor } from "@/data/geo";
import type { MapPin } from "./MembersMap";

// Leaflet is heavy; load it only when this page renders (keeps it out of the app bundle).
const MembersMap = lazy(() => import("./MembersMap"));

type Dir = "all" | "offer" | "seek";

export function ExplorePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [all, setAll] = useState<PublicMember[]>([]);
  const [loading, setLoading] = useState(true);

  const [dir, setDir] = useState<Dir>("all");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [topic, setTopic] = useState("");
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
    all.forEach((m) => m.tags.forEach((t) => { if (t.axis === "topic") map.set(t.value, t.labelTr); }));
    return [...map.entries()].map(([value, label]) => ({ value, label }));
  }, [all]);

  const results = useMemo(() => {
    const needle = q.toLocaleLowerCase("tr").trim();
    return all.filter((m) => {
      if (dir !== "all" && m.dir !== dir) return false;
      if (country && m.country !== country) return false;
      if (city && m.city !== city) return false;
      if (topic && !m.tags.some((t) => t.axis === "topic" && t.value === topic)) return false;
      if (needle) {
        const hay = `${m.firstName ?? ""} ${m.city ?? ""} ${m.country ?? ""} ${m.headline ?? ""} ${m.tags.map((t) => t.labelTr).join(" ")}`.toLocaleLowerCase("tr");
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [all, dir, country, city, topic, q]);

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
        <h1 className="font-display text-[28px] font-semibold">
          Keşfet <span className="ml-1 rounded-full bg-clay-500 px-3 py-1 align-middle text-xs font-semibold text-white">Önizleme · üye olmadan gör</span>
        </h1>
        <p className="text-sm text-ink-500">Ülkeye, şehre ve etiketlere göre destek sunanları ve arayanları haritada bul. Bağlanmak için üyelik gerekir.</p>
      </div>

      {/* çalışan-insan bandı */}
      <div className="mb-4 flex h-44 items-end overflow-hidden rounded-[var(--radius-lg)] bg-cover bg-center bg-linear-135 from-moss-500 to-forest-700"
        style={{ backgroundImage: `linear-gradient(90deg,rgba(28,49,38,.55),rgba(28,49,38,.15)), url(https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1600&q=80)` }}>
        <div className="font-display p-5 text-xl font-semibold text-white [text-shadow:0_1px_8px_rgba(0,0,0,.4)]">Toprakla uğraşan bir topluluk seni bekliyor</div>
      </div>

      {/* arama */}
      <div className="mb-3 flex max-w-xl items-center gap-2 rounded-full border border-border-strong bg-surface px-[18px] py-2.5">
        <span>🔍</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="İsim, uzmanlık, şehir, konu ara…"
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
              {d === "all" ? "Tümü" : d === "offer" ? "Destek sunanlar" : "Destek arayanlar"}
            </button>
          ))}
        </div>
        <Sel value={country} onChange={(v) => { setCountry(v); setCity(""); }} placeholder="🌍 Tüm ülkeler" options={countries} />
        <select disabled={!cities.length} value={city} onChange={(e) => setCity(e.target.value)}
          className="rounded-full border border-border-strong bg-surface px-3.5 py-2 text-[13px] text-ink-700 disabled:opacity-60">
          <option value="">🏙️ Tüm şehirler</option>
          {cities.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={topic} onChange={(e) => setTopic(e.target.value)}
          className="rounded-full border border-border-strong bg-surface px-3.5 py-2 text-[13px] text-ink-700">
          <option value="">🌱 Tüm konular</option>
          {topics.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Harita */}
        <Suspense fallback={<div className="h-[560px] rounded-[var(--radius-lg)] border border-border bg-[#e8eef0]" />}>
          <MembersMap pins={pins} onPinClick={open} />
        </Suspense>

        {/* Liste */}
        <div className="flex max-h-[560px] flex-col gap-2.5 overflow-y-auto">
          <div className="text-sm text-ink-500">{loading ? "Yükleniyor…" : `${results.length} sonuç`}</div>
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
                  {m.tags.slice(0, 4).map((t) => <Tag key={`${t.axis}-${t.value}`} axis={t.axis}>{t.labelTr}</Tag>)}
                </div>
              </div>
            </button>
          ))}
          {!loading && results.length === 0 && (
            <div className="rounded-xl border border-dashed border-border-strong p-6 text-center text-sm text-ink-500">
              {all.length === 0 ? "Henüz üye yok. İlk katılanlardan ol!" : "Sonuç yok. Filtreleri gevşet."}
            </div>
          )}
        </div>
      </div>

      <div className="mt-3.5 flex items-center gap-2.5 rounded-xl border border-dashed border-border-strong bg-sand-100 px-4 py-3.5 text-[13.5px] text-ink-700">
        <span>🔒</span> Profilleri görmek ve bağlantı kurmak için üyelik gerekir. Haritayı ve kimlerin olduğunu üye olmadan görebilirsin.
      </div>

      {modal && (
        <div onClick={() => setModal(false)} className="fixed inset-0 z-[1000] flex items-center justify-center bg-forest-900/50 p-5">
          <div onClick={(e) => e.stopPropagation()} className="max-w-sm rounded-[var(--radius-lg)] bg-surface p-7 text-center shadow-xl">
            <div className="mb-2.5 text-4xl">🌿</div>
            <h3 className="font-display mb-2 text-2xl font-semibold">Bağlanmak için üye ol</h3>
            <p className="mb-5 text-sm text-ink-500">Profilleri görmek ve bağlantı kurmak için üyeliğini başlat.</p>
            <Link to="/kayit"><Button className="w-full" size="lg">Üye ol</Button></Link>
            <p className="mt-3 text-sm text-ink-500">Zaten üye misin? <Link to="/giris" className="text-forest-600 underline">Giriş yap</Link></p>
            <Button variant="ghost" className="mt-2 w-full" onClick={() => setModal(false)}>Sonra</Button>
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
