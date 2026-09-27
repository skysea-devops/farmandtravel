import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Avatar } from "@/components/ui/Avatar";
import { saved as savedApi } from "@/lib/api";
import type { SavedCard } from "@/lib/types";

export function KaydedilenlerPage() {
  const [members, setMembers] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  function load() {
    savedApi.list<{ members: SavedCard[] }>().then((r) => setMembers(r.members)).catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function remove(id: string) {
    setBusy(id);
    try { await savedApi.remove(id); load(); } finally { setBusy(null); }
  }

  if (loading) return <div className="py-16 text-center text-ink-500">Yükleniyor…</div>;

  return (
    <>
      <h1 className="font-display mb-5 text-2xl font-semibold">Kaydedilenler</h1>
      {members.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border-strong bg-surface p-10 text-center text-sm text-ink-500">
          Henüz kimseyi kaydetmedin. Keşfet'te beğendiğin profillerde 🔖 ile kaydet.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((m) => {
            const loc = [m.city, m.country].filter(Boolean).join(", ");
            return (
              <div key={m.id} className="flex flex-col rounded-[var(--radius-lg)] border border-border bg-surface p-5">
                <div className="mb-3 flex items-center gap-3">
                  <Avatar url={m.avatarUrl} className="size-11" />
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{m.firstName}</div>
                    <div className="truncate text-[13px] text-ink-500">{loc}{m.headline ? ` · ${m.headline}` : ""}</div>
                  </div>
                </div>
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {m.tags.slice(0, 3).map((t) => <Tag key={`${t.axis}:${t.value}`} axis={t.axis}>{t.labelTr}</Tag>)}
                </div>
                <div className="mt-auto flex gap-2">
                  <Link to={`/app/uye/${m.id}`} className="flex-1"><Button size="sm" className="w-full">Profili gör</Button></Link>
                  <Button size="sm" variant="outline" disabled={busy === m.id} onClick={() => remove(m.id)}>Kaldır</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
