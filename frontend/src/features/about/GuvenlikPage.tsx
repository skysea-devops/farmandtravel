import { Link } from "react-router-dom";
import { ShieldCheck, Lock, Star, Flag, CreditCard, FileCheck, type LucideIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n";

// Public, bilingual Trust & Safety page (/guvenlik). Workaway/Worldpackers tarzı güven
// çapası; içerik platformun gerçek özelliklerine dayanır (profil onayı, gizli iletişim,
// değerlendirme, bildir/engelle, güvenli ödeme, veri gizliliği).
export function GuvenlikPage() {
  const { t } = useI18n();

  const cards: { Icon: LucideIcon; title: string; body: string }[] = [
    {
      Icon: ShieldCheck,
      title: t("Her profil incelenir", "Every profile is reviewed"),
      body: t(
        "Ekibimiz her üyeyi, Keşfet'te görünmeden önce elle inceler. Topluluğun ruhuna uymayan profiller yayınlanmaz.",
        "Our team reviews every member by hand before they appear in Discover. Profiles that don't fit the community are not published.",
      ),
    },
    {
      Icon: Lock,
      title: t("İletişim bilgilerin gizli", "Your contact details stay private"),
      body: t(
        "Bağlantı öncesi başkaları yalnızca adını, şehrini ve etiketlerini görür. Telefon, e-posta ve adres gibi bilgiler ancak iki taraf da bağlantıyı kabul edince açılır.",
        "Before connecting, others see only your name, city and tags. Phone, email and address are revealed only after both sides accept the connection.",
      ),
    },
    {
      Icon: Star,
      title: t("Değerlendirme ve itibar", "Reviews and reputation"),
      body: t(
        "Deneyimler karşılıklı puan ve yorumlarla kayıt altına alınır. Bir üyenin itibarı profilinde görünür; kiminle buluşacağına bilerek karar verirsin.",
        "Experiences are recorded with mutual ratings and reviews. A member's reputation is visible on their profile, so you decide who to meet with full information.",
      ),
    },
    {
      Icon: Flag,
      title: t("Bildir ve engelle", "Report and block"),
      body: t(
        "Uygunsuz bir davranışla karşılaşırsan tek dokunuşla bildir ya da engelle. Her bildirim ekibimiz tarafından incelenir.",
        "If you encounter inappropriate behaviour, report or block with one tap. Every report is reviewed by our team.",
      ),
    },
    {
      Icon: CreditCard,
      title: t("Güvenli ödeme", "Secure payments"),
      body: t(
        "Ödemeler güvenli ödeme ortağımız Gumroad üzerinden alınır; kart bilgin bizde saklanmaz. Üyeliğini istediğin an iptal edebilirsin.",
        "Payments are handled by our secure partner Gumroad; we never store your card details. You can cancel your membership anytime.",
      ),
    },
    {
      Icon: FileCheck,
      title: t("Verin güvende", "Your data is protected"),
      body: t(
        "Verilerini yalnızca topluluğu işletmek için kullanırız, üçüncü taraflara satmayız. Ayrıntıları Gizlilik Politikası'nda bulabilirsin.",
        "We use your data only to run the community and never sell it to third parties. Find the details in our Privacy Policy.",
      ),
    },
  ];

  const tips = [
    t("İlk görüşmeyi telefonda ya da görüntülü yap; aceleci kararlar verme.",
      "Do your first conversation by phone or video call; don't rush into decisions."),
    t("Beklentileri (iş, konaklama, süre, yemek) baştan yazılı ve net konuş.",
      "Agree on expectations (work, lodging, duration, meals) clearly and in writing up front."),
    t("Platform dışına taşınmadan önce tanış; şüpheli istekleri (ön ödeme, kişisel/finansal bilgi) reddet.",
      "Get to know each other before moving off-platform; refuse suspicious requests (upfront payments, personal/financial info)."),
    t("Bir şey yolunda değilse buluşmayı sürdürme ve durumu bize bildir.",
      "If something feels off, don't continue and report it to us."),
    t("İlk buluşmaları mümkünse gündüz ve başkalarının da bulunduğu bir ortamda yap.",
      "Where possible, hold first meetings during the day and where others are around."),
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 md:py-16">
      <header className="mb-10 text-center">
        <span className="mb-4 inline-grid size-14 place-items-center rounded-full bg-offer-bg text-forest-700"><ShieldCheck size={28} strokeWidth={1.75} /></span>
        <h1 className="font-display mb-3 text-4xl font-semibold">{t("Güven ve Güvenlik", "Trust & Safety")}</h1>
        <p className="mx-auto max-w-2xl text-[17px] text-ink-700">
          {t(
            "Toprakla Yeniden, insanların rahatça tanışıp birlikte üretebildiği güvenli bir topluluk olsun diye tasarlandı. Güvenliğin için attığımız adımlar:",
            "Reconnect with Soil is built to be a safe community where people can meet and grow together with peace of mind. Here's what we do to keep you safe:",
          )}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c, i) => (
          <div key={i} className="rounded-[var(--radius-lg)] border border-border bg-surface p-5">
            <span className="mb-3 inline-grid size-10 place-items-center rounded-full bg-offer-bg text-forest-600"><c.Icon size={20} strokeWidth={1.75} /></span>
            <h3 className="font-display mb-1.5 text-[17px] font-semibold text-ink-900">{c.title}</h3>
            <p className="text-sm leading-relaxed text-ink-700">{c.body}</p>
          </div>
        ))}
      </div>

      <section className="mt-10 rounded-[var(--radius-lg)] border border-[#c6e0c2] bg-offer-bg p-6">
        <h2 className="font-display mb-3 text-xl font-semibold text-forest-700">{t("Güvenli buluşma ipuçları", "Tips for meeting safely")}</h2>
        <ul className="space-y-2.5">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-ink-700">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-forest-600" />
              {tip}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-center text-sm text-ink-600">
        {t("Ayrıntılar için ", "For more, see our ")}
        <Link to="/kurallar" className="font-medium text-forest-600 hover:underline">{t("Topluluk Kuralları", "Community Rules")}</Link>
        {t(" ve ", " and ")}
        <Link to="/gizlilik" className="font-medium text-forest-600 hover:underline">{t("Gizlilik Politikası", "Privacy Policy")}</Link>
        {t("'na göz at.", ".")}
      </p>
    </div>
  );
}
