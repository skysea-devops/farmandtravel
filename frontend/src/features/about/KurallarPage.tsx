import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

// Public, bilingual community rules page (/kurallar).
// Mirrors docs/topluluk-kurallari-tr.md. Everything is driven by t(tr, en)
// so the English domain (reconnectwithsoil.com) shows the full English text.

export function KurallarPage() {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
      <header className="mb-10 text-center">
        <h1 className="font-display mb-3 text-4xl font-semibold">
          {t("Topluluk Kuralları ve İlkeleri", "Community Rules & Principles")}
        </h1>
        <p className="text-[17px] text-ink-700">
          {t(
            "Toprakla Yeniden; toprağa, doğaya ve birlikte üretmeye inanan insanları buluşturan bir topluluktur. Burada amaç ücretsiz iş gücü ya da bedava konaklama değil; bilgi, emek ve deneyimin karşılıklı paylaşıldığı; doğaya saygılı, temiz üretime ve kendine yeterliliğe inanan bir dayanışma ağı kurmaktır.",
            "Reconnect with Soil is a community that brings together people who believe in the soil, nature and growing together. The aim here is not free labour or free lodging; it is to build a network of solidarity where knowledge, effort and experience are shared, grounded in respect for nature, clean production and self-sufficiency.",
          )}
        </p>
        <p className="mt-3 text-[15px] text-ink-500">
          {t(
            "Bu platform yalnızca çiftlik/yer sahibi ile gönüllüyü buluşturmaz; aynı zamanda üyelerin birbirine maddi ve manevi destek olduğu, birlikte aktiviteler düzenlediği, eğitici/öğretici programlar paylaştığı bir topluluktur. Aşağıdaki kurallar bu etkileşim biçimlerinin hepsini kapsar. Üye olarak bu ilkeleri kabul etmiş sayılırsın.",
            "This platform doesn't only connect place/farm owners with volunteers; it is also a community where members support one another materially and morally, organise activities together and share educational programs. The rules below cover all of these forms of interaction. By becoming a member you are deemed to accept these principles.",
          )}
        </p>
      </header>

      <Section n={1} title={t("Topluluğumuzun ruhu", "The spirit of our community")}>
        <Bullets items={[
          [t("Toprağa ve doğaya saygı.", "Respect for the soil and nature."),
           t("Temiz, doğayla uyumlu ve sürdürülebilir üretimi destekleriz. Toprağı, suyu, hayvanları ve ekosistemi koruyan uygulamaları önemseriz.",
             "We support clean, nature-friendly and sustainable production. We care about practices that protect the soil, water, animals and the ecosystem.")],
          [t("Karşılıklılık.", "Reciprocity."),
           t("Herkes hem verir hem alır. İlişki bir “işveren–işçi” ilişkisi değil, bir değişim ve öğrenme ilişkisidir.",
             "Everyone both gives and receives. The relationship is not an “employer–worker” one, but one of exchange and learning.")],
          [t("Kendine yeterlilik ve farkındalık.", "Self-sufficiency and awareness."),
           t("Üretmeyi, paylaşmayı ve doğayla yeniden bağ kurmayı öğrenmek isteyenleri destekleriz. Burada maddi veya manevi destek sunmak da, almak da değerlidir.",
             "We support those who want to learn to produce, share and reconnect with nature. Offering and receiving material or moral support are both valued here.")],
          [t("Dürüstlük ve açıklık.", "Honesty and openness."),
           t("Profilinde ve mesajlarında gerçeği yaz. Beklentileri baştan net konuş.",
             "Be truthful in your profile and messages. Be clear about expectations from the start.")],
          [t("Saygı.", "Respect."),
           t("Farklı kültür, inanç, yaşam biçimi ve deneyim seviyelerine açık ol. “Farklı olmak, yanlış olmak değildir.”",
             "Be open to different cultures, beliefs, ways of life and experience levels. “Being different is not being wrong.”")],
        ]} />
      </Section>

      <Section n={2} title={t("Herkes için genel kurallar", "General rules for everyone")}>
        <p className="mb-3 text-[15px] text-ink-700">
          {t("Bu kurallar istisnasız tüm üyeler (ev sahipleri, gönüllüler, mentorlar, ortaklar, destekçiler) için geçerlidir.",
             "These rules apply to all members without exception (hosts, volunteers, mentors, partners, supporters).")}
        </p>
        <Numbered items={[
          [t("Dürüst ol.", "Be honest."),
           t("Kim olduğun, ne sunduğun ve ne aradığın konusunda gerçeği yaz. Yanıltıcı profil, sahte deneyim veya abartılı vaat yasaktır.",
             "Be truthful about who you are, what you offer and what you seek. Misleading profiles, fake experience or exaggerated promises are forbidden.")],
          [t("Saygılı ol.", "Be respectful."),
           t("Taciz, hakaret, tehdit, zorbalık, ayrımcılık ve nefret söylemi kesinlikle yasaktır.",
             "Harassment, insults, threats, bullying, discrimination and hate speech are strictly forbidden.")],
          [t("Güvenliği önemse.", "Care about safety."),
           t("Kimseyi tehlikeye atma. Buluşmalarda ve konaklamalarda karşılıklı güvenliği gözet.",
             "Don't put anyone at risk. Look out for mutual safety in meetings and stays.")],
          [t("Mahremiyete saygı göster.", "Respect privacy."),
           t("Bir başkasının iletişim bilgilerini, adresini, fotoğrafını veya özel yazışmalarını izni olmadan paylaşma.",
             "Don't share someone else's contact details, address, photos or private messages without their consent.")],
          [t("İletişimi platformda tut.", "Keep communication on the platform."),
           t("Özellikle tanışma aşamasında yazışmaları platform içinde yürüt; bu, herkesin güvenliği için önemlidir.",
             "Especially during the getting-to-know stage, keep messaging on the platform; this matters for everyone's safety.")],
          [t("İstismar etme.", "Don't exploit."),
           t("Topluluğu ticari reklam, çok seviyeli pazarlama, dolandırıcılık, siyasi/dini propaganda ya da gönüllüyü ucuz iş gücü gibi kullanmak için araç yapma.",
             "Don't use the community for commercial advertising, multi-level marketing, fraud, political/religious propaganda, or treating volunteers as cheap labour.")],
          [t("Yasalara uy.", "Obey the law."),
           t("Bulunduğun ülkenin vize, çalışma, konaklama ve diğer yasal gerekliliklerine uymak senin sorumluluğundur.",
             "Complying with the visa, work, lodging and other legal requirements of the country you're in is your responsibility.")],
          [t("Tek hesap.", "One account."),
           t("Her kişi tek gerçek hesapla katılır. Sahte veya çoklu hesaplarla puan/değerlendirme manipülasyonu yasaktır.",
             "Each person joins with a single genuine account. Manipulating ratings/reviews with fake or multiple accounts is forbidden.")],
          [t("Çocukların ve hayvanların korunması.", "Protection of children and animals."),
           t("Çocuk istismarına, hayvana kötü muameleye veya bunları teşvik eden içeriğe asla izin verilmez.",
             "Child abuse, mistreatment of animals, or content that encourages them is never permitted.")],
        ]} />
        <Note>
          {t("Bu kuralların ciddi ihlali hesabın askıya alınması veya kalıcı kapatılmasıyla sonuçlanabilir (bkz. Bölüm 9).",
             "Serious breaches of these rules may result in suspension or permanent closure of your account (see Section 9).")}
        </Note>
      </Section>

      <Section n={3} title={t("Ev sahibi (çiftlik/yer/proje sahibi) kuralları", "Host (farm/place/project owner) rules")}>
        <p className="mb-3 text-[15px] text-ink-700">
          {t("Bir yeri, çiftliği ya da projeyi gönüllüye açıyorsan:",
             "If you're opening a place, farm or project to a volunteer:")}
        </p>
        <Bullets items={[
          [t("Dürüst profil.", "An honest profile."),
           t("Yerini, yapılacak işi, yaşam koşullarını ve beklentilerini profilinde olduğu gibi anlat.",
             "Describe your place, the work, living conditions and expectations as they really are in your profile.")],
          [t("Uygun misafir konaklaması.", "Suitable guest lodging."),
           t("Gönüllüye güvenli, temiz ve insana yakışır, uygun bir misafir konaklaması sun. Sunduklarını (yatak, oda/ortak alan, olanaklar) baştan açıkça belirt.",
             "Offer the volunteer safe, clean, decent and suitable guest lodging. State clearly from the start what you provide (bed, room/shared space, amenities).")],
          [t("Günde 3 öğün yemek.", "Three meals a day."),
           t("Değişimin standardı, gönüllüye günde 3 öğün yemek sağlamaktır. Özel beslenme (vejetaryen, vegan, alerji vb.) durumlarını baştan konuşun. Farklı bir düzen uygulayacaksan koşulları profilinde ve anlaşmada açıkça yaz.",
             "The standard of the exchange is to provide the volunteer with 3 meals a day. Discuss special diets (vegetarian, vegan, allergies, etc.) up front. If you'll run a different arrangement, state the terms clearly in your profile and the agreement.")],
          [t("Adil ve makul katkı.", "Fair and reasonable contribution."),
           t("Gönüllünün emeği karşılıklı bir değişimdir, tam zamanlı iş değildir. Standart: günde 6 saat, haftada 5 gün çalışma; karşılığında günde 3 öğün yemek + uygun bir misafir konaklaması. Haftada 2 tam izin günü verilir. Farklı bir düzen uygulanacaksa iki taraf baştan açıkça anlaşmalı.",
             "The volunteer's effort is a mutual exchange, not a full-time job. Standard: 6 hours a day, 5 days a week; in exchange, 3 meals a day + suitable guest lodging. Two full days off per week are given. Any different arrangement must be agreed clearly by both sides up front.")],
          [t("İlk gün yönlendirme.", "First-day orientation."),
           t("Gönüllüye işi, ev kurallarını ve güvenlik bilgilerini ilk gün açıkça anlat.",
             "Clearly explain the work, house rules and safety information to the volunteer on the first day.")],
          [t("İstismar yok.", "No exploitation."),
           t("Gönüllüyü ucuz/bedava iş gücü gibi görme; ağır, tehlikeli ya da anlaşılandan çok farklı işlere zorlama. Değişim karşılığında gönüllüden para talep etme.",
             "Don't treat the volunteer as cheap/free labour; don't force heavy, dangerous or very different work than agreed. Don't charge the volunteer money in exchange for the stay.")],
          [t("Değişiklikte şeffaflık.", "Transparency on changes."),
           t("Paylaştığın ya da anlaştığınız koşullarda bir değişiklik olursa gönüllüye önceden ve açıkça bildir.",
             "If anything changes in the conditions you shared or agreed, tell the volunteer in advance and clearly.")],
          [t("Saygılı ortam.", "A respectful environment."),
           t("Gönüllüye bir topluluk üyesi gibi davran; onu ailenin/işin bir parçası gibi gör ama bir çalışan gibi değil.",
             "Treat the volunteer as a community member; see them as part of the family/work, not as an employee.")],
        ]} />
      </Section>

      <Section n={4} title={t("Gönüllü / katılımcı kuralları", "Volunteer / participant rules")}>
        <p className="mb-3 text-[15px] text-ink-700">
          {t("Bir yere emeğini, zamanını ya da deneyimini sunmak için gidiyorsan:",
             "If you're going somewhere to offer your effort, time or experience:")}
        </p>
        <Bullets items={[
          [t("Sözüne sadık ol.", "Keep your word."),
           t("Üzerinde anlaştığın tarih, süre ve işe bağlı kal. Vazgeçersen mümkün olan en erken zamanda, dürüstçe haber ver.",
             "Stick to the dates, duration and work you agreed on. If you change your mind, say so honestly as early as possible.")],
          [t("Becerilerinde dürüst ol.", "Be honest about your skills."),
           t("Deneyimini, dil seviyeni ve yapabileceklerini abartma. Yapamayacağın bir işe “yaparım” deme.",
             "Don't exaggerate your experience, language level or abilities. Don't say “I can do it” for work you can't.")],
          [t("Gayretli ve inisiyatifli ol.", "Be diligent and take initiative."),
           t("Üzerine düşeni özenle yap; her şeyin söylenmesini bekleme, elini taşın altına koy.",
             "Do your part with care; don't wait to be told everything, pitch in.")],
          [t("Ev kurallarına uy.", "Follow the house rules."),
           t("Gittiğin yeri kendi evin gibi gör; ortak alanları temiz tut, kaynakları özenli kullan.",
             "Treat the place as your own home; keep shared spaces clean and use resources carefully.")],
          [t("İletişimi sürdür.", "Keep communicating."),
           t("Beklentileri konuş, sorun çıkarsa erkenden ve yapıcı biçimde konuş, mesajlara yanıt ver.",
             "Talk through expectations, raise problems early and constructively, and reply to messages.")],
          [t("Kültüre ve doğaya saygı.", "Respect the culture and nature."),
           t("Yerel âdetlere, çalışma biçimine ve doğaya saygı göster. Geldiğinden daha iyi bırak.",
             "Respect local customs, ways of working and nature. Leave it better than you found it.")],
          [t("Amaç bütçe değil.", "It's not about a cheap trip."),
           t("Buradaki değişim ucuz tatil değil; öğrenmek, üretmek ve bağ kurmaktır. Bu ruhla katıl.",
             "The exchange here is not a cheap holiday; it's about learning, producing and connecting. Join in that spirit.")],
        ]} />
      </Section>

      <Section n={5} title={t("Ev sahibi–gönüllü anlaşması", "Host–volunteer agreement")}>
        <p className="mb-3 text-[15px] text-ink-700">
          {t("Toprakla Yeniden insanları buluşturur; anlaşmanın şartlarını iki taraf kendi arasında belirler. Sağlıklı bir deneyim için, buluşmadan önce şunları karşılıklı netleştirmenizi öneririz:",
             "Reconnect with Soil brings people together; the terms of the agreement are set between the two sides. For a healthy experience, we recommend clarifying the following together before you meet:")}
        </p>
        <Bullets plain items={[
          [t("Yapılacak işin kapsamı ve günlük/haftalık süre", "The scope of the work and the daily/weekly hours"), ""],
          [t("İzin günleri", "Days off"), ""],
          [t("Konaklama koşulları (yatak, ortak alan, olanaklar)", "Lodging conditions (bed, shared space, amenities)"), ""],
          [t("Yemek/erzak durumu", "Meals/provisions"), ""],
          [t("Başlangıç–bitiş tarihleri ve varsa deneme süresi", "Start–end dates and any trial period"), ""],
          [t("İptal / erken ayrılma durumunda ne yapılacağı", "What happens on cancellation / early departure"), ""],
          [t("Varsa özel kurallar (sigara, evcil hayvan, misafir vb.)", "Any special rules (smoking, pets, guests, etc.)"), ""],
        ]} />
        <Note>
          {t("Beklentiler baştan net olduğunda sorunların çoğu hiç yaşanmaz. Anlaşmazlıkta önce karşılıklı ve saygılı iletişimi deneyin.",
             "When expectations are clear from the start, most problems never arise. In a disagreement, first try mutual and respectful communication.")}
        </Note>
      </Section>

      <Section n={6} title={t("Destek, mentorluk ve ortaklık", "Support, mentorship and partnership")}>
        <p className="mb-3 text-[15px] text-ink-700">
          {t("Bu topluluk yalnızca ev sahibi–gönüllü buluşması için değil; üyelerin birbirine maddi ve manevi destek olması için de vardır. Bilgini, deneyimini, zamanını ya da imkânlarını paylaşabilir; bir başkasının üretimine, projesine ya da yolculuğuna destek olabilirsin.",
             "This community isn't only for host–volunteer meetings; it also exists for members to support one another materially and morally. You can share your knowledge, experience, time or means; you can support someone else's production, project or journey.")}
        </p>
        <Bullets items={[
          [t("Gönüllülük esastır.", "It's voluntary."),
           t("Verilen destek karşılıksız ve gönüllüdür; kimse destek vermeye ya da almaya zorlanamaz.",
             "Support given is unconditional and voluntary; no one can be forced to give or receive it.")],
          [t("Açık ve dürüst ol.", "Be open and honest."),
           t("Ne tür bir destek sunduğunu ya da aradığını net yaz. Karşılığında bir beklentin varsa bunu baştan açıkça konuş.",
             "State clearly what kind of support you offer or seek. If you have an expectation in return, discuss it openly up front.")],
          [t("Maddi destekte şeffaflık.", "Transparency in material support."),
           t("Bağış, ortak üretim, kaynak paylaşımı ya da mali destek söz konusuysa koşulları iki taraf baştan yazılı olarak netleştirmeli. Topluluğu dilencilik, zincirleme bağış, yatırım vaadi veya dolandırıcılık için araç yapmak yasaktır.",
             "If donations, joint production, resource-sharing or financial support are involved, both sides should clarify the terms in writing up front. Using the community for begging, chain donations, investment promises or fraud is forbidden.")],
          [t("Mentorluk saygı ister.", "Mentorship requires respect."),
           t("Bilgi ve deneyim paylaşırken karşındakini küçümseme; öğrenen de paylaşanın emeğine ve zamanına saygı gösterir.",
             "When sharing knowledge and experience, don't belittle the other person; the learner also respects the sharer's effort and time.")],
          [t("Ortaklıklar yazılı olsun.", "Put partnerships in writing."),
           t("Ortak bir proje, üretim ya da iş kurulacaksa; emek, pay, sorumluluk ve olası riskleri baştan açıkça konuşup yazın. Platform bu ortaklıkların tarafı veya garantörü değildir.",
             "If a joint project, production or business is set up, discuss and write down the effort, shares, responsibilities and possible risks up front. The platform is not a party to or guarantor of these partnerships.")],
        ]} />
      </Section>

      <Section n={7} title={t("Aktiviteler, etkinlikler ve eğitici/öğretici programlar", "Activities, events and educational programs")}>
        <p className="mb-3 text-[15px] text-ink-700">
          {t("Üyeler topluluk içinde aktiviteler, buluşmalar, atölyeler ve eğitici/öğretici programlar düzenleyebilir veya bunlara katılabilir. Amaç; öğrenmeyi, üretmeyi ve doğayla yeniden bağ kurmayı birlikte güçlendirmektir.",
             "Members can organise or take part in activities, meetups, workshops and educational programs within the community. The aim is to strengthen learning, producing and reconnecting with nature, together.")}
        </p>
        <h3 className="mb-2 mt-5 text-[15px] font-semibold text-forest-700">
          {t("Düzenleyen (organizatör) için:", "For organisers:")}
        </h3>
        <Bullets items={[
          [t("Dürüst tanıtım.", "Honest promotion."),
           t("Etkinliğin içeriğini, süresini, seviyesini, yerini (veya çevrimiçi olup olmadığını) ve varsa katılım koşullarını olduğu gibi anlat. Yanıltıcı başlık ya da abartılı vaat verme.",
             "Describe the event's content, duration, level, location (or whether it's online) and any participation terms as they are. No misleading titles or exaggerated promises.")],
          [t("Güvenlik önceliklidir.", "Safety comes first."),
           t("Fiziksel etkinliklerde katılımcıların güvenliğini gözet; riskleri önceden bildir.",
             "In physical activities, look after participants' safety; disclose risks in advance.")],
          [t("Erişilebilir ve kapsayıcı ol.", "Be accessible and inclusive."),
           t("Mümkün olduğunca herkese açık, ayrımcılıktan uzak bir ortam kur.",
             "As far as possible, create an open, non-discriminatory environment.")],
          [t("Ticari sınır.", "Commercial limits."),
           t("Platform bir reklam/satış panosu değildir. Ücretli bir program düzenleyeceksen bunu baştan şeffaf biçimde belirt; gizli ücret, zorunlu satış ya da çok seviyeli pazarlama yasaktır.",
             "The platform is not an ad/sales board. If you run a paid program, state it transparently up front; hidden fees, forced sales or multi-level marketing are forbidden.")],
          [t("Eğitici içerikte dürüstlük.", "Honesty in educational content."),
           t("Öğrettiğin konuda gerçek deneyim/bilgi sahibi ol. Sağlık, güvenlik veya hukuk gibi konularda yanıltıcı ya da tehlikeli bilgi verme.",
             "Have genuine experience/knowledge in what you teach. Don't give misleading or dangerous information on topics like health, safety or law.")],
        ]} />
        <h3 className="mb-2 mt-5 text-[15px] font-semibold text-forest-700">
          {t("Katılımcı için:", "For participants:")}
        </h3>
        <Bullets items={[
          [t("Sözüne sadık ol.", "Keep your word."),
           t("Katılacağını söylediğin etkinliğe gel; gelemeyeceksen önceden haber ver.",
             "Show up to the event you said you'd join; if you can't, let the organiser know in advance.")],
          [t("Saygılı katıl.", "Take part respectfully."),
           t("Düzenleyene, diğer katılımcılara ve mekâna/doğaya saygı göster. Ortak kaynakları özenle kullan.",
             "Respect the organiser, other participants and the venue/nature. Use shared resources carefully.")],
          [t("Kendi sorumluluğun.", "Your own responsibility."),
           t("Kendi sağlık ve güvenlik sınırlarını bil; sana uygun olmayan bir aktiviteye katılma.",
             "Know your own health and safety limits; don't join an activity that isn't right for you.")],
        ]} />
      </Section>

      <Section n={8} title={t("Değerlendirme ve yorum kuralları", "Review and rating rules")}>
        <p className="mb-3 text-[15px] text-ink-700">
          {t("Değerlendirmeler, topluluktaki güvenin temelidir. Bu yüzden gerçek ve adil olmaları gerekir.",
             "Reviews are the foundation of trust in the community. That's why they must be genuine and fair.")}
        </p>
        <h3 className="mb-2 mt-5 text-[15px] font-semibold text-forest-700">{t("Nasıl çalışır:", "How it works:")}</h3>
        <Bullets items={[
          ["", t("Yalnızca gerçekten bağlantı kurmuş (karşılıklı kabul etmiş) üyeler birbirini değerlendirebilir.",
                 "Only members who have genuinely connected (mutually accepted) can review each other.")],
          ["", t("Değerlendirme tek seferliktir ve sonradan değiştirilemez — o yüzden göndermeden önce emin ol.",
                 "A review is one-time and cannot be changed later — so be sure before you send it.")],
          ["", t("Değerlendirmeler karşılıklıdır. Senin hakkındaki bir değerlendirme, sen de karşı tarafı değerlendirince ya da 15 gün geçince görünür olur. Böylece kimse diğerinin puanını görüp “misilleme” yapamaz.",
                 "Reviews are reciprocal. A review about you becomes visible once you also review the other person, or after 15 days. That way no one can see the other's rating first and “retaliate.”")],
          ["", t("4 yıldız ve altı puanlar ile uygunsuz içerik taşıyan yorumlar, yayınlanmadan önce ekip tarafından incelenir.",
                 "Ratings of 4 stars and below, and comments with inappropriate content, are reviewed by the team before publishing.")],
        ]} />
        <h3 className="mb-2 mt-5 text-[15px] font-semibold text-forest-700">{t("Yazarken:", "When writing:")}</h3>
        <Bullets items={[
          [t("Dürüst ve gerçek deneyime dayalı yaz.", "Write honestly, from real experience."),
           t("Yaşamadığın bir şeyi yazma.", "Don't write about something you didn't experience.")],
          [t("Yasak içerik:", "Forbidden content:"),
           t("küfür, hakaret, nefret söylemi, ayrımcılık; kişisel veri (telefon, adres, e-posta); özel yazışmaların izinsiz paylaşımı; kanıtsız suç isnadı.",
             "profanity, insults, hate speech, discrimination; personal data (phone, address, email); sharing private messages without consent; unproven criminal accusations.")],
          [t("Baskı yok.", "No pressure."),
           t("Olumlu değerlendirme karşılığında bir şey vaat etmek ya da olumsuz değerlendirmeyle tehdit etmek yasaktır.",
             "Promising something in exchange for a positive review, or threatening a negative one, is forbidden.")],
          [t("Bir değerlendirme kurallara aykırıysa bildir.", "Report a review that breaks the rules."),
           t("Ekip inceler. Bildirim aracını gerçek ihlaller için kullan; anlaşmazlıkları “kötü değerlendirme” diye raporlamak yaptırımla sonuçlanabilir.",
             "The team will review it. Use reporting for genuine violations; reporting disagreements as a “bad review” may itself lead to sanctions.")],
        ]} />
      </Section>

      <Section n={9} title={t("İhlaller ve yaptırımlar", "Violations and sanctions")}>
        <p className="mb-3 text-[15px] text-ink-700">
          {t("Kurallara aykırı davranışlarda, ihlalin ağırlığına göre şu adımlar uygulanabilir:",
             "For conduct that breaks the rules, the following steps may apply depending on severity:")}
        </p>
        <Numbered items={[
          ["", t("Uyarı ve içeriğin (yorum, mesaj, profil bilgisi) kaldırılması",
                 "A warning and removal of the content (review, message, profile information)")],
          ["", t("Özelliklere geçici kısıtlama", "Temporary restriction of features")],
          ["", t("Hesabın askıya alınması", "Suspension of the account")],
          ["", t("Ciddi veya tekrarlayan ihlallerde hesabın kalıcı olarak kapatılması",
                 "Permanent closure of the account for serious or repeated violations")],
        ]} />
        <Note>
          {t("Çocuk güvenliği, şiddet, dolandırıcılık, nefret söylemi ve ağır istismar gibi durumlarda doğrudan kalıcı kapatma uygulanır.",
             "In cases such as child safety, violence, fraud, hate speech and serious abuse, permanent closure is applied directly.")}
        </Note>
      </Section>

      <Section n={10} title={t("Sorumluluk reddi", "Disclaimer")}>
        <p className="text-[15px] text-ink-700">
          {t("Toprakla Yeniden bir buluşma ve tanışma platformudur. Üyeler arasındaki anlaşmaların, buluşmaların ve çalışmaların içeriğinden, güvenliğinden ve sonuçlarından taraflar kendileri sorumludur. Platform bir iş/işçi ilişkisi kurmaz, taraflar adına garanti vermez. Kendi güvenliğin için gerekli özeni göstermek senin sorumluluğundadır: önceden iyi iletişim kur, referansları/değerlendirmeleri incele ve kendini güvende hissetmediğin bir durumdan çekil.",
             "Reconnect with Soil is a platform for meeting and getting to know people. The parties themselves are responsible for the content, safety and outcomes of the agreements, meetings and work between members. The platform does not create an employment relationship and gives no guarantee on anyone's behalf. Taking the necessary care for your own safety is your responsibility: communicate well beforehand, check references/reviews, and withdraw from any situation where you don't feel safe.")}
        </p>
      </Section>

      <p className="mt-10 border-t border-border pt-6 text-center text-[13px] text-ink-500">
        {t("Bu kurallar topluluk büyüdükçe güncellenebilir. Önemli değişiklikleri üyelerle paylaşırız.",
           "These rules may be updated as the community grows. We'll share important changes with members.")}
      </p>
    </div>
  );
}

/* ---------- small presentational helpers ---------- */

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="font-display mb-3 flex items-baseline gap-2.5 text-2xl font-semibold">
        <span className="text-[15px] font-semibold text-clay-600">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Bullets({ items, plain = false }: { items: [string, string][]; plain?: boolean }) {
  return (
    <ul className={plain ? "ml-5 list-disc space-y-1.5 text-[15px] text-ink-700" : "space-y-2.5"}>
      {items.map(([head, body], i) =>
        plain ? (
          <li key={i}>{head}</li>
        ) : (
          <li key={i} className="flex gap-2.5 text-[15px] text-ink-700">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-moss-500" />
            <span>{head && <b className="font-semibold text-ink-900">{head} </b>}{body}</span>
          </li>
        ),
      )}
    </ul>
  );
}

function Numbered({ items }: { items: [string, string][] }) {
  return (
    <ol className="space-y-2.5">
      {items.map(([head, body], i) => (
        <li key={i} className="flex gap-3 text-[15px] text-ink-700">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-moss-500 text-[13px] font-semibold text-white">{i + 1}</span>
          <span>{head && <b className="font-semibold text-ink-900">{head} </b>}{body}</span>
        </li>
      ))}
    </ol>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border-l-4 border-moss-500 bg-sand-100 px-4 py-3 text-[14px] text-ink-700">
      {children}
    </div>
  );
}
