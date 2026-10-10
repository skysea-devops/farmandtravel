import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { MemberCard } from "@/components/MemberCard";
import { api, connections } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { Dashboard } from "@/lib/types";

export function PanelPage() {
  const { t } = useI18n();
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

  if (loading) return <div className="py-16 text-center text-ink-500">{t("Yükleniyor…", "Loading…")}</div>;
  if (err) return <div className="py-16 text-center text-ink-700">{t("Panel yüklenemedi:", "Couldn't load your home:")} {err}</div>;
  if (!d) return null;

  const stats = [
    { n: d.stats.matches, label: t("Sana uygun eşleşme", "Matches for you") },
    { n: d.stats.pendingConnections, label: t("Bekleyen bağlantı isteği", "Pending requests") },
    { n: d.stats.unreadMessages, label: t("Okunmamış mesaj", "Unread messages") },
    { n: d.stats.profileViews, label: t("Profil görüntülenme", "Profile views") },
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
          <h2 className="font-display text-xl font-semibold">{t("Sana uygun eşleşmeler", "Matches for you")}</h2>
          <Link to="/app/kesfet" className="text-sm text-forest-600 hover:underline">{t("Tümünü keşfet →", "Discover all →")}</Link>
        </div>
        {d.matches.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-8 text-center text-sm text-ink-500">
            {t("Henüz eşleşme yok. Profilindeki etiketleri zenginleştirdikçe uygun kişiler burada görünecek.", "No matches yet. As you enrich your profile tags, the right people will show up here.")}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.matches.slice(0, 6).map((m) => <MemberCard key={m.id} m={m} highlight />)}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">{t("Bekleyen istekler", "Pending requests")}</h2>
          <Link to="/app/baglantilar" className="text-sm text-forest-600 hover:underline">{t("Tümü →", "All →")}</Link>
        </div>
        {d.pendingRequests.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-6 text-center text-sm text-ink-500">
            {t("Bekleyen bağlantı isteğin yok.", "You have no pending requests.")}
          </div>
        ) : (
          <div className="space-y-2">
            {d.pendingRequests.map((r) => {
              const loc = [r.member.city, r.member.country].filter(Boolean).join(", ");
              return (
                <div key={r.connectionId} className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
                  <Avatar url={r.member.avatarUrl} className="size-11" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/app/uye/${r.member.id}`} className="font-semibold hover:underline">{r.member.firstName}</Link>
                    <div className="truncate text-[13px] text-ink-500">{loc}{r.member.headline ? ` · ${r.member.headline}` : ""}</div>
                    {r.message && <div className="mt-1 text-[13px] italic text-ink-600">"{r.message}"</div>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" disabled={busy === r.connectionId} onClick={() => act(r.connectionId, "accept")}>{t("Kabul et", "Accept")}</Button>
                    <Button size="sm" variant="outline" disabled={busy === r.connectionId} onClick={() => act(r.connectionId, "reject")}>{t("Reddet", "Decline")}</Button>
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

