import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { api, activities as actApi, admin as adminApi } from "@/lib/api";
import { ActivityForm } from "@/features/activities/ActivityForm";
import type { ActivityItem, Profile } from "@/lib/types";

const KIND: Record<string, string> = {
  video: "🎥 Podcast", photo: "📷 Paylaşım", meeting: "📅 Buluşma", announcement: "📢 Duyuru",
};

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
          <h1 className="font-display mb-1 text-2xl font-semibold">Aktivite onayları</h1>
          <p className="text-sm text-ink-500">Üyelerin gönderdiği aktiviteleri onayla veya reddet. Kendi oluşturduğun aktiviteler doğrudan yayınlanır.</p>
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

      <h2 className="font-display mb-3 text-lg font-semibold">Onay bekleyenler</h2>
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
