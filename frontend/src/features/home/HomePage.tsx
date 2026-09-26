import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { CATEGORIES } from "@/data/demo";

const U = "https://images.unsplash.com/";

const miniCards = [
  { name: "Marta · 🇵🇹", role: "Permakültür çiftliği", photo: U + "photo-1544005313-94ddf0286df2?w=160&q=80", tags: [["offer", "yer & deneyim sunuyor"], ["seek", "gönüllü arıyor"]] },
  { name: "Jonas · 🇩🇪", role: "Ekolog", photo: U + "photo-1507003211169-0a1dd7228f2d?w=160&q=80", tags: [["offer", "uzmanlık sunuyor"], ["topic", "ağaçlandırma"]] },
  { name: "Elif · 🇹🇷", role: "Çiftlik hayali kuruyor", photo: U + "photo-1438761681033-6461ffad8d80?w=160&q=80", tags: [["seek", "mentor arıyor"], ["seek", "bilgi arıyor"]] },
] as const;

const steps = [
  { n: 1, t: "Anlat", d: "Ne aradığını ve ne sunabildiğini kendi cümlelerinle yaz." },
  { n: 2, t: "Eşleş", d: "Aradığın ile sunulanı akıllıca eşleştiriyoruz." },
  { n: 3, t: "Bağlan", d: "İstek gönder; iki taraf da kabul edince iletişim açılır." },
];

const activities = [
  { photo: U + "photo-1500382017468-9049fed747ef?w=600&q=80", cap: "Hasat günü", who: "Deniz · 🇹🇷 Konya" },
  { photo: U + "photo-1441974231531-c6227db76b6e?w=600&q=80", cap: "Fidan dikimi", who: "Jonas · 🇩🇪 Berlin" },
  { photo: U + "photo-1449158743715-0a90ebb6d2d8?w=600&q=80", cap: "Eco-village atölyesi", who: "Lucia · 🇪🇸 Valensiya" },
  { photo: U + "photo-1470071459604-3b5ec3a7fe05?w=600&q=80", cap: "Off-grid kamp", who: "Marco · 🇮🇹 Torino" },
];

const perks = [
  ["🗺️", "Haritada tüm topluluğu keşfet", "Yakınındaki ve dünyadaki destek sunan/arayan herkesi konumuyla gör, filtrele."],
  ["🤝", "Sınırsız bağlantı kur", "Dilediğine bağlantı isteği gönder, sana gelenleri yönet. Doğru insanları bul."],
  ["💬", "Güvenli mesajlaşma", "İki taraf da kabul edince iletişim açılır; sohbet platformda, güvende."],
  ["✨", "Sana özel eşleşmeler", "Aradığın ile sunduğun, karşındakinin sunduğu/aradığıyla akıllıca eşleştirilir."],
  ["🌱", "Profilini öne çıkar", "Çiftliğini, projeni ya da uzmanlığını galerin ve etiketlerinle sergile."],
  ["🔒", "Gizlilik sende", "İletişim bilgin sen istemeden kimseye görünmez. Kontrol tamamen sende."],
];

const testimonials = [
  { q: "Çiftliğimde hasat için gönüllü arıyordum. İki hafta içinde tam aradığım üç kişiyle tanıştım — biri hâlâ bizimle.", n: "Marta", r: "Permakültür çiftliği · 🇵🇹 Sintra", photo: U + "photo-1544005313-94ddf0286df2?w=600&q=80" },
  { q: "Ekoloji bilgimi paylaşacak bir yer arıyordum. Şimdi üç farklı projeye mentorluk yapıyorum. Tam da hayalini kurduğum topluluk.", n: "Jonas", r: "Ekolog · 🇩🇪 Berlin", photo: U + "photo-1500648767791-00dcc994a43e?w=600&q=80" },
  { q: "Çiftlik hayalim vardı ama nereden başlayacağımı bilmiyordum. Burada bulduğum mentor sayesinde ilk adımı attım.", n: "Elif", r: "Yeni çiftçi · 🇹🇷 İzmir", photo: U + "photo-1494790108377-be9c29b29330?w=600&q=80" },
];

const hide = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = "none"; };

export function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-linear-160 from-forest-900 to-forest-700 text-sand-100">
        <div className="container-x grid items-center gap-10 py-16 md:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h1 className="font-display mb-4 text-4xl leading-[1.08] font-semibold md:text-5xl">
              Toprakla yeniden buluşan insanları bir araya getiriyoruz.
            </h1>
            <p className="mb-7 max-w-lg text-[17px] text-moss-300">
              Çiftliğinde birlikte üretecek insan arayan, bir projeye destek arayan ya da bilgisini paylaşmak isteyen — hepsi tek toplulukta.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button size="lg">Topluluğa katıl</Button>
              <Link to="/kesfet"><Button variant="onDark" size="lg">Haritada keşfet →</Button></Link>
            </div>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-white/12 bg-white/6 p-[18px]">
            <img src={U + "photo-1500382017468-9049fed747ef?w=900&q=80"} alt="" onError={hide}
              className="mb-3.5 h-40 w-full rounded-xl object-cover" />
            <div className="mb-2.5 text-xs font-semibold tracking-wider text-moss-300">TOPLULUKTAN</div>
            <div className="flex flex-col gap-2.5">
              {miniCards.map((m) => (
                <div key={m.name} className="rounded-xl bg-surface p-3">
                  <div className="flex items-center gap-2.5">
                    <div className="size-10 shrink-0 rounded-full bg-cover bg-center" style={{ backgroundImage: `url(${m.photo})`, backgroundColor: "#a9c99a" }} />
                    <div>
                      <div className="text-sm font-semibold text-ink-900">{m.name}</div>
                      <div className="text-xs text-ink-500">{m.role}</div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {m.tags.map(([axis, label]) => <Tag key={label} axis={axis as any}>{label}</Tag>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section className="container-x py-14">
        <h2 className="font-display mb-6 text-center text-3xl font-semibold">Nasıl çalışır?</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 text-center">
              <div className="font-display mx-auto mb-3.5 grid size-11 place-items-center rounded-full bg-sand-100 text-xl font-semibold text-forest-600">{s.n}</div>
              <h3 className="mb-1.5 text-[17px] font-semibold">{s.t}</h3>
              <p className="text-sm text-ink-500">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Çiftlikte hayat bandı */}
      <section className="relative flex min-h-[300px] items-end bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(160deg,#2f5741,#6f9e5c)` }}>
        <img src={U + "photo-1464226184884-fa280b87c399?w=1600&q=80"} alt="" onError={hide}
          className="absolute inset-0 -z-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-linear-90 from-forest-900/70 to-forest-900/20" />
        <div className="container-x relative py-8 text-white">
          <h3 className="font-display text-2xl font-semibold [text-shadow:0_1px_8px_rgba(0,0,0,.4)]">Çiftlikte hayat, birlikte üretmek</h3>
          <p className="max-w-xl text-[15px] text-sand-100 [text-shadow:0_1px_6px_rgba(0,0,0,.4)]">Toprakla uğraşan, öğrenen, paylaşan bir topluluğun parçası ol.</p>
        </div>
      </section>

      {/* Kategoriler */}
      <section className="container-x py-14">
        <h2 className="font-display mb-2 text-center text-3xl font-semibold">Nasıl bir deneyim arıyorsun?</h2>
        <p className="mx-auto mb-8 max-w-xl text-center text-ink-500">
          Çiftlik konaklamalarından eco-village'lara, hayvan bakımından gıda ormanlarına — keşfetmeyi bekleyen çeşitli bir deneyim dünyası seni bekliyor.
        </p>
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3">
          {CATEGORIES.map((c) => (
            <div key={c.label} className="relative h-40 overflow-hidden rounded-[var(--radius-lg)] bg-linear-135 from-moss-300 to-forest-500">
              <img src={c.photo} alt="" onError={hide} className="h-full w-full object-cover transition duration-300 hover:scale-105" />
              <div className="font-display absolute inset-x-0 bottom-0 bg-linear-0 from-forest-900/85 to-transparent p-3.5 text-base font-semibold text-white">{c.label}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-ink-500">…ve topluluk büyüdükçe çok daha fazlası sizleri bekliyor.</p>
      </section>

      {/* Topluluk aktiviteleri */}
      <section className="container-x pb-14">
        <h2 className="font-display mb-2 text-center text-3xl font-semibold">Topluluktan son aktiviteler</h2>
        <p className="mx-auto mb-8 max-w-xl text-center text-ink-500">
          Toprakla Yeniden topluluğu her gün üretiyor, öğreniyor, paylaşıyor. İşte son kareler.
        </p>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {activities.map((a, i) => (
            <div key={i} className="relative h-[180px] overflow-hidden rounded-xl bg-cover bg-center bg-linear-135 from-moss-300 to-forest-500" style={{ backgroundImage: `url(${a.photo})` }}>
              <div className="absolute inset-x-0 bottom-0 bg-linear-0 from-forest-900/85 to-transparent p-3 text-white">
                <div className="text-sm font-semibold">{a.cap}</div>
                <div className="text-xs text-sand-200">{a.who}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Seni neler bekliyor */}
      <section className="bg-linear-160 from-forest-700 to-forest-900 text-sand-100">
        <div className="container-x py-14">
          <h2 className="font-display mb-1.5 text-center text-3xl font-semibold text-white">Seni neler bekliyor?</h2>
          <p className="mx-auto mb-8 max-w-xl text-center text-moss-300">Toprakla Yeniden bir topluluk. Üyeliğinle bu topluluğun tüm kapıları sana açılır.</p>
          <div className="grid gap-4 md:grid-cols-3">
            {perks.map(([ic, t, d]) => (
              <div key={t} className="rounded-[var(--radius-lg)] border border-white/12 bg-white/6 p-[22px]">
                <div className="mb-2.5 text-2xl">{ic}</div>
                <h3 className="mb-1.5 text-base font-semibold text-white">{t}</h3>
                <p className="text-sm text-moss-300">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center"><Button size="lg">Topluluğa katıl</Button></div>
        </div>
      </section>

      {/* Topluluktan sesler */}
      <section className="container-x py-14">
        <h2 className="font-display mb-6 text-center text-3xl font-semibold">Topluluktan sesler</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.n} className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
              <div className="h-40 bg-cover bg-center bg-moss-300" style={{ backgroundImage: `url(${t.photo})` }} />
              <div className="p-[18px]">
                <p className="mb-3.5 text-sm leading-relaxed text-ink-700">"{t.q}"</p>
                <div className="text-sm font-semibold">{t.n}</div>
                <div className="text-xs text-ink-500">{t.r}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
