import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { Profile } from "@/lib/types";

export function AbonelikPage() {
  const [p, setP] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Profile>("/profile/me").then(setP).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16 text-center text-ink-500">Yükleniyor…</div>;

  const plan = p?.plan ?? "none";

  return (
    <div className="max-w-2xl">
      <h1 className="font-display mb-5 text-2xl font-semibold">Abonelik</h1>

      {plan === "frontier" && (
        <div className="rounded-[var(--radius-lg)] border border-[#c6e0c2] bg-offer-bg p-6">
          <div className="mb-1 text-3xl">🌱</div>
          <h2 className="font-display text-xl font-semibold text-forest-700">Frontier üyelik · Ücretsiz</h2>
          <p className="mt-2 text-sm text-ink-700">
            Topluluğun ilk üyelerindensin (Frontier). Erişimin <b>ömür boyu ücretsiz</b> — hiçbir ödeme yapman
            gerekmez. Tüm özellikler (keşfet, bağlantı, mesaj, değerlendirme) açık.
          </p>
        </div>
      )}

      {plan === "active" && (
        <div className="rounded-[var(--radius-lg)] border border-[#c6e0c2] bg-offer-bg p-6">
          <h2 className="font-display text-xl font-semibold text-forest-700">Aktif abonelik ✓</h2>
          <p className="mt-2 text-sm text-ink-700">Üyeliğin aktif. Tüm özellikler açık.</p>
        </div>
      )}

      {plan === "none" && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
          <h2 className="font-display text-xl font-semibold">Üyeliğini başlat</h2>
          <p className="mt-2 text-sm text-ink-700">
            Topluluğa tam erişim için üyelik gerekir: profilleri gör, bağlantı kur, mesajlaş.
          </p>
          <div className="mt-4">
            <Button disabled title="Ödeme yakında">Abone ol (yakında)</Button>
          </div>
          <p className="mt-3 text-xs text-ink-500">Ödeme altyapısı çok yakında eklenecek.</p>
        </div>
      )}

      <p className="mt-4 text-xs text-ink-500">
        3 Ekim 2026'ya kadar katılan herkes <b>Frontier</b> üye olarak ücretsizdir.
      </p>
    </div>
  );
}
