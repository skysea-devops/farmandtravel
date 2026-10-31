import { useEffect, useState } from "react";
import { Sprout, Check, Handshake, MessageCircle, CalendarDays, PlayCircle, Lock } from "lucide-react";
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
  const [period, setPeriod] = useState<"yearly" | "quarterly">("yearly");

  useEffect(() => {
    api.get<Profile>("/profile/me").then(setP).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const priceYear = t("$45 / yıl", "$45 / year");
  const priceQuarter = t("$15 / 3 ay", "$15 / 3 months");

  async function subscribe() {
    setBusy(true); setNote(null);
    try {
      const { url } = await billing.checkout(market, period);
      window.location.href = url;
    } catch {
      setNote(t("Ödeme altyapısı çok yakında eklenecek.", "Payments are coming very soon."));
      setBusy(false);
    }
  }

  if (loading) return <div className="py-16 text-center text-ink-500">{t("Yükleniyor…", "Loading…")}</div>;

  const plan = p?.plan ?? "none";

  const benefits: { Icon: typeof Check; text: string }[] = [
    { Icon: Handshake, text: t("Üyelerle bağlantı kur ve isteklere yanıt ver", "Connect with members and respond to requests") },
    { Icon: MessageCircle, text: t("Mesajlaş", "Message members") },
    { Icon: CalendarDays, text: t("Etkinliklere katıl", "Join events") },
    { Icon: PlayCircle, text: t("Seminer kayıtları ve üyelere özel içeriği izle", "Watch recorded sessions and members-only content") },
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="font-display mb-5 text-2xl font-semibold">{t("Abonelik", "Membership")}</h1>

      {plan === "frontier" && (
        <div className="rounded-[var(--radius-lg)] border border-[#c6e0c2] bg-offer-bg p-6">
          <div className="mb-2 text-forest-700"><Sprout size={28} strokeWidth={1.75} /></div>
          <h2 className="font-display text-xl font-semibold text-forest-700">{t("Öncü üyelik · Ücretsiz", "Founding membership · Free")}</h2>
          <p className="mt-2 text-sm text-ink-700">
            {t(
              "Topluluğun ilk üyelerindensin. Tüm özellikler (keşfet, bağlantı, mesaj, etkinlik, üye içeriği) açık.",
              "You're one of the community's first members. Everything (explore, connect, message, events, member content) is open.",
            )}
          </p>
        </div>
      )}

      {plan === "active" && (
        <div className="rounded-[var(--radius-lg)] border border-[#c6e0c2] bg-offer-bg p-6">
          <h2 className="font-display flex items-center gap-2 text-xl font-semibold text-forest-700"><Check size={22} strokeWidth={2} /> {t("Aktif abonelik", "Active membership")}</h2>
          <p className="mt-2 text-sm text-ink-700">{t("Üyeliğin aktif. Tüm özellikler açık.", "Your membership is active. Everything is open.")}</p>
        </div>
      )}

      {plan === "none" && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
          <h2 className="font-display text-xl font-semibold">{t("Üyeliğini başlat", "Start your membership")}</h2>
          <p className="mt-2 text-sm text-ink-700">
            {t(
              "Keşfet'te gezmek, profilleri görmek ve topluluk içeriğine göz atmak ücretsiz. İletişim ve katılım için üyelik gerekir:",
              "Browsing Discover, viewing profiles and previewing community content is free. Membership unlocks contact and participation:",
            )}
          </p>
          <ul className="mt-4 space-y-2.5">
            {benefits.map((b, i) => (
              <li key={i} className="flex items-center gap-2.5 text-sm text-ink-700">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-offer-bg text-forest-600"><b.Icon size={15} strokeWidth={1.75} /></span>
                {b.text}
              </li>
            ))}
          </ul>
          {/* Periyot seçimi — sitede seçilir, doğrudan o periyodun ödemesine gider */}
          <div className="mt-5 grid gap-2.5 border-t border-border pt-4 sm:grid-cols-2">
            {([
              { key: "yearly" as const, title: t("Yıllık", "Yearly"), price: priceYear, note: t("En avantajlı", "Best value") },
              { key: "quarterly" as const, title: t("3 Aylık", "Quarterly"), price: priceQuarter, note: t("Esnek", "Flexible") },
            ]).map((o) => (
              <button key={o.key} type="button" onClick={() => setPeriod(o.key)}
                className={`rounded-[var(--radius-lg)] border p-3 text-left transition ${period === o.key ? "border-forest-600 bg-offer-bg ring-1 ring-forest-600" : "border-border-strong hover:border-forest-500"}`}>
                <div className="flex items-center justify-between">
                  <span className="font-display font-semibold text-ink-900">{o.title}</span>
                  {period === o.key && <Check size={16} strokeWidth={2.5} className="text-forest-600" />}
                </div>
                <div className="mt-0.5 font-display text-lg font-semibold text-forest-700">{o.price}</div>
                <div className="text-xs text-ink-400">{o.note}</div>
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Button onClick={subscribe} disabled={busy} className="w-full sm:w-auto">{busy ? t("Güvenli ödemeye yönlendiriliyorsun…", "Redirecting to secure checkout…") : t("Abone ol", "Subscribe")}</Button>
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-400">
            <Lock size={13} strokeWidth={1.75} className="mt-0.5 shrink-0 text-forest-600" />
            <span>{t(
              "Ödeme, güvenli ödeme ortağımız Gumroad üzerinden alınır; “Abone ol”a basınca güvenli ödeme sayfasına yönlendirilirsin. Kart ekstrende ödeme “GUMROAD” olarak görünür. İstediğin an iptal edebilirsin.",
              "Payment is handled by our secure partner Gumroad; tapping “Subscribe” takes you to the secure checkout. Your card statement will show “GUMROAD”. You can cancel anytime.",
            )}</span>
          </p>
          {note && <p className="mt-2 text-xs text-ink-500">{note}</p>}
        </div>
      )}
    </div>
  );
}
