import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { api } from "@/lib/api";
import type { Axis, Profile } from "@/lib/types";

const AXIS_LABEL: Record<Axis, string> = { situation: "Durumum", seek: "Aradıklarım", offer: "Sunduklarım", topic: "İlgi alanlarım" };
const AXES: Axis[] = ["situation", "seek", "offer", "topic"];

export function ProfilePage() {
  const [p, setP] = useState<Profile | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Profile>("/profile/me")
      .then(setP)
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container-x py-16 text-center text-ink-500">Yükleniyor…</div>;
  if (err) return (
    <div className="container-x py-16 text-center">
      <p className="mb-4 text-ink-700">Profil yüklenemedi: {err}</p>
      <p className="text-sm text-ink-500">Lokal backend çalışıyor mu? (backend: npm run dev)</p>
    </div>
  );
  if (!p) return null;

  const incomplete = p.status === "onboarding";

  return (
    <div className="container-x max-w-3xl py-10">
      {incomplete && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-[#ecd9a8] bg-[#f7edd6] px-4 py-3 text-sm text-[#8a6015]">
          <span>Profilin henüz tamamlanmadı.</span>
          <Link to="/onboarding"><Button size="sm">Tamamla</Button></Link>
        </div>
      )}
      <div className="mb-6 flex items-center gap-4">
        <div className="size-20 shrink-0 rounded-full bg-linear-135 from-moss-300 to-clay-500" />
        <div>
          <h1 className="font-display text-2xl font-semibold">{p.firstName ?? "İsimsiz"}</h1>
          <div className="text-sm text-ink-500">{[p.city, p.country].filter(Boolean).join(", ") || "Konum eklenmedi"}{p.headline ? ` · ${p.headline}` : ""}</div>
        </div>
      </div>

      {p.bio && <Block title="Hakkımda"><p className="text-sm text-ink-700">{p.bio}</p></Block>}

      {AXES.map((axis) => {
        const tags = p.tags.filter((t) => t.axis === axis);
        if (tags.length === 0) return null;
        return (
          <Block key={axis} title={AXIS_LABEL[axis]}>
            <div className="flex flex-wrap gap-2">{tags.map((t) => <Tag key={t.value} axis={t.axis}>{t.labelTr}</Tag>)}</div>
          </Block>
        );
      })}

      <div className="mt-2 rounded-lg border border-[#c4dde5] bg-[#e0edf1] px-4 py-3 text-sm text-[#2c5462]">
        👁️ Bağlantı öncesi başkaları yalnızca adını, şehrini/ülkeni ve etiketlerini görür. İletişim bilgilerin gizli kalır.
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h2 className="mb-2.5 text-[15px] font-semibold">{title}</h2>
      {children}
    </div>
  );
}
