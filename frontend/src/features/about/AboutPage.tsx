import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

const values = [
  ["🌍", "Doğaya dönüş", "Çiftlikler, eco-village'lar, gıda ormanları ve doğa temelli her proje burada yer bulur."],
  ["🤝", "Gerçek bağlantı", "İletişim, iki taraf da isteyince açılır. Sahici, karşılıklı, güvenli."],
  ["🌱", "Birlikte büyümek", "Bilgi, emek ve deneyim paylaşıldıkça çoğalır. Topluluk bunun için var."],
];

export function AboutPage() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-5 text-center">
        <h1 className="font-display mb-3.5 text-4xl font-semibold">Biz kimiz</h1>
        <p className="text-[17px] text-ink-700">
          Toprakla Yeniden, doğaya, sürdürülebilir yaşama ve birlikte üretmeye inanan insanları buluşturan bir
          topluluktur. Amacımız basit: doğru insanları bir araya getirmek. Gerisini onların ellerine bırakmak.
        </p>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4.5 px-6 pt-5 pb-8 md:grid-cols-3">
        {values.map(([ic, t, d]) => (
          <div key={t} className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
            <div className="mb-2.5 text-3xl">{ic}</div>
            <h3 className="mb-1.5 text-[17px] font-semibold">{t}</h3>
            <p className="text-sm text-ink-500">{d}</p>
          </div>
        ))}
      </section>

      {/* Kurucu */}
      <section className="mx-auto max-w-5xl px-6 pb-16">
        <div className="grid items-center gap-8 rounded-[var(--radius-lg)] border border-border bg-surface p-8 md:grid-cols-[220px_1fr]">
          <div className="mx-auto">
            <div className="size-44 rounded-full bg-linear-135 from-moss-300 to-clay-500 bg-cover bg-center"
              style={{ backgroundImage: "url(https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80)" }} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold tracking-wider text-clay-600">KURUCU ÜYE</div>
            <h2 className="font-display text-2xl font-semibold">Özgür Gökdeniz</h2>
            <div className="mb-3 text-sm text-ink-500">🚜 Çiftlik sahibi · 📍 Fidanlar köyü, Akhisar / Manisa</div>
            <p className="text-[15px] text-ink-700">
              Toprakla Yeniden fikrinin sahibi. Manisa Akhisar'daki Fidanlar köyünde kurduğu çiftlikte
              sürdürülebilir tarım ve birlikte üretim üzerine çalışıyor. Kendi deneyiminden doğan bu topluluğu,
              doğaya dönmek isteyenlerle bilgi ve emeği paylaşan herkesi buluşturmak için kurdu.
            </p>
            <div className="mt-4">
              <Link to="/aktiviteler"><Button variant="outline" size="sm">🎥 Özgür ile podcast'i izle</Button></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
