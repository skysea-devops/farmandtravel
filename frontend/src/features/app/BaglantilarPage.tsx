import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { api, connections } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { ConnItem, Connections } from "@/lib/types";

export function BaglantilarPage() {
  const { t } = useI18n();
  const [data, setData] = useState<Connections | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  function load() {
    setLoading(true);
    api.getCached<Connections>("/connections")
      .then(setData)
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function act(id: string, kind: "accept" | "reject") {
    setBusy(id);
    try { await (kind === "accept" ? connections.accept(id) : connections.reject(id)); load(); }
    finally { setBusy(null); }
  }

  if (loading) return <div className="py-16 text-center text-ink-500">{t("Yükleniyor…", "Loading…")}</div>;
  if (err || !data) return <div className="py-16 text-center text-ink-700">{t("Yüklenemedi:", "Couldn't load:")} {err}</div>;

  return (
    <>
      <h1 className="font-display mb-5 text-2xl font-semibold">{t("Bağlantılar", "Connections")}</h1>

      <Section title={`${t("Gelen istekler", "Incoming requests")}${data.incoming.length ? ` (${data.incoming.length})` : ""}`}>
        {data.incoming.length === 0 ? <Empty>{t("Bekleyen gelen isteğin yok.", "No incoming requests.")}</Empty> : data.incoming.map((c) => (
          <Row key={c.connectionId} c={c}>
            <div className="flex gap-2">
              <Button size="sm" disabled={busy === c.connectionId} onClick={() => act(c.connectionId, "accept")}>{t("Kabul et", "Accept")}</Button>
              <Button size="sm" variant="outline" disabled={busy === c.connectionId} onClick={() => act(c.connectionId, "reject")}>{t("Reddet", "Decline")}</Button>
            </div>
          </Row>
        ))}
      </Section>

      <Section title={t("Gönderilen istekler", "Sent requests")}>
        {data.outgoing.length === 0 ? <Empty>{t("Bekleyen gönderilmiş isteğin yok.", "No pending sent requests.")}</Empty> : data.outgoing.map((c) => (
          <Row key={c.connectionId} c={c}><span className="text-xs text-ink-500">{t("⏳ Yanıt bekleniyor", "⏳ Awaiting response")}</span></Row>
        ))}
      </Section>

      <Section title={`${t("Bağlantılarım", "My connections")}${data.accepted.length ? ` (${data.accepted.length})` : ""}`}>
        {data.accepted.length === 0 ? <Empty>{t("Henüz bağlantın yok. Keşfet'ten insanlarla bağlantı kur.", "No connections yet. Connect with people from Discover.")}</Empty> : data.accepted.map((c) => (
          <Row key={c.connectionId} c={c}>
            <div className="flex flex-col items-end gap-1.5">
              <Link to={`/app/mesajlar/${c.connectionId}`}><Button size="sm" variant="outline">{t("💬 Mesaj", "💬 Message")}</Button></Link>
              {c.contact?.contactEmail && <div className="text-xs text-ink-500">{c.contact.contactEmail}</div>}
            </div>
          </Row>
        ))}
      </Section>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="font-display mb-3 text-lg font-semibold">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-6 text-center text-sm text-ink-500">{children}</div>;
}

function Row({ c, children }: { c: ConnItem; children: React.ReactNode }) {
  const m = c.member;
  const loc = [m.city, m.country].filter(Boolean).join(", ");
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4">
      <Avatar url={m.avatarUrl} className="size-11" />
      <div className="min-w-0 flex-1">
        <Link to={`/app/uye/${m.id}`} className="font-semibold hover:underline">{m.firstName}</Link>
        <div className="truncate text-[13px] text-ink-500">{loc}{m.headline ? ` · ${m.headline}` : ""}</div>
        {c.message && <div className="mt-1 text-[13px] text-ink-600 italic">"{c.message}"</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
