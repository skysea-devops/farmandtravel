import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Stars } from "@/components/ui/Stars";
import { api, activities as actApi, admin as adminApi, reviews as reviewsApi } from "@/lib/api";
import { ActivityForm } from "@/features/activities/ActivityForm";
import type { ActivityItem, AdminReviewItem, Profile } from "@/lib/types";

const KIND: Record<string, string> = {
  video: "🎥 Podcast", photo: "📷 Paylaşım", meeting: "📅 Buluşma", announcement: "📢 Duyuru",
};

type FoundMember = { id: string; firstName: string | null; lastName: string | null; city: string | null; country: string | null };

const fullName = (m: FoundMember) => [m.firstName, m.lastName].filter(Boolean).join(" ") || "İsimsiz üye";
const whereFrom = (m: FoundMember) => [m.city, m.country].filter(Boolean).join(", ");

// Admin: değerlendirme moderasyon kuyruğu. 4 yıldız ve altı ya da uygunsuz yorum
// içeren değerlendirmeler yayınlanmadan önce burada beklet­ilir; admin onaylar
// (hemen yayınlanır) ya da reddeder (hiç görünmez).
function ReviewModerationCard() {
  const [items, setItems] = useState<AdminReviewItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () =>
    reviewsApi.adminList<{ reviews: AdminReviewItem[] }>()
      .then((r) => setItems(r.reviews)).catch(() => {}).finally(() => setLoaded(true));
  useEffect(() => { load(); }, []);

  async function act(id: string, kind: "approve" | "reject") {
    setBusy(id);
    try {
      if (kind === "approve") await reviewsApi.approve(id);
      else await reviewsApi.reject(id);
      setItems((xs) => xs.filter((r) => r.id !== id));
    } finally { setBusy(null); }
  }

  if (!loaded) return null;

  return (
    <div className="mb-8 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h2 className="font-display mb-1 text-lg font-semibold">⚖️ Değerlendirme onayları{items.length ? ` (${items.length})` : ""}</h2>
      <p className="mb-3 text-sm text-ink-500">4 yıldız ve altı ya da uygunsuz yorum içeren değerlendirmeler. Onaylarsan hemen yayınlanır, reddedersen görünmez. Gerekirse ilgili üyeye yukarıdan mesaj atıp savunmasını alabilirsin.</p>

      {items.length === 0 ? (
        <p className="text-sm text-ink-500">Bekleyen değerlendirme yok. 🎉</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((r) => (
            <div key={r.id} className="rounded-[var(--radius-lg)] border border-border bg-bg p-4">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold">{r.reviewerName ?? "Bir üye"}</span>
                <span className="text-ink-500">→</span>
                <span className="font-semibold">{r.revieweeName ?? "Bir üye"}</span>
                <Stars value={r.rating} />
                {r.flagged && <span className="rounded-full bg-clay-500/15 px-2 py-0.5 text-[11px] font-semibold text-clay-600">⚠ Uygunsuz olabilir</span>}
              </div>
              {r.comment ? <p className="text-sm text-ink-700">{r.comment}</p> : <p className="text-sm italic text-ink-400">(yorum yok)</p>}
              <div className="mt-3 flex gap-2">
                <Button size="sm" disabled={busy === r.id} onClick={() => act(r.id, "approve")}>Onayla & yayınla</Button>
                <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => act(r.id, "reject")}>Reddet</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Admin: isimle ara → üye seç → "Toprakla Yeniden" adıyla tek kişiye mesaj gönder.
// (Bağlantı gerekmez; herhangi bir üyeye yazılabilir.)
function DirectMessageCard() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<FoundMember[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<FoundMember | null>(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const seq = useRef(0);

  // Debounced arama: 2+ karakterde ara, yarıştaki eski sonuçları yut.
  useEffect(() => {
    if (picked) return;
    const term = q.trim();
    if (term.length < 2) { setResults([]); return; }
    const id = ++seq.current;
    setSearching(true);
    const t = setTimeout(() => {
      adminApi.searchMembers<{ members: FoundMember[] }>(term)
        .then((r) => { if (id === seq.current) setResults(r.members); })
        .catch(() => { if (id === seq.current) setResults([]); })
        .finally(() => { if (id === seq.current) setSearching(false); });
    }, 300);
    return () => clearTimeout(t);
  }, [q, picked]);

  function pick(m: FoundMember) {
    setPicked(m);
    setResults([]);
    setQ("");
    setMsg(null);
  }

  function reset() {
    setPicked(null);
    setBody("");
    setMsg(null);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!picked || body.trim().length < 1) return;
    setBusy(true); setMsg(null);
    try {
      await adminApi.message(picked.id, body.trim());
      setMsg(`${fullName(picked)} kişisine gönderildi.`);
      setBody("");
      setPicked(null);
    } catch {
      setMsg("Gönderilemedi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-8 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h2 className="font-display mb-1 text-lg font-semibold">✉️ Belirli bir üyeye mesaj gönder</h2>
      <p className="mb-3 text-sm text-ink-500">İsimle ara, üyeyi seç ve "Toprakla Yeniden" adıyla mesaj gönder. Bağlantın olmasa da yazabilirsin.</p>

      {!picked ? (
        <div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="İsim veya e-posta ara…"
            className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600"
          />
          {searching && <div className="mt-2 text-xs text-ink-500">Aranıyor…</div>}
          {!searching && q.trim().length >= 2 && results.length === 0 && (
            <div className="mt-2 text-xs text-ink-500">Sonuç yok.</div>
          )}
          {results.length > 0 && (
            <div className="mt-2 flex flex-col divide-y divide-border rounded-lg border border-border">
              {results.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => pick(m)}
                  className="flex items-center justify-between px-3 py-2.5 text-left text-sm transition hover:bg-sand-100"
                >
                  <span className="font-medium text-ink-800">{fullName(m)}</span>
                  {whereFrom(m) && <span className="text-xs text-ink-500">{whereFrom(m)}</span>}
                </button>
              ))}
            </div>
          )}
          {msg && <div className="mt-3 text-sm text-ink-600">{msg}</div>}
        </div>
      ) : (
        <form onSubmit={send}>
          <div className="mb-3 flex items-center justify-between rounded-lg bg-sand-100 px-3 py-2 text-sm">
            <span><span className="text-ink-500">Alıcı: </span><span className="font-medium text-ink-800">{fullName(picked)}</span>{whereFrom(picked) && <span className="text-ink-500"> · {whereFrom(picked)}</span>}</span>
            <button type="button" onClick={reset} className="text-xs text-clay-600 hover:underline">Değiştir</button>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={4000}
            className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600"
            placeholder="Mesajın…"
          />
          <div className="mt-3 flex items-center gap-3">
            <Button type="submit" disabled={busy || body.trim().length < 1}>{busy ? "Gönderiliyor…" : "Gönder"}</Button>
            {msg && <span className="text-sm text-ink-600">{msg}</span>}
          </div>
        </form>
      )}
    </div>
  );
}

export function AktiviteOnayPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [bcBody, setBcBody] = useState("");
  const [bcBusy, setBcBusy] = useState(false);
  const [bcMsg, setBcMsg] = useState<string | null>(null);

  async function sendBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (bcBody.trim().length < 2) return;
    setBcBusy(true); setBcMsg(null);
    try {
      const r = await adminApi.broadcast(bcBody.trim());
      setBcBody("");
      setBcMsg(`${r.recipients} kişiye gönderildi.`);
    } catch {
      setBcMsg("Gönderilemedi.");
    } finally {
      setBcBusy(false);
    }
  }

  const load = () =>
    actApi.adminList<{ items: ActivityItem[] }>("pending").then((r) => setItems(r.items)).catch(() => {}).finally(() => setLoading(false));

  useEffect(() => {
    api.get<Profile>("/profile/me")
      .then((p) => {
        setIsAdmin(!!p.isAdmin);
        if (p.isAdmin) load();
        else setLoading(false);
      })
      .catch(() => { setIsAdmin(false); setLoading(false); });
  }, []);

  async function act(id: string, kind: "approve" | "reject") {
    setBusy(id);
    try {
      if (kind === "approve") await actApi.approve(id);
      else await actApi.reject(id);
      setItems((xs) => xs.filter((a) => a.id !== id));
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <div className="py-16 text-center text-ink-500">Yükleniyor…</div>;
  if (!isAdmin) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong p-10 text-center text-sm text-ink-500">
        Bu sayfa yalnızca yöneticiler içindir.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display mb-1 text-2xl font-semibold">Admin Panel</h1>
          <p className="text-sm text-ink-500">Aktiviteleri yönet, topluluğa duyuru gönder. Kendi oluşturduğun aktiviteler doğrudan yayınlanır.</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen((o) => !o)}>{createOpen ? "Kapat" : "＋ Aktivite oluştur"}</Button>
      </div>

      {createOpen && <ActivityForm onDone={() => { setCreateOpen(false); load(); }} />}

      {/* Herkese duyuru — resmi "Toprakla Yeniden" hesabından mesaj */}
      <form onSubmit={sendBroadcast} className="mb-8 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
        <h2 className="font-display mb-1 text-lg font-semibold">📣 Herkese mesaj gönder</h2>
        <p className="mb-3 text-sm text-ink-500">Tüm üyelere "Toprakla Yeniden" adıyla mesaj gider; Mesajlar bölümünde görünür.</p>
        <textarea value={bcBody} onChange={(e) => setBcBody(e.target.value)} rows={3} maxLength={4000}
          className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600"
          placeholder="Topluluğa iletmek istediğin mesaj…" />
        <div className="mt-3 flex items-center gap-3">
          <Button type="submit" disabled={bcBusy}>{bcBusy ? "Gönderiliyor…" : "Herkese gönder"}</Button>
          {bcMsg && <span className="text-sm text-ink-600">{bcMsg}</span>}
        </div>
      </form>

      <DirectMessageCard />

      <ReviewModerationCard />

      <h2 className="font-display mb-3 text-lg font-semibold">Aktivite onayları</h2>
      {items.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong p-10 text-center text-sm text-ink-500">
          Onay bekleyen aktivite yok. 🎉
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((a) => (
            <div key={a.id} className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
              {a.image && <div className="h-48 bg-cover bg-center bg-moss-300" style={{ backgroundImage: `url(${a.image})` }} />}
              <div className="p-5">
                <div className="mb-1 text-xs font-semibold tracking-wide text-clay-600">{KIND[a.kind] ?? a.kind}</div>
                <h3 className="font-display text-[17px] font-semibold">{a.title}</h3>
                {a.desc && <p className="mt-1.5 text-sm text-ink-700">{a.desc}</p>}
                {a.kind === "meeting" && a.when && (
                  <div className="mt-2 text-xs text-ink-600">{a.online ? "🟢 Online" : "📍 Yüz yüze"} · {a.when}</div>
                )}
                <div className="mt-2 text-xs text-ink-500">{[a.author, a.place].filter(Boolean).join(" · ")}</div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" disabled={busy === a.id} onClick={() => act(a.id, "approve")}>Onayla & yayınla</Button>
                  <Button size="sm" variant="outline" disabled={busy === a.id} onClick={() => act(a.id, "reject")}>Reddet</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
