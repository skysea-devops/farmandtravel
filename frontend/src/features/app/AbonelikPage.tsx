import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { api, billing } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { Profile } from "@/lib/types";

export function AbonelikPage() {
  const { t, market } = useI18n();
  const [p, setP] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    api.get<Profile>("/profile/me").then(setP).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const price = t("$30 / yıl", "$30 / year");

  async function subscribe() {
    setBusy(true); setNote(null);
    try {
      const { url } = await billing.checkout(market);
      window.location.href = url;
    } catch {
      setNote(t("Ödeme altyapısı çok yakında eklenecek.", "Payments are coming very soon."));
      setBusy(false);
    }
  }

  if (loading) return <div className="py-16 text-center text-ink-500">{t("Yükleniyor…", "Loading…")}</div>;

  const plan = p?.plan ?? "none";

  return (
    <div className="max-w-2xl">
      <h1 className="font-display mb-5 text-2xl font-semibold">{t("Abonelik", "Membership")}</h1>

      {plan === "frontier" && (
        <div className="rounded-[var(--radius-lg)] border border-[#c6e0c2] bg-offer-bg p-6">
          <div className="mb-1 text-3xl">🌱</div>
          <h2 className="font-display text-xl font-semibold text-forest-700">{t("Frontier üyelik · Ücretsiz", "Frontier membership · Free")}</h2>
          <p className="mt-2 text-sm text-ink-700">
            {t(
              "Topluluğun ilk üyelerindensin (Frontier). Tüm özellikler (keşfet, bağlantı, mesaj, değerlendirme) açık.",
              "You're one of the community's first members (Frontier). Everything (explore, connect, message, review) is open.",
            )}
          </p>
        </div>
      )}

      {plan === "active" && (
        <div className="rounded-[var(--radius-lg)] border border-[#c6e0c2] bg-offer-bg p-6">
          <h2 className="font-display text-xl font-semibold text-forest-700">{t("Aktif abonelik ✓", "Active membership ✓")}</h2>
          <p className="mt-2 text-sm text-ink-700">{t("Üyeliğin aktif. Tüm özellikler açık.", "Your membership is active. Everything is open.")}</p>
        </div>
      )}

      {plan === "none" && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
          <h2 className="font-display text-xl font-semibold">{t("Üyeliğini başlat", "Start your membership")}</h2>
          <p className="mt-2 text-sm text-ink-700">
            {t(
              "Topluluğa tam erişim için üyelik gerekir: profilleri gör, bağlantı kur, mesajlaş.",
              "Full access requires a membership: view profiles, connect and message.",
            )}
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="font-display text-2xl font-semibold text-forest-700">{price}</span>
            <Button onClick={subscribe} disabled={busy}>{busy ? t("Yönlendiriliyor…", "Redirecting…") : t("Abone ol", "Subscribe")}</Button>
          </div>
          {note && <p className="mt-3 text-xs text-ink-500">{note}</p>}
        </div>
      )}
    </div>
  );
}
