import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { useAuth } from "@/lib/auth";
import { DEMO_MEMBERS, CITY_MAP, TOPICS } from "@/data/demo";

type Dir = "all" | "offer" | "seek";

export function ExplorePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  // Logged-in members go to the real discovery; visitors get the join prompt.
  const gate = () => (user ? navigate("/app/kesfet") : setModal(true));
  const [dir, setDir] = useState<Dir>("all");
  const [farm, setFarm] = useState(false);
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [topic, setTopic] = useState("");
  const [lang, setLang] = useState("");
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  const results = useMemo(() => {
    const needle = q.toLocaleLowerCase("tr").trim();
    return DEMO_MEMBERS.filter((m) => {
      if (dir !== "all" && m.dir !== dir) return false;
      if (farm && !m.farm) return false;
      if (country && m.country !== country) return false;
      if (city && m.city !== city) return false;
      if (topic && m.topic !== topic) return false;
      if (lang && m.lang !== lang) return false;
      if (needle) {
        const hay = `${m.name} ${m.city} ${m.country} ${m.headline} ${m.tags.map((t) => t.label).join(" ")}`.toLocaleLowerCase("tr");
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [dir, farm, country, city, topic, lang, q]);

  const visible = new Set(results.map((m) => m.id));
  const countries = ["Türkiye", "Portekiz", "Almanya", "İspanya", "İtalya", "Hollanda"];

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
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="İsim, uzmanlık, çiftlik, konu ara…"
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
        <select disabled={!country} value={city} onChange={(e) => setCity(e.target.value)}
          className="rounded-full border border-border-strong bg-surface px-3.5 py-2 text-[13px] text-ink-700 disabled:opacity-60">
          <option value="">{country ? "🏙️ Tüm şehirler" : "🏙️ Önce ülke seç"}</option>
          {(CITY_MAP[country] ?? []).map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={topic} onChange={(e) => setTopic(e.target.value)}
          className="rounded-full border border-border-strong bg-surface px-3.5 py-2 text-[13px] text-ink-700">
          <option value="">🌱 Tüm konular</option>
          {TOPICS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <Sel value={lang} onChange={setLang} placeholder="🗣️ Tüm diller" options={["Türkçe", "İngilizce"]} />
        <button onClick={() => setFarm((f) => !f)}
          className={`rounded-full border px-3.5 py-2 text-[13px] ${farm ? "border-forest-600 bg-forest-600 text-white" : "border-border-strong bg-surface text-ink-700"}`}>
          🚜 Çiftlik sahipleri
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        {/* Harita */}
        <div className="relative h-[560px] overflow-hidden rounded-[var(--radius-lg)] border border-border bg-[#cfe0e2]">
          <button className="absolute top-3.5 right-3.5 z-10 rounded-full border border-border bg-white/95 px-3.5 py-2 text-[13px] font-semibold text-forest-700 shadow-sm">📍 Konumuma git</button>
          <svg viewBox="0 0 820 560" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
            <rect width="820" height="560" fill="#cfe0e2" />
            <path d="M-20,120 C120,80 260,90 360,60 C500,20 640,60 840,40 L840,300 C700,280 560,320 420,300 C300,285 140,320 -20,300 Z" fill="#e8e2d0" />
            <path d="M-20,300 C160,320 320,285 460,310 C620,338 740,300 840,320 L840,600 L-20,600 Z" fill="#dcd7c4" />
            <text x="150" y="110" fontFamily="Inter" fontSize="13" fill="#8a8877">Avrupa</text>
            <text x="600" y="250" fontFamily="Inter" fontSize="14" fill="#6b6a5c" fontWeight="600">Türkiye</text>
          </svg>
          {/* pins */}
          {DEMO_MEMBERS.filter((m) => visible.has(m.id)).map((m) => (
            <button key={m.id} onClick={gate}
              onMouseEnter={() => setHovered(m.id)} onMouseLeave={() => setHovered(null)}
              className="absolute -translate-x-1/2 -translate-y-full transition hover:-translate-y-[110%]"
              style={{ left: `${m.x}%`, top: `${m.y}%` }} aria-label={m.name}>
              <span className="block size-5 rounded-full rounded-bl-none border-2 border-white shadow"
                style={{ background: m.dir === "offer" ? "#3a7d44" : "#3a6b7e", transform: "rotate(-45deg)" }} />
              {hovered === m.id && (
                <span className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 rounded-md bg-forest-900 px-2.5 py-1.5 text-xs whitespace-nowrap text-white">
                  {m.name} · {m.city}
                </span>
              )}
            </button>
          ))}
          <div className="absolute bottom-3.5 left-3.5 rounded-xl border border-border bg-white/95 px-3 py-2.5 text-[12.5px] shadow-sm">
            <div className="my-0.5 flex items-center gap-2"><span className="size-3 rounded-full rounded-bl-none" style={{ background: "#3a7d44", transform: "rotate(-45deg)" }} /> Destek sunanlar</div>
            <div className="my-0.5 flex items-center gap-2"><span className="size-3 rounded-full rounded-bl-none" style={{ background: "#3a6b7e", transform: "rotate(-45deg)" }} /> Destek arayanlar</div>
          </div>
        </div>

        {/* Liste */}
        <div className="flex max-h-[560px] flex-col gap-2.5 overflow-y-auto">
          <div className="text-sm text-ink-500">{results.length} sonuç</div>
          {results.map((m) => (
            <button key={m.id} onClick={gate}
              className="flex gap-3 rounded-xl border border-border bg-surface p-3 text-left transition hover:border-forest-500 hover:shadow-sm">
              <div className="size-14 shrink-0 rounded-lg bg-cover bg-center bg-moss-300" style={{ backgroundImage: `url(${m.photo})` }} />
              <div>
                <div className="text-sm font-semibold">{m.name} · {m.flag}</div>
                <div className="mb-1.5 text-xs text-ink-500">{m.city}, {m.country} · {m.headline}</div>
                <div className="flex flex-wrap gap-1.5">
                  {m.tags.map((t) => <Tag key={t.label} axis={t.axis}>{t.label}</Tag>)}
                </div>
              </div>
            </button>
          ))}
          {results.length === 0 && <div className="rounded-xl border border-dashed border-border-strong p-6 text-center text-sm text-ink-500">Sonuç yok. Filtreleri gevşet.</div>}
        </div>
      </div>

      <div className="mt-3.5 flex items-center gap-2.5 rounded-xl border border-dashed border-border-strong bg-sand-100 px-4 py-3.5 text-[13.5px] text-ink-700">
        <span>🔒</span> Profilleri görmek ve bağlantı kurmak için üyelik gerekir. Haritayı ve kimlerin olduğunu üye olmadan görebilirsin.
      </div>

      {modal && (
        <div onClick={() => setModal(false)} className="fixed inset-0 z-60 flex items-center justify-center bg-forest-900/50 p-5">
          <div onClick={(e) => e.stopPropagation()} className="max-w-sm rounded-[var(--radius-lg)] bg-surface p-7 text-center shadow-xl">
            <div className="mb-2.5 text-4xl">🌿</div>
            <h3 className="font-display mb-2 text-2xl font-semibold">Bağlanmak için üye ol</h3>
            <p className="mb-5 text-sm text-ink-500">Haritayı keşfetmek ücretsiz. Profilleri görmek ve bağlantı kurmak için üyeliğini başlat.</p>
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
