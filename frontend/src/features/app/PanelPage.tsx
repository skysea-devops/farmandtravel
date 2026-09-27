import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { api, connections } from "@/lib/api";
import type { Dashboard, MatchCard } from "@/lib/types";

export function PanelPage() {
  const [d, setD] = useState<Dashboard | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  function load(cached = true) {
    (cached ? api.getCached<Dashboard>("/me/dashboard") : api.get<Dashboard>("/me/dashboard"))
      .then(setD)
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }
  useEffect(() => load(), []);

  async function act(id: string, kind: "accept" | "reject") {
    setBusy(id);
    try { await (kind === "accept" ? connections.accept(id) : connections.reject(id)); load(false); }
    finally { setBusy(null); }
  }

  if (loading) return <div className="py-16 text-center text-ink-500">Yükleniyor…</div>;
  if (err) return <div className="py-16 text-center text-ink-700">Panel yüklenemedi: {err}</div>;
  if (!d) return null;

  const stats = [
    { n: d.stats.matches, label: "Sana uygun eşleşme" },
    { n: d.stats.pendingConnections, label: "Bekleyen bağlantı isteği" },
    { n: d.stats.unreadMessages, label: "Okunmamış mesaj" },
    { n: d.stats.profileViews, label: "Profil görüntülenme" },
  ];

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
            <div className="font-display text-3xl font-semibold text-forest-700">{s.n}</div>
            <div className="mt-1 text-[13px] text-ink-500">{s.label}</div>
          </div>
        ))}
      </div>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Sana uygun eşleşmeler</h2>
          <Link to="/app/kesfet" className="text-sm text-forest-600 hover:underline">Tümünü keşfet →</Link>
        </div>
        {d.matches.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-8 text-center text-sm text-ink-500">
            Henüz eşleşme yok. Profilindeki etiketleri zenginleştirdikçe uygun kişiler burada görünecek.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.matches.slice(0, 6).map((m) => <MatchCardView key={m.id} m={m} />)}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Bekleyen istekler</h2>
          <Link to="/app/baglantilar" className="text-sm text-forest-600 hover:underline">Tümü →</Link>
        </div>
        {d.pendingRequests.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-6 text-center text-sm text-ink-500">
            Bekleyen bağlantı isteğin yok.
          </div>
        ) : (
          <div className="space-y-2">
            {d.pendingRequests.map((r) => {
              const loc = [r.member.city, r.member.country].filter(Boolean).join(", ");
              return (
                <div key={r.connectionId} className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
                  <div className="size-11 shrink-0 rounded-full bg-linear-135 from-moss-300 to-clay-500" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/app/uye/${r.member.id}`} className="font-semibold hover:underline">{r.member.firstName}</Link>
                    <div className="truncate text-[13px] text-ink-500">{loc}{r.member.headline ? ` · ${r.member.headline}` : ""}</div>
                    {r.message && <div className="mt-1 text-[13px] italic text-ink-600">"{r.message}"</div>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" disabled={busy === r.connectionId} onClick={() => act(r.connectionId, "accept")}>Kabul et</Button>
                    <Button size="sm" variant="outline" disabled={busy === r.connectionId} onClick={() => act(r.connectionId, "reject")}>Reddet</Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

function MatchCardView({ m }: { m: MatchCard }) {
  const loc = [m.city, m.country].filter(Boolean).join(", ");
  return (
    <div className="flex flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="size-11 shrink-0 rounded-full bg-linear-135 from-moss-300 to-clay-500" />
        <div className="min-w-0">
          <div className="truncate font-semibold">{m.firstName}</div>
          <div className="truncate text-[13px] text-ink-500">{loc}{m.headline ? ` · ${m.headline}` : ""}</div>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(m.matched.length ? m.matched : m.tags).slice(0, 3).map((t) => (
          <Tag key={`${t.axis}:${t.value}`} axis={t.axis}>{t.labelTr}</Tag>
        ))}
      </div>
      <div className="mt-auto flex items-center gap-2">
        <Link to={`/app/uye/${m.id}`} className="flex-1"><Button size="sm" className="w-full">Profili gör</Button></Link>
      </div>
    </div>
  );
}
