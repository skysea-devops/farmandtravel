import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n";

export function AboutPage() {
  const { t } = useI18n();

  const values: [string, string, string][] = [
    ["🌍", t("Doğaya dönüş", "Back to nature"), t("Çiftlikler, eco-village'lar, gıda ormanları ve doğa temelli her proje burada yer bulur.", "Farms, eco-villages, food forests and every nature-based project has a place here.")],
    ["🤝", t("Gerçek bağlantı", "Real connection"), t("İletişim, iki taraf da isteyince açılır. Sahici, karşılıklı, güvenli.", "Contact opens only when both sides want it. Genuine, mutual, safe.")],
    ["🌱", t("Birlikte büyümek", "Growing together"), t("Bilgi, emek ve deneyim paylaşıldıkça çoğalır. Topluluk bunun için var.", "Knowledge, effort and experience multiply as they're shared. That's what the community is for.")],
  ];

  return (
    <>
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-5 text-center">
        <h1 className="font-display mb-3.5 text-4xl font-semibold">{t("Biz kimiz", "About us")}</h1>
        <p className="text-[17px] text-ink-700">
          {t(
            "Toprakla Yeniden, doğaya, sürdürülebilir yaşama ve birlikte üretmeye inanan insanları buluşturan bir topluluktur. Amacımız basit: doğru insanları bir araya getirmek. Gerisini onların ellerine bırakmak.",
            "Reconnect with Soil is a community that brings together people who believe in nature, sustainable living and growing together. Our aim is simple: bring the right people together, and leave the rest in their hands.",
          )}
        </p>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4.5 px-6 pt-5 pb-8 md:grid-cols-3">
        {values.map(([ic, title, d]) => (
          <div key={title} className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
            <div className="mb-2.5 text-3xl">{ic}</div>
            <h3 className="mb-1.5 text-[17px] font-semibold">{title}</h3>
            <p className="text-sm text-ink-500">{d}</p>
          </div>
        ))}
      </section>

      {/* Kurucu */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid items-center gap-8 rounded-[var(--radius-lg)] border border-border bg-surface p-8 md:grid-cols-[220px_1fr]">
          <div className="mx-auto">
            <div className="size-44 rounded-full bg-cover bg-center"
              style={{ backgroundImage: "url(/ozgur.jpg)" }} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold tracking-wider text-clay-600">{t("KURUCU ÜYE", "FOUNDING MEMBER")}</div>
            <h2 className="font-display text-2xl font-semibold">Özgür Gökdeniz</h2>
            <div className="mb-3 text-sm text-ink-500">{t("🚜 Çiftlik sahibi · 📍 Demirtaş köyü, Kırkağaç / Manisa", "🚜 Farm owner · 📍 Demirtaş village, Kırkağaç / Manisa, Türkiye")}</div>
            <p className="text-[15px] text-ink-700">
              {t(
                "Merhaba, ben Özgür. Yıllar önce şehir hayatını geride bırakıp Manisa Kırkağaç'ın Demirtaş köyüne yerleştim ve burada küçük bir çiftlik kurdum. Buradaki birinci amacım organik ve sağlıklı üretim yaparak kendi yiyeceğimi, kendi gıdamı üretmek.",
                "Hi, I'm Özgür. Years ago I left city life behind, settled in the village of Demirtaş in Kırkağaç, Manisa, and started a small farm here. My first goal is to grow my own food through organic, healthy production.",
              )}
            </p>
            <p className="mt-3 text-[15px] text-ink-700">
              {t(
                "Toprakla yeniden bağ kurmanın hayatımı nasıl değiştirdiğini kendi ellerimle gördüm; şimdi öğrendiklerimi paylaşmak, bu yolda ilerlemek isteyenlere öğretmek istiyorum. Çünkü bu yolculukta öğrendiğim en değerli şey şu: bilgiyi, emeği ve deneyimi paylaştıkça her şey çoğalıyor. Toprakla Yeniden'i tam da bunun için kurdum — doğaya dönmek isteyenlerle, kapısını açmaya hazır olanları bir araya getirmek için. Umarım sen de bu toplulukta kendine bir yer bulursun.",
                "I've seen with my own hands how reconnecting with the soil changed my life; now I want to share what I've learned and teach those who want to walk this path. Because the most valuable thing I've learned on this journey is that knowledge, effort and experience multiply the more you share them. That's exactly why I built this community — to bring together those who want to return to nature and those ready to open their door. I hope you'll find your place here too.",
              )}
            </p>
            <div className="mt-4">
              <Link to="/aktiviteler"><Button variant="outline" size="sm">{t("🎥 Özgür ile podcast'i izle", "🎥 Watch the podcast with Özgür")}</Button></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
