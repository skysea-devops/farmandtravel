import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Avatar } from "@/components/ui/Avatar";
import { Stars } from "@/components/ui/Stars";
import { StarInput } from "@/components/ui/StarInput";
import { api, admin as adminApi, connections, reviews as reviewsApi, saved as savedApi } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { Axis, MemberDetail, Photo, Profile, ReviewsData } from "@/lib/types";

const AXES: Axis[] = ["situation", "seek", "offer", "topic"];

export function MemberProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const AXIS_LABEL: Record<Axis, string> = {
    situation: t("Durumu", "Situation"), seek: t("Aradıkları", "Looking for"), offer: t("Sundukları", "Offers"), topic: t("İlgi alanları", "Interests"),
  };
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

  if (loading) return <div className="py-16 text-center text-ink-500">{t("Yükleniyor…", "Loading…")}</div>;
  if (err || !m) return (
    <div className="py-16 text-center text-ink-700">
      {t("Üye bulunamadı.", "Member not found.")}<div className="mt-3"><Link to="/app/kesfet" className="text-forest-600 underline">{t("← Keşfet'e dön", "← Back to Discover")}</Link></div>
    </div>
  );

  const loc = [m.city, m.country].filter(Boolean).join(", ");
  const matchedKeys = new Set(m.matched.map((tg) => `${tg.axis}:${tg.value}`));

  return (
    <div className="max-w-3xl">
      <Link to="/app/kesfet" className="mb-4 inline-block text-sm text-forest-600 hover:underline">{t("← Keşfet", "← Discover")}</Link>

      <div className="mb-5 flex items-center gap-4">
        <Avatar url={m.avatarUrl} className="size-20" />
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold">{m.firstName}</h1>
          <div className="text-sm text-ink-500">{loc || t("Konum belirtilmedi", "No location")}{m.headline ? ` · ${m.headline}` : ""}</div>
          <div className="mt-1 flex items-center gap-2">
            {(m.ratingCount ?? 0) > 0 && (
              <span className="flex items-center gap-1 text-[13px] text-ink-600"><Stars value={m.ratingAvg ?? 0} /> {m.ratingAvg} ({m.ratingCount})</span>
            )}
            {m.score > 0 && <span className="rounded-full bg-moss-500/15 px-2 py-0.5 text-[11px] font-semibold text-forest-700">{t("Seninle uyumlu", "A match for you")}</span>}
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <ConnectAction m={m} busy={busy} onConnect={connect} onAccept={accept} />
        {m.connection?.status === "accepted" && (
          <Button variant="outline" onClick={() => navigate(`/app/mesajlar/${m.connection!.connectionId}`)}>{t("💬 Mesaj gönder", "💬 Send a message")}</Button>
        )}
        <Button variant="outline" disabled={busy} onClick={toggleSaved}>{m.saved ? t("🔖 Kaydedildi", "🔖 Saved") : t("🔖 Kaydet", "🔖 Save")}</Button>
      </div>

      {isAdmin && <AdminMessage memberId={m.id} name={m.firstName ?? "bu üye"} />}

      {m.connection?.status === "accepted" && m.contact && (
        <div className="mb-4 rounded-[var(--radius-lg)] border border-[#c6e0c2] bg-offer-bg p-5">
          <h2 className="mb-2.5 text-[15px] font-semibold text-forest-700">{t("✓ Bağlantı kuruldu — iletişim bilgileri", "✓ Connected — contact details")}</h2>
          <div className="space-y-1 text-sm text-ink-700">
            {m.contact.contactEmail && <div>✉️ {m.contact.contactEmail}</div>}
            {m.contact.phone && <div>📞 {m.contact.phone}</div>}
            {m.contact.addressExact && <div>📍 {m.contact.addressExact}</div>}
            {m.contact.employer && <div>🏢 {m.contact.employer}</div>}
            {!m.contact.contactEmail && !m.contact.phone && <div className="text-ink-500">{t("Bu üye henüz iletişim bilgisi eklememiş.", "This member hasn't added contact details yet.")}</div>}
          </div>
        </div>
      )}

      {m.bio && (
        <Block title={t("Hakkında", "About")}><p className="text-sm text-ink-700">{m.bio}</p></Block>
      )}

      {m.photos && m.photos.length > 0 && (
        <Block title={t("Fotoğraflar", "Photos")}>
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
        const tags = m.tags.filter((tg) => tg.axis === axis);
        if (tags.length === 0) return null;
        return (
          <Block key={axis} title={AXIS_LABEL[axis]}>
            <div className="flex flex-wrap gap-2">
              {tags.map((tg) => (
                <span key={tg.value} className={matchedKeys.has(`${tg.axis}:${tg.value}`) ? "rounded-full ring-2 ring-moss-500/40" : ""}>
                  <Tag axis={tg.axis}>{lang === "en" ? tg.labelEn : tg.labelTr}</Tag>
                </span>
              ))}
            </div>
          </Block>
        );
      })}

      <ReviewsSection memberId={m.id} name={m.firstName ?? t("Bu üye", "This member")} />

      <div className="mt-2 rounded-lg border border-[#c4dde5] bg-[#e0edf1] px-4 py-3 text-sm text-[#2c5462]">
        {t("👁️ İletişim bilgileri (e-posta, telefon, tam adres) yalnızca karşılıklı bağlantı kabul edildikten sonra görünür.", "👁️ Contact details (email, phone, full address) are visible only after a mutual connection is accepted.")}
      </div>
    </div>
  );
}

const myReviewState = (t: (tr: string, en: string) => string): Record<string, string> => ({
  approved: t("Yayında", "Published"),
  auto: t("Gönderildi", "Submitted"),
  held: t("Admin onayında", "Awaiting admin review"),
  rejected: t("Yayınlanmadı", "Not published"),
});

function ReviewsSection({ memberId, name }: { memberId: string; name: string }) {
  const { t } = useI18n();
  const MY_REVIEW_STATE = myReviewState(t);
  const [data, setData] = useState<ReviewsData | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [rateErr, setRateErr] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [subErr, setSubErr] = useState<string | null>(null);

  function load() {
    reviewsApi.list<ReviewsData>(memberId).then((d) => {
      setData(d);
      if (d.myReview) { setRating(d.myReview.rating); setComment(d.myReview.comment ?? ""); }
    }).catch(() => {});
  }
  useEffect(load, [memberId]);

  async function submit() {
    // Keep the button clickable; if no star is picked, say so clearly instead of
    // silently doing nothing (users thought "Gönder" was broken).
    if (!rating) { setRateErr(true); return; }
    setSaving(true);
    setSubErr(null); setSent(null);
    try {
      const r = await reviewsApi.submit(memberId, rating, comment.trim() || undefined);
      setOpen(false);
      setSent(
        r && typeof r === "object" && (r as { status?: string }).status === "held"
          ? t("Değerlendirmen alındı. Yayınlanmadan önce ekip tarafından incelenecek.", "Your review was received. It will be reviewed by the team before being published.")
          : t("Değerlendirmen alındı. Karşı taraf da değerlendirince (ya da 15 gün sonra) yayınlanacak.", "Your review was received. It'll be published once they review you too (or after 15 days)."),
      );
      load();
    } catch (e) {
      const m = e instanceof Error ? e.message : String(e);
      // Already reviewed (one-time guard): informational, refresh to show it.
      if (/zaten|already/i.test(m)) { setOpen(false); setSent(m); load(); }
      // Any other failure: surface the REAL backend message (don't hide it as success).
      else setSubErr(`${t("Gönderilemedi", "Couldn't send")}: ${m}`);
    } finally { setSaving(false); }
  }

  if (!data) return null;

  return (
    <Block title={`${t("Değerlendirmeler", "Reviews")}${data.summary.count ? ` (${data.summary.count})` : ""}`}>
      {data.summary.count > 0 && (
        <div className="mb-3 flex items-center gap-2 text-sm text-ink-600">
          <Stars value={data.summary.avg} className="text-base" />
          <span className="font-semibold">{data.summary.avg}</span>
          <span className="text-ink-500">/ 5 · {data.summary.count} {t("değerlendirme", "reviews")}</span>
        </div>
      )}

      {/* Already reviewed → read-only (one-time, can't be edited). */}
      {data.myReview ? (
        <div className="mb-4 rounded-[var(--radius-lg)] border border-border bg-bg p-4">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{t("Senin değerlendirmen", "Your review")}</span>
            <Stars value={data.myReview.rating} />
            {data.myReview.state && (
              <span className="rounded-full bg-sand-100 px-2 py-0.5 text-[11px] font-medium text-ink-600">
                {MY_REVIEW_STATE[data.myReview.state] ?? ""}
              </span>
            )}
          </div>
          {data.myReview.comment && <p className="text-sm text-ink-700">{data.myReview.comment}</p>}
          <p className="mt-2 text-xs text-ink-400">{t("Değerlendirmeler tek seferliktir ve değiştirilemez.", "Reviews are one-time and can't be edited.")}</p>
        </div>
      ) : data.canReview ? (
        <div className="mb-4">
          {!open ? (
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>{t("★ Değerlendir", "★ Write a review")}</Button>
          ) : (
            <div className="rounded-[var(--radius-lg)] border border-border bg-bg p-4">
              <div className={`mb-3 rounded-lg p-3 transition ${rateErr ? "bg-clay-500/5 ring-2 ring-clay-500" : "bg-surface"}`}>
                <label className="mb-2 block text-sm font-semibold text-ink-700">
                  {t("1. Puanını ver", "1. Give a rating")} <span className="text-clay-600">*</span>
                </label>
                <StarInput value={rating} onChange={(v) => { setRating(v); setRateErr(false); }} />
                {rateErr && <p className="mt-2 text-sm font-medium text-clay-600">{t("👆 Göndermeden önce yıldızlara dokunarak puan ver.", "👆 Tap the stars to give a rating before sending.")}</p>}
              </div>
              <label className="mb-1.5 block text-sm font-semibold text-ink-700">
                {t("2. Yorumun", "2. Your comment")} <span className="font-normal text-ink-400">{t("(isteğe bağlı)", "(optional)")}</span>
              </label>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3}
                placeholder={t(`${name} ile deneyimini birkaç cümleyle anlat…`, `Describe your experience with ${name} in a few sentences…`)}
                className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus:border-forest-600" />
              <p className="mt-3 text-xs text-ink-500">
                {t(
                  "Değerlendirme tek seferliktir, sonradan değiştirilemez. Karşılıklıdır: karşı taraf da seni değerlendirdiğinde (ya da 15 gün sonra) yayınlanır. 4 yıldız ve altı ya da uygunsuz yorumlar, yayınlanmadan önce ekip tarafından incelenir.",
                  "A review is one-time and can't be changed later. It's mutual: it's published once the other person reviews you too (or after 15 days). Ratings of 4 stars or below, and inappropriate comments, are reviewed by the team before being published.",
                )}
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" disabled={saving} onClick={submit}>{saving ? t("Kaydediliyor…", "Saving…") : t("Gönder", "Send")}</Button>
                <Button size="sm" variant="ghost" onClick={() => { setOpen(false); setRateErr(false); setSubErr(null); }}>{t("Vazgeç", "Cancel")}</Button>
              </div>
              {subErr && <p className="mt-2 rounded-lg border border-[#eec4c0] bg-[#f7e2e0] px-3 py-2 text-sm text-[#8a2f29]">{subErr}</p>}
            </div>
          )}
          {sent && <p className="mt-2 text-sm text-forest-700">✓ {sent}</p>}
        </div>
      ) : null}

      {data.reviews.length === 0 ? (
        <p className="text-sm text-ink-500">{t("Henüz değerlendirme yok.", "No reviews yet.")}</p>
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
  const { t } = useI18n();
  const conn = m.connection;
  if (!conn) return <Button disabled={busy} onClick={onConnect}>{t("🤝 Bağlantı kur", "🤝 Connect")}</Button>;
  if (conn.status === "accepted") return <Button variant="outline" disabled>{t("✓ Bağlısınız", "✓ Connected")}</Button>;
  if (conn.status === "rejected") return <Button variant="outline" disabled>{t("İstek reddedildi", "Request declined")}</Button>;
  // pending
  if (conn.direction === "incoming") return <Button disabled={busy} onClick={onAccept}>{t("🤝 İsteği kabul et", "🤝 Accept request")}</Button>;
  return <Button variant="outline" disabled>{t("⏳ İstek gönderildi", "⏳ Request sent")}</Button>;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h2 className="mb-2.5 text-[15px] font-semibold">{title}</h2>
      {children}
    </div>
  );
}
