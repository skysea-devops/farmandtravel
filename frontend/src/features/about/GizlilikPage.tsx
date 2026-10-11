import { useI18n } from "@/lib/i18n";
import { LegalPage, Section, Para, Bullets, Note } from "./legal";

// Gizlilik Politikası / Privacy Policy — /gizlilik. İki dilli. KVKK + GDPR.
// Ödeme Lemon Squeezy (Merchant of Record) ile işlenir; kart verisi bizde tutulmaz.

export function GizlilikPage() {
  const { t } = useI18n();
  const brand = t("Toprakla Yeniden", "Reconnect with Soil");
  const email = t("info@topraklayeniden.com", "info@reconnectwithsoil.com");

  return (
    <LegalPage
      title={t("Gizlilik Politikası", "Privacy Policy")}
      updated={t("Son güncelleme: Ekim 2026", "Last updated: October 2026")}
      intro={t(
        `Bu politika, ${brand} olarak kişisel verilerini nasıl topladığımızı, kullandığımızı ve koruduğumuzu açıklar. Verilerini KVKK (6698 sayılı kanun) ve GDPR kapsamında işleriz.`,
        `This policy explains how we, ${brand}, collect, use and protect your personal data. We process your data in accordance with the Turkish Data Protection Law (KVKK, Law No. 6698) and the GDPR.`,
      )}
    >
      <Section n={1} title={t("Hangi verileri topluyoruz", "What data we collect")}>
        <Bullets items={[
          [t("Hesap bilgileri.", "Account information."), t("E-posta adresi ve şifre (şifrelenmiş olarak).", "Email address and password (stored encrypted).")],
          [t("Profil bilgileri.", "Profile information."), t("Ad, konum (ülke/şehir), başlık, biyografi, fotoğraflar, diller, ilgi alanları, ev sahibi/gönüllü detayları, müsaitlik tarihleri.", "Name, location (country/city), headline, bio, photos, languages, interests, host/volunteer details, availability dates.")],
          [t("İletişim bilgileri.", "Contact details."), t("İsteğe bağlı olarak paylaştığın telefon, iletişim e-postası, sosyal hesaplar, adres.", "Phone, contact email, social accounts, address you optionally share.")],
          [t("Etkileşim verileri.", "Interaction data."), t("Mesajlar, bağlantılar, değerlendirmeler, kaydedilenler, aktiviteler.", "Messages, connections, reviews, saved items, activities.")],
          [t("Teknik veriler.", "Technical data."), t("IP adresi, cihaz/tarayıcı bilgisi, oturum ve kullanım kayıtları.", "IP address, device/browser info, session and usage logs.")],
          [t("Ödeme verileri.", "Payment data."), t("Ödemeler Lemon Squeezy üzerinden işlenir; kart numaran bizde tutulmaz. Bize yalnızca abonelik durumun iletilir.", "Payments are processed by Lemon Squeezy; your card number is not stored by us. Only your subscription status is passed to us.")],
        ]} />
      </Section>

      <Section n={2} title={t("Verileri neden ve hangi hukuki sebeple işliyoruz", "Why and on what legal basis we process data")}>
        <Bullets items={[
          [t("Hizmeti sunmak.", "To provide the service."), t("Hesabını oluşturmak, profilini göstermek, üyeleri eşleştirmek, mesajlaşmayı sağlamak (sözleşmenin ifası).", "To create your account, show your profile, match members, enable messaging (performance of a contract).")],
          [t("Güvenlik ve kötüye kullanımın önlenmesi.", "Security and abuse prevention."), t("Sahtecilik, dolandırıcılık ve kural ihlallerini tespit etmek (meşru menfaat).", "To detect fraud, abuse and rule violations (legitimate interest).")],
          [t("Ödeme ve abonelik yönetimi.", "Payment and subscription management."), t("Abonelik ücretini tahsil etmek ve erişimini yönetmek (sözleşmenin ifası / yasal yükümlülük).", "To charge the subscription fee and manage your access (contract / legal obligation).")],
          [t("İletişim.", "Communication."), t("Bildirim ve önemli duyuruları göndermek (meşru menfaat / açık rıza).", "To send notifications and important announcements (legitimate interest / consent).")],
          [t("Yasal yükümlülükler.", "Legal obligations."), t("Mevzuatın gerektirdiği hallerde (yasal yükümlülük).", "Where required by law (legal obligation).")],
        ]} />
      </Section>

      <Section n={3} title={t("Verileri kimlerle paylaşıyoruz", "Who we share data with")}>
        <Para>{t("Verilerini satmayız. Yalnızca hizmeti sağlamak için gereken hizmet sağlayıcılarla paylaşırız:", "We don't sell your data. We only share it with the service providers needed to run the service:")}</Para>
        <Bullets items={[
          [t("Lemon Squeezy", "Lemon Squeezy"), t("ödeme ve abonelik işleme (kayıtlı satıcı).", "payment and subscription processing (Merchant of Record).")],
          [t("Amazon Web Services (AWS)", "Amazon Web Services (AWS)"), t("barındırma ve veri saklama (Frankfurt / eu-central-1).", "hosting and data storage (Frankfurt / eu-central-1).")],
          [t("Diğer üyeler", "Other members"), t("profilinde herkese açık yaptığın bilgiler diğer üyelerce görülebilir; iletişim bilgilerin yalnızca bağlantı kurduğun üyelerle paylaşılır.", "information you make public in your profile is visible to other members; your contact details are shared only with members you connect with.")],
          [t("Yetkili merciler", "Authorities"), t("yasal zorunluluk halinde.", "where legally required.")],
        ]} />
      </Section>

      <Section n={4} title={t("Veri saklama ve uluslararası aktarım", "Data retention and international transfer")}>
        <Para>
          {t(
            "Verilerini hesabın aktif olduğu sürece saklarız. Hesabını kapatırsan, verilerini yasal saklama süreleri saklı kalmak üzere makul bir süre içinde sileriz veya anonimleştiririz. Verilerin AWS'nin Frankfurt (Avrupa Birliği) bölgesinde barındırılır; bazı hizmet sağlayıcılar (ör. ödeme) yurt dışında veri işleyebilir ve bu aktarımlar uygun güvenceler altında yapılır.",
            "We keep your data as long as your account is active. If you close your account, we delete or anonymise your data within a reasonable period, subject to statutory retention periods. Your data is hosted in AWS's Frankfurt (European Union) region; some providers (e.g. payment) may process data abroad, and such transfers are made under appropriate safeguards.",
          )}
        </Para>
      </Section>

      <Section n={5} title={t("Çerezler", "Cookies")}>
        <Para>
          {t(
            "Oturumunu açık tutmak ve platformun çalışması için gerekli çerezleri kullanırız. Performans ve tercih çerezleri için gerekli hallerde rızanı isteriz. Tarayıcı ayarlarından çerezleri yönetebilirsin; ancak bazı çerezleri engellemek platformun çalışmasını etkileyebilir.",
            "We use cookies necessary to keep your session open and run the platform. Where needed, we ask for your consent for performance and preference cookies. You can manage cookies in your browser settings; however, blocking some cookies may affect how the platform works.",
          )}
        </Para>
      </Section>

      <Section n={6} title={t("Haklarınız", "Your rights")}>
        <Para>{t("KVKK ve GDPR kapsamında şu haklara sahipsin:", "Under the KVKK and GDPR you have the right to:")}</Para>
        <Bullets items={[
          t("İşlenen verilerine erişmek ve bir kopyasını istemek.", "Access your processed data and request a copy."),
          t("Yanlış veya eksik verilerin düzeltilmesini istemek.", "Request correction of inaccurate or incomplete data."),
          t("Verilerinin silinmesini istemek (unutulma hakkı).", "Request erasure of your data (right to be forgotten)."),
          t("İşlemeye itiraz etmek veya işlemeyi kısıtlamak.", "Object to or restrict processing."),
          t("Verilerini taşınabilir biçimde almak.", "Receive your data in a portable format."),
          t("Verdiğin rızayı geri çekmek.", "Withdraw a consent you have given."),
        ]} />
        <Note>
          {t(
            "Bu haklarını kullanmak için bize e-posta ile ulaşabilirsin. Talebini en geç yasaların öngördüğü süre içinde sonuçlandırırız.",
            "To exercise these rights, contact us by email. We will respond within the period required by law.",
          )}
        </Note>
      </Section>

      <Section n={7} title={t("Güvenlik", "Security")}>
        <Para>
          {t(
            "Verilerini korumak için makul teknik ve idari önlemleri uygularız (şifreli bağlantı, erişim kontrolü, şifrelenmiş saklama). Yine de internet üzerinden hiçbir aktarımın %100 güvenli olmadığını hatırlatırız.",
            "We apply reasonable technical and organisational measures to protect your data (encrypted connections, access control, encrypted storage). Still, no transmission over the internet is 100% secure.",
          )}
        </Para>
      </Section>

      <Section n={8} title={t("İletişim", "Contact")}>
        <Para>
          {t(
            "Gizlilikle ilgili sorular ve veri sahibi talepleri için veri sorumlusuna ulaşabilirsin:",
            "For privacy questions and data-subject requests, you can contact the data controller:",
          )}
        </Para>
        <Para>
          <a href={`mailto:${email}`} className="font-semibold text-forest-600 underline">{email}</a>
        </Para>
      </Section>
    </LegalPage>
  );
}
