import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { LegalPage, Section, Para, Bullets, Note } from "./legal";

// Kullanım Koşulları / Terms of Use — /kosullar. İki dilli.
// Platform bir aracıdır; abonelik LemonSqueezy üzerinden alınır; iptalde geri ödeme yoktur.

export function KosullarPage() {
  const { t } = useI18n();
  const brand = t("Toprakla Yeniden", "Reconnect with Soil");
  const email = t("info@topraklayeniden.com", "info@reconnectwithsoil.com");

  return (
    <LegalPage
      title={t("Kullanım Koşulları", "Terms of Use")}
      updated={t("Son güncelleme: Ekim 2026", "Last updated: October 2026")}
      intro={t(
        `Bu Kullanım Koşulları, ${brand} platformunu (web siteleri ve hizmetleri) kullanımını düzenler. Hesap oluşturarak ya da platformu kullanarak bu koşulları kabul etmiş olursun. Kabul etmiyorsan lütfen platformu kullanma.`,
        `These Terms of Use govern your use of the ${brand} platform (its websites and services). By creating an account or using the platform, you accept these terms. If you don't accept them, please don't use the platform.`,
      )}
    >
      <Section n={1} title={t("Platformun niteliği", "What the platform is")}>
        <Para>
          {t(
            `${brand} bir buluşma ve tanışma platformudur. Çiftlik/yer sahiplerini (ev sahipleri), gönüllüleri ve toprağa, doğaya ve birlikte üretmeye ilgi duyan kişileri bir araya getirir.`,
            `${brand} is a platform for meeting and getting to know people. It brings together farm/place owners (hosts), volunteers and people interested in the soil, nature and growing together.`,
          )}
        </Para>
        <Para>
          {t(
            "Platform üyeler arasında yalnızca aracıdır. Bir iş/işçi ilişkisi, acente, işveren, seyahat veya konaklama hizmeti kurmaz; üyeler arasındaki anlaşmaların, buluşmaların, çalışmaların ya da ödemelerin tarafı veya garantörü değildir.",
            "The platform is only an intermediary between members. It does not create an employment relationship, agency, employer, travel or accommodation service; it is not a party to or guarantor of the agreements, meetings, work or payments between members.",
          )}
        </Para>
      </Section>

      <Section n={2} title={t("Üyelik ve hesap", "Membership and account")}>
        <Bullets items={[
          [t("Yaş.", "Age."), t("Üye olmak için en az 18 yaşında olmalısın.", "You must be at least 18 years old to become a member.")],
          [t("Doğru bilgi.", "Accurate information."), t("Kayıt ve profilinde gerçek ve güncel bilgi verirsin. Hesabından yapılan her işlemden sen sorumlusun.", "You provide true and current information in your registration and profile. You are responsible for all activity on your account.")],
          [t("Hesap güvenliği.", "Account security."), t("Şifreni gizli tutar, yetkisiz kullanımı fark edersen bize bildirirsin.", "You keep your password confidential and notify us if you notice unauthorised use.")],
          [t("Tek hesap.", "One account."), t("Her kişi tek gerçek hesapla katılır. Sahte veya çoklu hesaplar yasaktır.", "Each person joins with one genuine account. Fake or multiple accounts are forbidden.")],
        ]} />
      </Section>

      <Section n={3} title={t("Abonelik, ödeme ve iptal", "Subscription, payment and cancellation")}>
        <Para>
          {t(
            "Platformun bazı özellikleri ücretli bir aboneliğe tabidir. Güncel abonelik ücreti yıllık 35 USD'dir (fiyatlar değişebilir; geçerli fiyat satın alma anında gösterilir).",
            "Some features of the platform require a paid subscription. The current subscription fee is 35 USD per year (prices may change; the applicable price is shown at the time of purchase).",
          )}
        </Para>
        <Para>
          {t(
            "Ödemeler, ödeme hizmet sağlayıcımız ve kayıtlı satıcı (Merchant of Record) olan Lemon Squeezy üzerinden işlenir. Satın alma sırasında Lemon Squeezy'nin koşulları da geçerlidir. Kart bilgilerin bizde saklanmaz.",
            "Payments are processed through Lemon Squeezy, our payment service provider and Merchant of Record. Lemon Squeezy's terms also apply at the time of purchase. Your card details are not stored by us.",
          )}
        </Para>
        <Note>
          <b>{t("İptal ve geri ödeme: ", "Cancellation and refunds: ")}</b>
          {t(
            "Aboneliğini istediğin zaman iptal edebilirsin; iptal, bir sonraki yenileme döneminde geçerli olur ve mevcut dönemin sonuna kadar erişimin sürer. Ödenen abonelik ücretleri için geri ödeme yapılmaz — iptal halinde kısmi veya tam iade yapılmaz. Yasaların zorunlu kıldığı istisnalar saklıdır.",
            "You can cancel your subscription at any time; cancellation takes effect at the next renewal period and your access continues until the end of the current period. Subscription fees paid are non-refundable — no partial or full refund is made on cancellation. Exceptions required by law are reserved.",
          )}
        </Note>
      </Section>

      <Section n={4} title={t("Kabul edilebilir kullanım", "Acceptable use")}>
        <Para>{t("Platformu kullanırken şunları yapmamayı kabul edersin:", "When using the platform, you agree not to:")}</Para>
        <Bullets items={[
          t("Yanıltıcı, sahte veya hileli bilgi paylaşmak; başkasının kimliğine bürünmek.", "Share misleading, fake or fraudulent information; impersonate others."),
          t("Taciz, hakaret, tehdit, zorbalık, ayrımcılık veya nefret söylemi.", "Harass, insult, threaten, bully, discriminate or use hate speech."),
          t("Gönüllüyü ucuz/bedava iş gücü gibi kullanmak ya da değişim karşılığı para talep etmek.", "Treat volunteers as cheap/free labour, or demand money in exchange for the stay."),
          t("Ticari reklam, spam, çok seviyeli pazarlama, dolandırıcılık ya da siyasi/dini propaganda.", "Commercial advertising, spam, multi-level marketing, fraud or political/religious propaganda."),
          t("Başkasının kişisel verisini (adres, telefon, özel yazışma) izinsiz paylaşmak.", "Share someone else's personal data (address, phone, private messages) without consent."),
          t("Platforma, güvenliğine ya da diğer üyelere teknik olarak zarar vermek.", "Technically harm the platform, its security or other members."),
          t("Yürürlükteki yasaları ihlal etmek.", "Violate applicable laws."),
        ]} />
        <Para>
          {t(
            "Topluluk Kuralları bu koşulların ayrılmaz bir parçasıdır.",
            "The Community Rules are an integral part of these terms.",
          )} <Link to="/kurallar" className="text-forest-600 underline">{t("Topluluk Kuralları", "Community Rules")}</Link>
        </Para>
      </Section>

      <Section n={5} title={t("Üyeler arası ilişkiler ve sorumluluk reddi", "Member relationships and disclaimer")}>
        <Para>
          {t(
            "Üyeler arasındaki tüm anlaşmalar, buluşmalar, konaklamalar ve çalışmalar tarafların kendi sorumluluğundadır. Platform; üyelerin kimliğini, beyanlarını, güvenliğini, davranışlarını veya bir buluşmanın sonucunu garanti etmez.",
            "All agreements, meetings, stays and work between members are the parties' own responsibility. The platform does not guarantee members' identity, statements, safety, conduct, or the outcome of any meeting.",
          )}
        </Para>
        <Para>
          {t(
            "Kendi güvenliğin için gerekli özeni göstermek senin sorumluluğundadır: önceden iyi iletişim kur, değerlendirmeleri incele ve kendini güvende hissetmediğin durumdan çekil. Vize, çalışma izni ve yerel yasal gerekliliklere uymak da senin sorumluluğundadır.",
            "Taking the necessary care for your own safety is your responsibility: communicate well beforehand, check reviews, and withdraw from any situation where you don't feel safe. Complying with visa, work-permit and local legal requirements is also your responsibility.",
          )}
        </Para>
      </Section>

      <Section n={6} title={t("İçerik ve fikri mülkiyet", "Content and intellectual property")}>
        <Bullets items={[
          [t("Senin içeriğin.", "Your content."), t("Paylaştığın profil, fotoğraf, yorum ve mesajlardan sen sorumlusun. Bunları platformda gösterebilmemiz için bize sınırlı, dünya çapında kullanım izni verirsin.", "You are responsible for the profile, photos, reviews and messages you share. You grant us a limited, worldwide licence to display them on the platform.")],
          [t("Platformun içeriği.", "Platform content."), t("Platformun yazılımı, tasarımı, markası ve logoları bize aittir; izinsiz kopyalanamaz veya kullanılamaz.", "The platform's software, design, brand and logos belong to us; they may not be copied or used without permission.")],
        ]} />
      </Section>

      <Section n={7} title={t("Askıya alma ve fesih", "Suspension and termination")}>
        <Para>
          {t(
            "Bu koşulları veya Topluluk Kuralları'nı ihlal eden hesapları uyarabilir, kısıtlayabilir, askıya alabilir veya kalıcı olarak kapatabiliriz. Ciddi ihlallerde (çocuk güvenliği, şiddet, dolandırıcılık, nefret söylemi vb.) doğrudan kalıcı kapatma uygulanır. Hesabını dilediğin zaman kapatabilirsin; ödenmiş abonelik ücretleri iade edilmez.",
            "We may warn, restrict, suspend or permanently close accounts that violate these terms or the Community Rules. For serious violations (child safety, violence, fraud, hate speech, etc.) permanent closure is applied directly. You may close your account at any time; subscription fees already paid are non-refundable.",
          )}
        </Para>
      </Section>

      <Section n={8} title={t("Sorumluluğun sınırlandırılması", "Limitation of liability")}>
        <Para>
          {t(
            "Platform \"olduğu gibi\" sunulur. Yürürlükteki yasaların izin verdiği ölçüde, üyeler arası ilişkilerden, platformun kesintiye uğramasından veya üçüncü taraf hizmetlerden doğan dolaylı zararlardan sorumlu değiliz.",
            "The platform is provided \"as is\". To the extent permitted by applicable law, we are not liable for indirect damages arising from member relationships, platform interruptions, or third-party services.",
          )}
        </Para>
      </Section>

      <Section n={9} title={t("Değişiklikler ve uygulanacak hukuk", "Changes and governing law")}>
        <Para>
          {t(
            "Bu koşulları zaman zaman güncelleyebiliriz; önemli değişiklikleri üyelerle paylaşırız. Değişiklik sonrası platformu kullanmaya devam etmen güncel koşulları kabul ettiğin anlamına gelir. Bu koşullar Türkiye Cumhuriyeti yasalarına tabidir.",
            "We may update these terms from time to time; we'll share important changes with members. Continuing to use the platform after a change means you accept the updated terms. These terms are governed by the laws of the Republic of Türkiye.",
          )}
        </Para>
      </Section>

      <div className="mt-10 border-t border-border pt-6 text-[13px] text-ink-500">
        <p>
          {t("Sorularını bize iletebilirsin: ", "You can reach us with any questions: ")}
          <a href={`mailto:${email}`} className="font-semibold text-forest-600 underline">{email}</a>
        </p>
      </div>
    </LegalPage>
  );
}
