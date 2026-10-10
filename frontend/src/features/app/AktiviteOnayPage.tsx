import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Stars } from "@/components/ui/Stars";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import { api, activities as actApi, admin as adminApi, reviews as reviewsApi } from "@/lib/api";
import { msgTime, listTime } from "@/lib/time";
import { ActivityForm } from "@/features/activities/ActivityForm";
import { monthYear } from "@/lib/time";
import type { ActivityItem, AdminInboxItem, AdminInboxThread, AdminReviewItem, Profile, RosterData, RosterMember } from "@/lib/types";

const KIND: Record<string, string> = {
  video: "🎥 Podcast", photo: "📷 Paylaşım", meeting: "📅 Buluşma", announcement: "📢 Duyuru",
};

type FoundMember = { id: string; firstName: string | null; lastName: string | null; city: string | null; country: string | null };

const fullName = (m: FoundMember) => [m.firstName, m.lastName].filter(Boolean).join(" ") || "İsimsiz üye";
const whereFrom = (m: FoundMember) => [m.city, m.country].filter(Boolean).join(", ");

type TabId = "members" | "reviews" | "activities" | "messages" | "inbox";
const TABS: { id: TabId; label: string }[] = [
  { id: "members", label: "👥 Üyeler" },
  { id: "reviews", label: "⚖️ Değerlendirmeler" },
  { id: "activities", label: "📅 Aktiviteler" },
  { id: "messages", label: "📣 Duyuru & Mesaj" },
  { id: "inbox", label: "📨 Gelen kutusu" },
];

export function AktiviteOnayPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("members");

  useEffect(() => {
    api.get<Profile>("/profile/me")
      .then((p) => setIsAdmin(!!p.isAdmin))
      .catch(() => setIsAdmin(false))
      .finally(() => setLoading(false));
  }, []);

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
      <div className="mb-5">
        <h1 className="font-display mb-1 text-2xl font-semibold">Admin Panel</h1>
        <p className="text-sm text-ink-500">Topluluğu yönet: değerlendirme onayları, aktiviteler, duyuru ve mesajlar.</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition",
              tab === t.id ? "border-forest-600 text-forest-700" : "border-transparent text-ink-500 hover:text-ink-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "members" && <MembersSection />}
      {tab === "reviews" && <ReviewModerationCard />}
      {tab === "activities" && <ActivitiesSection />}
      {tab === "messages" && (
        <>
          <BroadcastCard />
          <DirectMessageCard />
        </>
      )}
      {tab === "inbox" && <InboxSection />}
    </div>
  );
}

// ── Üyeler ───────────────────────────────────────────────────────────────────
// Tüm üyeler, uygulama tarafı durumuyla (onboarding/profil tamam/aktif/askıda) +
// katılım tarihi. Cognito konsolu yalnızca Cognito'nun kendi durumunu (Confirmed/
// Enabled) gösterir; burası kimin onboarding'de takılı olduğunu görmek içindir.
const STATUS_META: Record<string, { label: string; cls: string }> = {
  onboarding:       { label: "Onboarding'de (profil yarım)", cls: "bg-clay-500/15 text-clay-600" },
  profile_complete: { label: "Profil tamam",                 cls: "bg-moss-500/20 text-forest-700" },
  active:           { label: "Aktif",                        cls: "bg-forest-600/15 text-forest-700" },
  suspended:        { label: "Askıda",                       cls: "bg-[#f7e2e0] text-[#8a2f29]" },
  deleted:          { label: "Silindi",                      cls: "bg-ink-500/10 text-ink-500" },
};

type RosterFilter = "" | "onboarding" | "profile_complete" | "active" | "suspended";
const FILTERS: { id: RosterFilter; label: string }[] = [
  { id: "", label: "Tümü" },
  { id: "onboarding", label: "Onboarding'de" },
  { id: "profile_complete", label: "Profil tamam" },
  { id: "active", label: "Aktif" },
  { id: "suspended", label: "Askıda" },
];

function MembersSection() {
  const [data, setData] = useState<RosterData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<RosterFilter>("");
  const [q, setQ] = useState("");
  const seq = useRef(0);

  useEffect(() => {
    const id = ++seq.current;
    setLoaded(false);
    const term = q.trim();
    const t = setTimeout(() => {
      adminApi.roster<RosterData>(status, term.length >= 2 ? term : "")
        .then((r) => { if (id === seq.current) setData(r); })
        .catch(() => { if (id === seq.current) setData(null); })
        .finally(() => { if (id === seq.current) setLoaded(true); });
    }, 250);
    return () => clearTimeout(t);
  }, [status, q]);

  const sum = data?.summary;

  return (
    <div>
      <div className="mb-3">
        <h2 className="font-display text-lg font-semibold">Üyeler</h2>
        <p className="text-sm text-ink-500">
          Kaydolan herkes — uygulama durumuyla birlikte. <b>Onboarding'de</b> olanlar e-postasını doğrulamış ama
          profilini bitirmemiştir; bu yüzden Keşfet'te görünmezler. (Cognito'daki sub, kullanıcı adıyla eşleşir.)
        </p>
      </div>

      {sum && (
        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          <Stat label="Toplam" n={sum.total} />
          <Stat label="Onboarding'de" n={sum.onboarding} tone="clay" />
          <Stat label="Profil tamam" n={sum.profileComplete} />
          <Stat label="Aktif" n={sum.active} tone="forest" />
          {sum.suspended > 0 && <Stat label="Askıda" n={sum.suspended} tone="red" />}
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatus(f.id)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition",
                status === f.id ? "bg-forest-600 text-white" : "bg-sand-100 text-ink-600 hover:bg-sand-200",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="İsim, e-posta veya sub ara…"
          className="ml-auto w-full max-w-xs rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm outline-none focus:border-forest-600"
        />
      </div>

      {!loaded ? (
        <div className="py-8 text-center text-ink-500">Yükleniyor…</div>
      ) : !data || data.members.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong p-10 text-center text-sm text-ink-500">
          Üye bulunamadı.
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          {data.members.map((m) => <RosterRow key={m.id} m={m} />)}
        </div>
      )}
    </div>
  );
}

function Stat({ label, n, tone }: { label: string; n: number; tone?: "clay" | "forest" | "red" }) {
  const cls = tone === "clay" ? "text-clay-600" : tone === "forest" ? "text-forest-700" : tone === "red" ? "text-[#8a2f29]" : "text-ink-900";
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2">
      <span className={cn("text-base font-semibold", cls)}>{n}</span>
      <span className="ml-1.5 text-xs text-ink-500">{label}</span>
    </div>
  );
}

function RosterRow({ m }: { m: RosterMember }) {
  const meta = STATUS_META[m.status] ?? STATUS_META.onboarding;
  const name = [m.firstName, m.lastName].filter(Boolean).join(" ") || "İsimsiz (profil yok)";
  const where = [m.city, m.country].filter(Boolean).join(", ");
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={cn("truncate font-semibold", !m.firstName && "italic text-ink-400")}>{name}</span>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", meta.cls)}>{meta.label}</span>
          {m.plan === "frontier" && <span className="shrink-0 text-[11px] text-moss-500">🌱 öncü</span>}
        </div>
        <div className="mt-0.5 truncate text-xs text-ink-500">
          {[m.email, where, `${m.connections} bağlantı`].filter(Boolean).join(" · ")}
        </div>
        <div className="mt-0.5 truncate font-mono text-[10px] text-ink-400">{m.sub}</div>
      </div>
      <div className="shrink-0 text-right text-xs text-ink-500">
        {monthYear(m.createdAt, "tr")}
      </div>
    </div>
  );
}

// ── Gelen kutusu ─────────────────────────────────────────────────────────────
// "Toprakla Yeniden" hesabının mesaj kutusu: admin'in gönderdiği mesajlar + gelen
// cevaplar burada (admin'in kendi hesabından ayrı). Buradan cevap da yazılır.
function InboxSection() {
  const [items, setItems] = useState<AdminInboxItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = () =>
    adminApi.inbox<{ conversations: AdminInboxItem[] }>()
      .then((r) => setItems(r.conversations)).catch(() => {}).finally(() => setLoaded(true));
  useEffect(() => { load(); }, []);

  if (openId) {
    const it = items.find((x) => x.connectionId === openId);
    return <InboxThread connectionId={openId} title={it ? inboxName(it.member) : "Sohbet"} onBack={() => { setOpenId(null); load(); }} />;
  }

  if (!loaded) return <div className="py-8 text-center text-ink-500">Yükleniyor…</div>;

  return (
    <div>
      <div className="mb-3">
        <h2 className="font-display text-lg font-semibold">Gelen kutusu — Toprakla Yeniden</h2>
        <p className="text-sm text-ink-500">Resmi hesaptan gönderilen mesajlar ve üyelerden gelen cevaplar. Kendi hesabının mesajlarından ayrıdır.</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong p-10 text-center text-sm text-ink-500">
          Henüz mesaj yok. "Duyuru &amp; Mesaj" sekmesinden bir üyeye yazınca burada görünür.
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
          {items.map((it) => (
            <button
              key={it.connectionId}
              type="button"
              onClick={() => setOpenId(it.connectionId)}
              className="flex items-center gap-3 px-4 py-3 text-left transition hover:bg-sand-100"
            >
              <Avatar url={it.member.avatarUrl} className="size-10 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold">{inboxName(it.member)}</span>
                  {it.lastAt && <span className="ml-auto shrink-0 text-[11px] text-ink-400">{listTime(it.lastAt)}</span>}
                  {it.unread > 0 && <span className="shrink-0 rounded-full bg-clay-500 px-1.5 text-[11px] font-semibold text-white">{it.unread}</span>}
                </div>
                <div className="truncate text-sm text-ink-500">
                  {it.lastBody ?? "—"}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function inboxName(m: { firstName: string | null; lastName: string | null }) {
  return [m.firstName, m.lastName].filter(Boolean).join(" ") || "İsimsiz üye";
}

function InboxThread({ connectionId, title, onBack }: { connectionId: string; title: string; onBack: () => void }) {
  const [data, setData] = useState<AdminInboxThread | null>(null);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => adminApi.inboxThread<AdminInboxThread>(connectionId).then(setData).catch(() => {});
  useEffect(() => { load(); }, [connectionId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 1) return;
    setBusy(true);
    try { await adminApi.inboxReply(connectionId, body.trim()); setBody(""); load(); }
    finally { setBusy(false); }
  }

  const offId = data?.officialId;

  return (
    <div>
      <button type="button" onClick={onBack} className="mb-3 text-sm text-forest-600 hover:underline">← Gelen kutusu</button>
      <div className="mb-3 flex items-center gap-2">
        <Avatar url={data?.member?.avatarUrl} className="size-9" />
        <div className="text-sm font-semibold">{title}</div>
      </div>

      <div className="mb-3 flex max-h-[55vh] flex-col gap-2 overflow-y-auto rounded-[var(--radius-lg)] border border-border bg-bg p-4">
        {!data ? (
          <div className="py-6 text-center text-ink-500">Yükleniyor…</div>
        ) : data.messages.length === 0 ? (
          <div className="py-6 text-center text-ink-500">Mesaj yok.</div>
        ) : (
          data.messages.map((m) => {
            const mine = m.senderId === offId; // official (admin) tarafı
            return (
              <div key={m.id} className={cn("max-w-[80%] rounded-2xl px-3.5 py-2 text-sm", mine ? "self-end bg-forest-600 text-white" : "self-start bg-surface border border-border text-ink-800")}>
                <div className="whitespace-pre-wrap break-words">{m.body}</div>
                <div className={cn("mt-1 text-right text-[10px]", mine ? "text-white/70" : "text-ink-400")}>{msgTime(m.createdAt)}</div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={send} className="flex items-end gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          maxLength={4000}
          placeholder="Toprakla Yeniden adıyla cevap yaz…"
          className="flex-1 rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600"
        />
        <Button type="submit" disabled={busy || body.trim().length < 1}>{busy ? "…" : "Gönder"}</Button>
      </form>
    </div>
  );
}

// ── Değerlendirmeler ─────────────────────────────────────────────────────────
// 4 yıldız ve altı ya da uygunsuz yorum içeren değerlendirmeler yayınlanmadan
// önce burada bekletilir; admin onaylar (hemen yayınlanır) ya da reddeder.
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

  if (!loaded) return <div className="py-8 text-center text-ink-500">Yükleniyor…</div>;

  return (
    <div>
      <div className="mb-3">
        <h2 className="font-display text-lg font-semibold">Değerlendirme onayları{items.length ? ` (${items.length})` : ""}</h2>
        <p className="text-sm text-ink-500">4 yıldız ve altı ya da uygunsuz yorum içeren değerlendirmeler. Onaylarsan hemen yayınlanır, reddedersen görünmez. Gerekirse ilgili üyeye "Duyuru &amp; Mesaj" sekmesinden yazıp savunmasını alabilirsin.</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong p-10 text-center text-sm text-ink-500">
          Bekleyen değerlendirme yok. 🎉
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((r) => (
            <div key={r.id} className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold">{r.reviewerName ?? "Bir üye"}</span>
                <span className="text-ink-500">→</span>
                <span className="font-semibold">{r.revieweeName ?? "Bir üye"}</span>
                <Stars value={r.rating} />
                {r.flagged && <span className="rounded-full bg-clay-500/15 px-2 py-0.5 text-[11px] font-semibold text-clay-600">⚠ Uygunsuz olabilir</span>}
              </div>
              {r.comment ? <p className="text-sm text-ink-700">{r.comment}</p> : <p className="text-sm italic text-ink-400">(yorum yok)</p>}
              <div className="mt-3 flex gap-2">
                <Button size="sm" disabled={busy === r.id} onClick={() => act(r.id, "approve")}>Onayla &amp; yayınla</Button>
                <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => act(r.id, "reject")}>Reddet</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Aktiviteler ──────────────────────────────────────────────────────────────
// Admin kendi aktivitesini doğrudan yayınlar; üye gönderileri onay bekler.
function ActivitiesSection() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const load = () =>
    actApi.adminList<{ items: ActivityItem[] }>("pending").then((r) => setItems(r.items)).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  async function act(id: string, kind: "approve" | "reject") {
    setBusy(id);
    try {
      if (kind === "approve") await actApi.approve(id);
      else await actApi.reject(id);
      setItems((xs) => xs.filter((a) => a.id !== id));
    } finally { setBusy(null); }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold">Aktiviteler</h2>
          <p className="text-sm text-ink-500">Kendi oluşturduğun aktiviteler doğrudan yayınlanır; üye gönderileri aşağıda onay bekler.</p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen((o) => !o)}>{createOpen ? "Kapat" : "＋ Aktivite oluştur"}</Button>
      </div>

      {createOpen && <ActivityForm onDone={() => { setCreateOpen(false); load(); }} />}

      <h3 className="font-display mb-3 mt-5 text-[15px] font-semibold">Onay bekleyenler{items.length ? ` (${items.length})` : ""}</h3>
      {loading ? (
        <div className="py-8 text-center text-ink-500">Yükleniyor…</div>
      ) : items.length === 0 ? (
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
                  <Button size="sm" disabled={busy === a.id} onClick={() => act(a.id, "approve")}>Onayla &amp; yayınla</Button>
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

// ── Duyuru & Mesaj ───────────────────────────────────────────────────────────
// Tüm üyelere resmi "Toprakla Yeniden" hesabından duyuru.
function BroadcastCard() {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (body.trim().length < 2) return;
    setBusy(true); setMsg(null);
    try {
      const r = await adminApi.broadcast(body.trim());
      setBody("");
      setMsg(`${r.recipients} kişiye gönderildi.`);
    } catch {
      setMsg("Gönderilemedi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={send} className="mb-8 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h2 className="font-display mb-1 text-lg font-semibold">📣 Herkese mesaj gönder</h2>
      <p className="mb-3 text-sm text-ink-500">Tüm üyelere "Toprakla Yeniden" adıyla mesaj gider; Mesajlar bölümünde görünür.</p>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={4000}
        className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600"
        placeholder="Topluluğa iletmek istediğin mesaj…" />
      <div className="mt-3 flex items-center gap-3">
        <Button type="submit" disabled={busy}>{busy ? "Gönderiliyor…" : "Herkese gönder"}</Button>
        {msg && <span className="text-sm text-ink-600">{msg}</span>}
      </div>
    </form>
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
      setMsg(`${fullName(picked)} kişisine gönderildi. Cevaplar "Gelen kutusu" sekmesinde görünür.`);
      setBody("");
      setPicked(null);
    } catch {
      setMsg("Gönderilemedi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
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
