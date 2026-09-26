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
      <section className="mx-auto grid max-w-5xl gap-4.5 px-6 pt-5 pb-16 md:grid-cols-3">
        {values.map(([ic, t, d]) => (
          <div key={t} className="rounded-[var(--radius-lg)] border border-border bg-surface p-6">
            <div className="mb-2.5 text-3xl">{ic}</div>
            <h3 className="mb-1.5 text-[17px] font-semibold">{t}</h3>
            <p className="text-sm text-ink-500">{d}</p>
          </div>
        ))}
      </section>
    </>
  );
}
