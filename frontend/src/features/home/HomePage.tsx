import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Avatar } from "@/components/ui/Avatar";
import { CATEGORIES } from "@/data/demo";
import { youtubeThumb } from "@/data/activities";
import { useI18n } from "@/lib/i18n";
import { activities as actApi, api } from "@/lib/api";
import type { ActivityItem, PublicMember } from "@/lib/types";
import { BandSlider } from "./BandSlider";

// Community photos for the "life on the farm" slider band.
const BAND_IMAGES = ["/community/s1.jpg", "/community/s2.jpg", "/community/s3.jpg", "/community/s4.jpg", "/community/s5.jpg", "/community/s6.jpg", "/community/s7.jpg", "/community/s8.jpg", "/community/s9.jpg", "/community/s10.jpg", "/community/s11.jpg", "/community/s12.jpg"];

const U = "https://images.unsplash.com/";

// English labels for the marketing category tiles.
const CAT_EN: Record<string, string> = {
  "Organik tarım": "Organic farming",
  "Permakültür": "Permaculture",
  "Eco-village": "Eco-village",
  "Doğa & yaban hayatı": "Nature & wildlife",
  "Gıda ormanı": "Food forest",
  "Off-grid yaşam": "Off-grid living",
  "İnziva merkezi": "Retreat center",
  "Çiftçilik okulu": "Farming school",
  "Hayvan barınağı": "Animal shelter",
};

const hide = (e: React.SyntheticEvent<HTMLImageElement>) => { e.currentTarget.style.display = "none"; };

export function HomePage() {
  const { t, lang } = useI18n();

  // Real community members for the "TOPLULUKTAN" panel (newest first from the API).
  // Falls back to the static sample cards below when none load yet / platform is empty.
  const [community, setCommunity] = useState<PublicMember[]>([]);
  useEffect(() => {
    api.get<{ members: PublicMember[] }>("/public/members")
      .then((r) => setCommunity(r.members.slice(0, 3)))
      .catch(() => {});
  }, []);

  const miniCards = [
    { name: "Marta · 🇵🇹", role: t("Permakültür çiftliği", "Permaculture farm"), photo: U + "photo-1544005313-94ddf0286df2?w=160&q=80", tags: [["offer", t("yer & deneyim sunuyor", "offering place & experience")], ["seek", t("gönüllü arıyor", "looking for volunteers")]] },
    { name: "Jonas · 🇩🇪", role: t("Ekolog", "Ecologist"), photo: U + "photo-1507003211169-0a1dd7228f2d?w=160&q=80", tags: [["offer", t("uzmanlık sunuyor", "offering expertise")], ["topic", t("ağaçlandırma", "reforestation")]] },
    { name: "Elif · 🇹🇷", role: t("Çiftlik hayali kuruyor", "Dreaming of a farm"), photo: U + "photo-1438761681033-6461ffad8d80?w=160&q=80", tags: [["seek", t("mentor arıyor", "looking for a mentor")], ["seek", t("bilgi arıyor", "looking for knowledge")]] },
  ] as const;

  const steps = [
    { n: 1, ttl: t("Anlat", "Tell us"), d: t("Ne aradığını ve ne sunabildiğini kendi cümlelerinle yaz.", "Describe what you're looking for and what you can offer, in your own words.") },
    { n: 2, ttl: t("Eşleş", "Match"), d: t("Aradığın ile sunulanı akıllıca eşleştiriyoruz.", "We intelligently match what you seek with what others offer.") },
    { n: 3, ttl: t("Bağlan", "Connect"), d: t("İstek gönder; iki taraf da kabul edince iletişim açılır.", "Send a request; once both sides accept, contact opens up.") },
  ];

  const [feed, setFeed] = useState<ActivityItem[]>([]);
  useEffect(() => {
    actApi.list<{ items: ActivityItem[] }>(4).then((r) => setFeed(r.items)).catch(() => {});
  }, []);

  const homeActivities = feed.slice(0, 4).map((a) => ({
    id: a.id,
    cap: a.title,
    who: a.author
      ? `${a.author} · ${a.place ?? ""}`
      : a.kind === "meeting"
        ? (a.online ? t("🟢 Online buluşma", "🟢 Online meetup") : t("📍 Yüz yüze buluşma", "📍 In-person meetup"))
        : t("📢 Duyuru", "📢 Announcement"),
    img: a.kind === "video" && a.youtubeId ? youtubeThumb(a.youtubeId) : (a.image ?? U + "photo-1416879595882-3373a0480b5b?w=600&q=80"),
    isVideo: a.kind === "video",
  }));

  const perks: [string, string, string][] = [
    ["🗺️", t("Haritada tüm topluluğu keşfet", "Explore the whole community on the map"), t("Yakınındaki ve dünyadaki destek sunan/arayan herkesi konumuyla gör, filtrele.", "See and filter everyone offering or seeking support, near you and around the world, by location.")],
    ["🤝", t("Sınırsız bağlantı kur", "Connect without limits"), t("Dilediğine bağlantı isteği gönder, sana gelenleri yönet. Doğru insanları bul.", "Send a connection request to anyone, manage the ones you receive. Find the right people.")],
    ["💬", t("Güvenli mesajlaşma", "Safe messaging"), t("İki taraf da kabul edince iletişim açılır; sohbet platformda, güvende.", "Contact opens once both sides accept; chat stays on the platform, safely.")],
    ["✨", t("Sana özel eşleşmeler", "Personalized matches"), t("Aradığın ile sunduğun, karşındakinin sunduğu/aradığıyla akıllıca eşleştirilir.", "What you seek and offer is intelligently matched with what others offer and seek.")],
    ["🌱", t("Profilini öne çıkar", "Showcase your profile"), t("Çiftliğini, projeni ya da uzmanlığını galerin ve etiketlerinle sergile.", "Show off your farm, project or expertise with your gallery and tags.")],
    ["🔒", t("Gizlilik sende", "Privacy is yours"), t("İletişim bilgin sen istemeden kimseye görünmez. Kontrol tamamen sende.", "Your contact details stay hidden until you choose. You're fully in control.")],
  ];

  const testimonials = [
    { q: t("Çiftliğimde hasat için gönüllü arıyordum. İki hafta içinde tam aradığım üç kişiyle tanıştım — biri hâlâ bizimle.", "I was looking for volunteers for the harvest on my farm. Within two weeks I met exactly the three people I needed — one is still with us."), n: "Marta", r: t("Permakültür çiftliği · 🇵🇹 Sintra", "Permaculture farm · 🇵🇹 Sintra"), photo: "/community/t-marta.jpg" },
    { q: t("Ekoloji bilgimi paylaşacak bir yer arıyordum. Şimdi üç farklı projeye mentorluk yapıyorum. Tam da hayalini kurduğum topluluk.", "I was looking for somewhere to share my ecology knowledge. Now I mentor three different projects. Exactly the community I dreamed of."), n: "Jonas", r: t("Ekolog · 🇩🇪 Berlin", "Ecologist · 🇩🇪 Berlin"), photo: "/community/t-jonas.jpg" },
    { q: t("Çiftlik hayalim vardı ama nereden başlayacağımı bilmiyordum. Burada bulduğum mentor sayesinde ilk adımı attım.", "I had a dream of a farm but didn't know where to start. Thanks to the mentor I found here, I took my first step."), n: "Elif", r: t("Yeni çiftçi · 🇹🇷 İzmir", "New farmer · 🇹🇷 İzmir"), photo: "/community/t-elif.jpg" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="bg-linear-160 from-forest-900 to-forest-700 text-sand-100">
        <div className="container-x grid items-center gap-10 py-16 md:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h1 className="font-display mb-4 text-4xl leading-[1.08] font-semibold md:text-5xl">
              {t("Toprakla yeniden buluşan insanları bir araya getiriyoruz.", "Bringing together people reconnecting with the soil.")}
            </h1>
            <p className="mb-7 max-w-lg text-[17px] text-moss-300">
              {t("Çiftliğinde birlikte üretmek isteyen, projelere destek arayan ya da bilgisini paylaşmak isteyen insanları tek toplulukta buluşturuyoruz.", "We bring people together in one community — those who want to grow together on their farm, those seeking support for a project, and those who want to share what they know.")}
            </p>
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <Link to="/kayit" className="w-full sm:w-auto">
                <Button size="lg" className="w-full justify-center sm:w-auto">{t("Topluluğa katıl", "Join the community")}</Button>
              </Link>
              {/* Mobile: map link (matches the hero mockup). Desktop: outlined button. */}
              <Link to="/kesfet" className="inline-flex items-center gap-2 px-1 font-semibold text-white underline decoration-moss-300/50 underline-offset-[6px] sm:hidden">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                  <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path d="M9 4v14" /><path d="M15 6v14" />
                </svg>
                {t("Haritada keşfet", "Explore the map")} <span aria-hidden>→</span>
              </Link>
              <Link to="/kesfet" className="hidden sm:inline-block"><Button variant="onDark" size="lg">{t("Haritada keşfet →", "Explore the map →")}</Button></Link>
            </div>
          </div>
          {/* Community preview panel — shown on all sizes (on mobile it sits below the hero). */}
          <div className="rounded-[var(--radius-lg)] border border-white/12 bg-white/6 p-[18px]">
            <img src={U + "photo-1500382017468-9049fed747ef?w=900&q=80"} alt="" onError={hide}
              className="mb-3.5 h-40 w-full rounded-xl object-cover" />
            <div className="mb-2.5 text-xs font-semibold tracking-wider text-moss-300">{t("TOPLULUKTAN", "FROM THE COMMUNITY")}</div>
            <div className="flex flex-col gap-2.5">
              {community.length > 0 ? (
                community.map((m) => (
                  <Link key={m.id} to="/kesfet" className="block rounded-xl bg-surface p-3 transition hover:shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <Avatar url={m.avatarUrl} className="size-10 shrink-0" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-ink-900">{m.firstName}</div>
                        <div className="truncate text-xs text-ink-500">{[m.city, m.country].filter(Boolean).join(", ") || m.headline}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {m.tags.slice(0, 2).map((tag) => <Tag key={`${tag.axis}-${tag.value}`} axis={tag.axis}>{lang === "en" ? tag.labelEn : tag.labelTr}</Tag>)}
                    </div>
                  </Link>
                ))
              ) : (
                miniCards.map((m) => (
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
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section className="container-x py-14">
        <h2 className="font-display mb-6 text-center text-3xl font-semibold">{t("Nasıl çalışır?", "How it works")}</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 text-center">
              <div className="font-display mx-auto mb-3.5 grid size-11 place-items-center rounded-full bg-sand-100 text-xl font-semibold text-forest-600">{s.n}</div>
              <h3 className="mb-1.5 text-[17px] font-semibold">{s.ttl}</h3>
              <p className="text-sm text-ink-500">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Çiftlikte hayat bandı */}
      <section className="relative flex min-h-[300px] items-end overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(160deg,#2f5741,#6f9e5c)` }}>
        <BandSlider images={BAND_IMAGES} />
        <div className="absolute inset-0 bg-linear-90 from-forest-900/70 to-forest-900/20" />
        <div className="container-x relative py-8 text-white">
          <h3 className="font-display text-2xl font-semibold [text-shadow:0_1px_8px_rgba(0,0,0,.4)]">{t("Çiftlikte hayat, birlikte üretmek", "Life on the farm, growing together")}</h3>
          <p className="max-w-xl text-[15px] text-sand-100 [text-shadow:0_1px_6px_rgba(0,0,0,.4)]">{t("Toprakla uğraşan, öğrenen, paylaşan bir topluluğun parçası ol.", "Become part of a community that works the land, learns and shares.")}</p>
        </div>
      </section>

      {/* Kategoriler */}
      <section className="container-x py-14">
        <h2 className="font-display mb-2 text-center text-3xl font-semibold">{t("Nasıl bir deneyim arıyorsun?", "What kind of experience are you after?")}</h2>
        <p className="mx-auto mb-8 max-w-xl text-center text-ink-500">
          {t("Çiftlik konaklamalarından eco-village'lara, hayvan bakımından gıda ormanlarına — keşfetmeyi bekleyen çeşitli bir deneyim dünyası seni bekliyor.", "From farm stays to eco-villages, animal care to food forests — a diverse world of experiences is waiting to be explored.")}
        </p>
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3">
          {CATEGORIES.map((c) => (
            <div key={c.label} className="relative h-40 overflow-hidden rounded-[var(--radius-lg)] bg-linear-135 from-moss-300 to-forest-500">
              <img src={c.photo} alt="" onError={hide} className="h-full w-full object-cover transition duration-300 hover:scale-105" />
              <div className="font-display absolute inset-x-0 bottom-0 bg-linear-0 from-forest-900/85 to-transparent p-3.5 text-base font-semibold text-white">{t(c.label, CAT_EN[c.label] ?? c.label)}</div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-ink-500">{t("…ve topluluk büyüdükçe çok daha fazlası sizleri bekliyor.", "…and much more as the community grows.")}</p>
      </section>

      {/* Topluluk aktiviteleri */}
      <section className="container-x pb-14">
        <div className="mb-2 flex items-end justify-between">
          <h2 className="font-display text-3xl font-semibold">{t("Topluluktan son aktiviteler", "Latest from the community")}</h2>
          <Link to="/aktiviteler" className="text-sm font-medium text-forest-600 hover:underline">{t("Tümünü gör →", "See all →")}</Link>
        </div>
        <p className="mb-8 max-w-xl text-ink-500">{t("Podcast'ler, buluşmalar, paylaşımlar ve duyurular — topluluğun nabzı.", "Podcasts, meetups, posts and announcements — the pulse of the community.")}</p>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {homeActivities.map((a) => (
            <Link key={a.id} to="/aktiviteler" className="group relative h-[180px] overflow-hidden rounded-xl bg-cover bg-center bg-linear-135 from-moss-300 to-forest-500" style={{ backgroundImage: `url(${a.img})` }}>
              {a.isVideo && (
                <span className="absolute inset-0 grid place-items-center bg-forest-900/25 transition group-hover:bg-forest-900/35">
                  <span className="grid size-11 place-items-center rounded-full bg-white/90 text-lg text-forest-700 shadow">▶</span>
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-linear-0 from-forest-900/85 to-transparent p-3 text-white">
                <div className="line-clamp-1 text-sm font-semibold">{a.cap}</div>
                <div className="line-clamp-1 text-xs text-sand-200">{a.who}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Seni neler bekliyor */}
      <section className="bg-linear-160 from-forest-700 to-forest-900 text-sand-100">
        <div className="container-x py-14">
          <h2 className="font-display mb-1.5 text-center text-3xl font-semibold text-white">{t("Seni neler bekliyor?", "What's waiting for you?")}</h2>
          <p className="mx-auto mb-8 max-w-xl text-center text-moss-300">{t("Toprakla Yeniden bir topluluk. Üyeliğinle bu topluluğun tüm kapıları sana açılır.", "This is a community. Your membership opens every door in it.")}</p>
          <div className="grid gap-4 md:grid-cols-3">
            {perks.map(([ic, title, d]) => (
              <div key={title} className="rounded-[var(--radius-lg)] border border-white/12 bg-white/6 p-[22px]">
                <div className="mb-2.5 text-2xl">{ic}</div>
                <h3 className="mb-1.5 text-base font-semibold text-white">{title}</h3>
                <p className="text-sm text-moss-300">{d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center"><Link to="/kayit"><Button size="lg">{t("Topluluğa katıl", "Join the community")}</Button></Link></div>
        </div>
      </section>

      {/* Topluluktan sesler */}
      <section className="container-x py-14">
        <h2 className="font-display mb-6 text-center text-3xl font-semibold">{t("Topluluktan sesler", "Voices from the community")}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {testimonials.map((tt) => (
            <div key={tt.n} className="overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface">
              <div className="h-40 bg-cover bg-center bg-moss-300" style={{ backgroundImage: `url(${tt.photo})` }} />
              <div className="p-[18px]">
                <p className="mb-3.5 text-sm leading-relaxed text-ink-700">"{tt.q}"</p>
                <div className="text-sm font-semibold">{tt.n}</div>
                <div className="text-xs text-ink-500">{tt.r}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
