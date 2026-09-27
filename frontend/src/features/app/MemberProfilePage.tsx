import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { api, connections } from "@/lib/api";
import type { Axis, MemberDetail } from "@/lib/types";

const AXIS_LABEL: Record<Axis, string> = {
  situation: "Durumu", seek: "Aradıkları", offer: "Sundukları", topic: "İlgi alanları",
};
const AXES: Axis[] = ["situation", "seek", "offer", "topic"];

export function MemberProfilePage() {
  const { id } = useParams();
  const [m, setM] = useState<MemberDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    api.get<MemberDetail>(`/members/${id}`)
      .then(setM)
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }
  useEffect(load, [id]);

  async function connect() {
    if (!id) return;
    setBusy(true);
    try { await connections.request(id); load(); } finally { setBusy(false); }
  }
  async function accept() {
    if (!m?.connection) return;
    setBusy(true);
    try { await connections.accept(m.connection.connectionId); load(); } finally { setBusy(false); }
  }

  if (loading) return <div className="py-16 text-center text-ink-500">Yükleniyor…</div>;
  if (err || !m) return (
    <div className="py-16 text-center text-ink-700">
      Üye bulunamadı.<div className="mt-3"><Link to="/app/kesfet" className="text-forest-600 underline">← Keşfet'e dön</Link></div>
    </div>
  );

  const loc = [m.city, m.country].filter(Boolean).join(", ");
  const matchedKeys = new Set(m.matched.map((t) => `${t.axis}:${t.value}`));

  return (
    <div className="max-w-3xl">
      <Link to="/app/kesfet" className="mb-4 inline-block text-sm text-forest-600 hover:underline">← Keşfet</Link>

      <div className="mb-5 flex items-center gap-4">
        <div className="size-20 shrink-0 rounded-full bg-linear-135 from-moss-300 to-clay-500" />
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold">{m.firstName}</h1>
          <div className="text-sm text-ink-500">{loc || "Konum belirtilmedi"}{m.headline ? ` · ${m.headline}` : ""}</div>
          {m.score > 0 && <span className="mt-1 inline-block rounded-full bg-moss-500/15 px-2 py-0.5 text-[11px] font-semibold text-forest-700">Seninle uyumlu</span>}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <ConnectAction m={m} busy={busy} onConnect={connect} onAccept={accept} />
        <Button variant="outline" onClick={() => alert("Kaydetme özelliği yakında.")}>🔖 Kaydet</Button>
      </div>

      {m.connection?.status === "accepted" && m.contact && (
        <div className="mb-4 rounded-[var(--radius-lg)] border border-[#c6e0c2] bg-offer-bg p-5">
          <h2 className="mb-2.5 text-[15px] font-semibold text-forest-700">✓ Bağlantı kuruldu — iletişim bilgileri</h2>
          <div className="space-y-1 text-sm text-ink-700">
            {m.contact.contactEmail && <div>✉️ {m.contact.contactEmail}</div>}
            {m.contact.phone && <div>📞 {m.contact.phone}</div>}
            {m.contact.addressExact && <div>📍 {m.contact.addressExact}</div>}
            {m.contact.employer && <div>🏢 {m.contact.employer}</div>}
            {!m.contact.contactEmail && !m.contact.phone && <div className="text-ink-500">Bu üye henüz iletişim bilgisi eklememiş.</div>}
          </div>
        </div>
      )}

      {m.bio && (
        <Block title="Hakkında"><p className="text-sm text-ink-700">{m.bio}</p></Block>
      )}

      {AXES.map((axis) => {
        const tags = m.tags.filter((t) => t.axis === axis);
        if (tags.length === 0) return null;
        return (
          <Block key={axis} title={AXIS_LABEL[axis]}>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t.value} className={matchedKeys.has(`${t.axis}:${t.value}`) ? "rounded-full ring-2 ring-moss-500/40" : ""}>
                  <Tag axis={t.axis}>{t.labelTr}</Tag>
                </span>
              ))}
            </div>
          </Block>
        );
      })}

      <div className="mt-2 rounded-lg border border-[#c4dde5] bg-[#e0edf1] px-4 py-3 text-sm text-[#2c5462]">
        👁️ İletişim bilgileri (e-posta, telefon, tam adres) yalnızca karşılıklı bağlantı kabul edildikten sonra görünür.
      </div>
    </div>
  );
}

function ConnectAction({ m, busy, onConnect, onAccept }: {
  m: MemberDetail; busy: boolean; onConnect: () => void; onAccept: () => void;
}) {
  const conn = m.connection;
  if (!conn) return <Button disabled={busy} onClick={onConnect}>🤝 Bağlantı kur</Button>;
  if (conn.status === "accepted") return <Button variant="outline" disabled>✓ Bağlısınız</Button>;
  if (conn.status === "rejected") return <Button variant="outline" disabled>İstek reddedildi</Button>;
  // pending
  if (conn.direction === "incoming") return <Button disabled={busy} onClick={onAccept}>🤝 İsteği kabul et</Button>;
  return <Button variant="outline" disabled>⏳ İstek gönderildi</Button>;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h2 className="mb-2.5 text-[15px] font-semibold">{title}</h2>
      {children}
    </div>
  );
}
