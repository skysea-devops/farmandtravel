import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Avatar } from "@/components/ui/Avatar";
import { Stars } from "@/components/ui/Stars";
import { api, admin as adminApi, connections, reviews as reviewsApi, saved as savedApi } from "@/lib/api";
import type { Axis, MemberDetail, Photo, Profile, ReviewsData } from "@/lib/types";

const AXIS_LABEL: Record<Axis, string> = {
  situation: "Durumu", seek: "Aradıkları", offer: "Sundukları", topic: "İlgi alanları",
};
const AXES: Axis[] = ["situation", "seek", "offer", "topic"];

export function MemberProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [m, setM] = useState<MemberDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    api.getCached<Profile>("/profile/me").then((p) => setIsAdmin(!!p.isAdmin)).catch(() => {});
  }, []);

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
  async function toggleSaved() {
    if (!id || !m) return;
    setBusy(true);
    try {
      if (m.saved) await savedApi.remove(id); else await savedApi.add(id);
      setM({ ...m, saved: !m.saved });
    } finally { setBusy(false); }
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
        <Avatar url={m.avatarUrl} className="size-20" />
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold">{m.firstName}</h1>
          <div className="text-sm text-ink-500">{loc || "Konum belirtilmedi"}{m.headline ? ` · ${m.headline}` : ""}</div>
          <div className="mt-1 flex items-center gap-2">
            {(m.ratingCount ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-[13px] text-ink-600"><Stars value={m.ratingAvg ?? 0} /> {m.ratingAvg} ({m.ratingCount})</span>
            )}
            {m.score > 0 && <span className="rounded-full bg-moss-500/15 px-2 py-0.5 text-[11px] font-semibold text-forest-700">Seninle uyumlu</span>}
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <ConnectAction m={m} busy={busy} onConnect={connect} onAccept={accept} />
        {m.connection?.status === "accepted" && (
          <Button variant="outline" onClick={() => navigate(`/app/mesajlar/${m.connection!.connectionId}`)}>💬 Mesaj gönder</Button>
        )}
        <Button variant="outline" disabled={busy} onClick={toggleSaved}>{m.saved ? "🔖 Kaydedildi" : "🔖 Kaydet"}</Button>
      </div>

      {isAdmin && <AdminMessage memberId={m.id} name={m.firstName ?? "bu üye"} />}

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

      {m.photos && m.photos.length > 0 && (
        <Block title="Fotoğraflar">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {m.photos.map((ph: Photo) => ph.url && (
              <a key={ph.id} href={ph.url} target="_blank" rel="noreferrer" className="aspect-square overflow-hidden rounded-lg bg-sand-100">
                <img src={ph.url} alt="" className="h-full w-full object-cover transition hover:scale-105" />
              </a>
            ))}
          </div>
        </Block>
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

      <ReviewsSection memberId={m.id} name={m.firstName ?? "Bu üye"} />

      <div className="mt-2 rounded-lg border border-[#c4dde5] bg-[#e0edf1] px-4 py-3 text-sm text-[#2c5462]">
        👁️ İletişim bilgileri (e-posta, telefon, tam adres) yalnızca karşılıklı bağlantı kabul edildikten sonra görünür.
      </div>
    </div>
  );
}

function ReviewsSection({ memberId, name }: { memberId: string; name: string }) {
  const [data, setData] = useState<ReviewsData | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  function load() {
    reviewsApi.list<ReviewsData>(memberId).then((d) => {
      setData(d);
      if (d.myReview) { setRating(d.myReview.rating); setComment(d.myReview.comment ?? ""); }
    }).catch(() => {});
  }
  useEffect(load, [memberId]);

  async function submit() {
    if (!rating) return;
    setSaving(true);
    try { await reviewsApi.submit(memberId, rating, comment.trim() || undefined); setOpen(false); load(); }
    finally { setSaving(false); }
  }

  if (!data) return null;

  return (
    <Block title={`Değerlendirmeler${data.summary.count ? ` (${data.summary.count})` : ""}`}>
      {data.summary.count > 0 && (
        <div className="mb-3 flex items-center gap-2 text-sm text-ink-600">
          <Stars value={data.summary.avg} className="text-base" />
          <span className="font-semibold">{data.summary.avg}</span>
          <span className="text-ink-500">/ 5 · {data.summary.count} değerlendirme</span>
        </div>
      )}

      {data.canReview && (
        <div className="mb-4">
          {!open ? (
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              {data.myReview ? "★ Değerlendirmeni düzenle" : "★ Değerlendir"}
            </Button>
          ) : (
            <div className="rounded-[var(--radius-lg)] border border-border bg-bg p-4">
              <div className="mb-2 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button key={i} onClick={() => setRating(i)}
                    className={`text-2xl leading-none ${i <= rating ? "text-clay-500" : "text-border-strong"}`}>★</button>
                ))}
              </div>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
                placeholder={`${name} ile deneyimini birkaç cümleyle anlat…`}
                className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus:border-forest-600" />
              <div className="mt-2 flex gap-2">
                <Button size="sm" disabled={saving || !rating} onClick={submit}>{saving ? "Kaydediliyor…" : "Gönder"}</Button>
                <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Vazgeç</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {data.reviews.length === 0 ? (
        <p className="text-sm text-ink-500">Henüz değerlendirme yok.</p>
      ) : (
        <div className="space-y-3">
          {data.reviews.map((r, i) => (
            <div key={i} className="flex gap-3">
              <Avatar url={r.reviewer.avatarUrl} className="size-9" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{r.reviewer.firstName}</span>
                  <Stars value={r.rating} />
                </div>
                {r.comment && <p className="text-sm text-ink-700">{r.comment}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </Block>
  );
}

// Admin-only: send any message to this member from the official "Toprakla Yeniden"
// account — no connection required (announcements, reminders, warnings, anything).
function AdminMessage({ memberId, name }: { memberId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function send() {
    if (body.trim().length < 1) return;
    setBusy(true); setMsg(null);
    try {
      await adminApi.message(memberId, body.trim());
      setBody("");
      setMsg("Gönderildi.");
    } catch {
      setMsg("Gönderilemedi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-4 rounded-[var(--radius-lg)] border border-[#d9c7a3] bg-[#f7f0df] p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-[#6b5518]">🛡️ Admin: bu üyeye mesaj gönder</h2>
        {!open && <Button size="sm" variant="outline" onClick={() => setOpen(true)}>Mesaj yaz</Button>}
      </div>
      {open && (
        <div className="mt-3">
          <p className="mb-2 text-xs text-ink-600">{name} kişisine "Toprakla Yeniden" adıyla mesaj gider (bağlantı gerekmez).</p>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={4000}
            className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600"
            placeholder="Mesajın…" />
          <div className="mt-2 flex items-center gap-3">
            <Button size="sm" disabled={busy} onClick={send}>{busy ? "Gönderiliyor…" : "Gönder"}</Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Kapat</Button>
            {msg && <span className="text-sm text-ink-600">{msg}</span>}
          </div>
        </div>
      )}
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
