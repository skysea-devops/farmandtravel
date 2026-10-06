import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Avatar } from "@/components/ui/Avatar";
import { Stars } from "@/components/ui/Stars";
import { api, reviews as reviewsApi, activities as actApi, uploadImage } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { monthYear } from "@/lib/time";
import type { Axis, ActivityEligibility, MyReviewsData, Photo, Profile } from "@/lib/types";

const AXES: Axis[] = ["situation", "seek", "offer", "topic"];

export function ProfilePage() {
  const { t, lang } = useI18n();
  const AXIS_LABEL: Record<Axis, string> = {
    situation: t("Durumum", "My situation"), seek: t("Aradıklarım", "What I'm looking for"),
    offer: t("Sunduklarım", "What I offer"), topic: t("İlgi alanlarım", "My interests"),
  };
  const [p, setP] = useState<Profile | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  // Editable private contact details (revealed only on an accepted connection).
  const emptyContact = { lastName: "", contactEmail: "", phone: "", employer: "", addressExact: "", instagram: "", website: "" };
  const [contact, setContact] = useState(emptyContact);
  const [cBusy, setCBusy] = useState(false);
  const [cMsg, setCMsg] = useState<string | null>(null);

  // My reviews: received (drives the rating by my name) + written.
  const [rev, setRev] = useState<MyReviewsData | null>(null);
  useEffect(() => { reviewsApi.me<MyReviewsData>().then(setRev).catch(() => {}); }, []);

  // Activity-sharing eligibility (personal progress lives here, not on the public page).
  const [elig, setElig] = useState<ActivityEligibility | null>(null);
  useEffect(() => { actApi.eligibility<ActivityEligibility>().then(setElig).catch(() => {}); }, []);

  function load() {
    api.getCached<Profile>("/profile/me")
      .then((data) => {
        setP(data);
        const s = (data.socials ?? {}) as Record<string, string>;
        setContact({
          lastName: data.lastName ?? "", contactEmail: data.contactEmail ?? "", phone: data.phone ?? "",
          employer: data.employer ?? "", addressExact: data.addressExact ?? "",
          instagram: s.instagram ?? "", website: s.website ?? "",
        });
      })
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function saveContact(e: React.FormEvent) {
    e.preventDefault();
    setCBusy(true); setCMsg(null);
    try {
      await api.put("/profile", {
        lastName: contact.lastName || undefined,
        contactEmail: contact.contactEmail || undefined,
        phone: contact.phone || undefined,
        employer: contact.employer || undefined,
        addressExact: contact.addressExact || undefined,
        socials: { instagram: contact.instagram, website: contact.website },
      });
      api.invalidate("/profile/me");
      setCMsg(t("Kaydedildi.", "Saved."));
    } catch (e) {
      setCMsg(e instanceof Error ? e.message : t("Kaydedilemedi.", "Couldn't save."));
    } finally {
      setCBusy(false);
    }
  }

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const key = await uploadImage(file, "avatar");
      await api.put("/profile", { avatarKey: key });
      api.invalidate();
      load();
    } catch (e) { alert(e instanceof Error ? e.message : t("Yükleme hatası", "Upload error")); }
    finally { setBusy(false); if (avatarInput.current) avatarInput.current.value = ""; }
  }

  async function onGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setBusy(true);
    try {
      for (const file of files) {
        const key = await uploadImage(file, "gallery");
        await api.post("/profile/photos", { key });
      }
      api.invalidate();
      load();
    } catch (e) { alert(e instanceof Error ? e.message : t("Yükleme hatası", "Upload error")); }
    finally { setBusy(false); if (galleryInput.current) galleryInput.current.value = ""; }
  }

  async function removePhoto(id: string) {
    setBusy(true);
    try { await api.del(`/profile/photos/${id}`); api.invalidate(); load(); }
    catch (e) { alert(e instanceof Error ? e.message : t("Silme hatası", "Delete error")); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="py-16 text-center text-ink-500">{t("Yükleniyor…", "Loading…")}</div>;
  if (err) return <div className="py-16 text-center text-ink-700">{t("Profil yüklenemedi:", "Couldn't load profile:")} {err}</div>;
  if (!p) return null;

  const photos = p.photos ?? [];

  return (
    <div className="max-w-3xl">
      {p.status === "onboarding" && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-[#ecd9a8] bg-[#f7edd6] px-4 py-3 text-sm text-[#8a6015]">
          <span>{t("Profilin henüz tamamlanmadı.", "Your profile isn't finished yet.")}</span>
          <Link to="/onboarding"><Button size="sm">{t("Tamamla", "Finish")}</Button></Link>
        </div>
      )}

      <div className="mb-6 flex items-center gap-4">
        <div className="relative">
          <Avatar url={p.avatarUrl} className="size-20" />
          <button onClick={() => avatarInput.current?.click()} disabled={busy}
            className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full border border-border bg-surface text-sm shadow-sm hover:bg-sand-100"
            title={t("Profil fotoğrafı değiştir", "Change profile photo")}>📷</button>
          <input ref={avatarInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onAvatar} />
        </div>
        <div>
          <h1 className="font-display text-2xl font-semibold">{p.firstName ?? t("İsimsiz", "Unnamed")}</h1>
          <div className="text-sm text-ink-500">{[p.city, p.country].filter(Boolean).join(", ") || t("Konum eklenmedi", "No location")}{p.headline ? ` · ${p.headline}` : ""}</div>
          {p.joinedAt && <div className="mt-0.5 text-xs text-ink-400">🗓️ {t("Üye:", "Member since")} {monthYear(p.joinedAt, lang)}</div>}
          {rev && rev.received.summary.count > 0 && (
            <div className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-600">
              <Stars value={rev.received.summary.avg} />
              <span className="font-semibold">{rev.received.summary.avg}</span>
              <span className="text-ink-500">({rev.received.summary.count} {t("değerlendirme", "reviews")})</span>
            </div>
          )}
        </div>
      </div>

      {p.bio && <Block title={t("Hakkımda", "About me")}><p className="text-sm text-ink-700">{p.bio}</p></Block>}

      <Block title={t("Fotoğraflarım", "My photos")}>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((ph: Photo) => (
            <div key={ph.id} className="group relative aspect-square overflow-hidden rounded-lg bg-sand-100">
              {ph.url && <img src={ph.url} alt="" className="h-full w-full object-cover" />}
              <button onClick={() => removePhoto(ph.id)} disabled={busy}
                className="absolute right-1 top-1 hidden size-6 place-items-center rounded-full bg-black/50 text-xs text-white group-hover:grid"
                title={t("Sil", "Delete")}>✕</button>
            </div>
          ))}
          {photos.length < 12 && (
            <button onClick={() => galleryInput.current?.click()} disabled={busy}
              className="grid aspect-square place-items-center rounded-lg border-2 border-dashed border-border-strong text-ink-500 hover:border-forest-500 hover:text-forest-600">
              <span className="text-center text-xs">{busy ? "…" : t("+ Fotoğraf", "+ Photo")}</span>
            </button>
          )}
        </div>
        <input ref={galleryInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={onGallery} />
        <p className="mt-2 text-xs text-ink-500">{t("Çiftliğinden, projenden ya da kendinden fotoğraflar ekle (en fazla 12).", "Add photos of your farm, project or yourself (up to 12).")}</p>
      </Block>

      {AXES.map((axis) => {
        const tags = p.tags.filter((tg) => tg.axis === axis);
        if (tags.length === 0) return null;
        return (
          <Block key={axis} title={AXIS_LABEL[axis]}>
            <div className="flex flex-wrap gap-2">{tags.map((tg) => <Tag key={tg.value} axis={tg.axis}>{lang === "en" ? tg.labelEn : tg.labelTr}</Tag>)}</div>
          </Block>
        );
      })}

      <MyReviews data={rev} />

      <ActivityEligibilityCard elig={elig} />

      <Block title={t("İletişim bilgileri", "Contact details")}>
        <p className="mb-3 text-xs text-ink-500">{t("Bu bilgiler yalnızca bir bağlantı isteğini karşılıklı kabul ettiğin kişilere görünür.", "These details are visible only to people whose connection you've mutually accepted.")}</p>
        <form onSubmit={saveContact} className="grid gap-3 sm:grid-cols-2">
          <CField label={t("Soyad", "Last name")} value={contact.lastName} onChange={(v) => setContact({ ...contact, lastName: v })} />
          <CField label={t("İletişim e-postası", "Contact email")} type="email" value={contact.contactEmail} onChange={(v) => setContact({ ...contact, contactEmail: v })} />
          <CField label={t("Telefon", "Phone")} value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} />
          <CField label={t("İş yeri / çiftlik", "Workplace / farm")} value={contact.employer} onChange={(v) => setContact({ ...contact, employer: v })} />
          <CField label="Instagram" value={contact.instagram} onChange={(v) => setContact({ ...contact, instagram: v })} placeholder={t("@kullanici", "@handle")} />
          <CField label={t("Web sitesi", "Website")} value={contact.website} onChange={(v) => setContact({ ...contact, website: v })} placeholder="https://" />
          <div className="sm:col-span-2">
            <CField label={t("Adres", "Address")} value={contact.addressExact} onChange={(v) => setContact({ ...contact, addressExact: v })} />
          </div>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit" size="sm" disabled={cBusy}>{cBusy ? t("Kaydediliyor…", "Saving…") : t("Kaydet", "Save")}</Button>
            {cMsg && <span className="text-sm text-ink-600">{cMsg}</span>}
          </div>
        </form>
      </Block>

      <div className="mt-2 rounded-lg border border-[#c4dde5] bg-[#e0edf1] px-4 py-3 text-sm text-[#2c5462]">
        {t("👁️ Bağlantı öncesi başkaları yalnızca adını, şehrini/ülkeni, fotoğraflarını ve etiketlerini görür. İletişim bilgilerin gizli kalır.", "👁️ Before connecting, others see only your name, city/country, photos and tags. Your contact details stay private.")}
      </div>
    </div>
  );
}

const cinp = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600";
function CField({ label, value, onChange, type, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-ink-700">{label}</span>
      <input type={type ?? "text"} className={cinp} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

const reviewState = (t: (tr: string, en: string) => string): Record<string, { label: string; cls: string }> => ({
  published: { label: t("Yayında", "Published"), cls: "bg-moss-500/15 text-forest-700" },
  pending: { label: t("Karşı taraf değerlendirince görünür", "Visible once they review you"), cls: "bg-sand-100 text-ink-600" },
  held: { label: t("Admin onayında", "Awaiting admin review"), cls: "bg-clay-500/15 text-clay-600" },
  rejected: { label: t("Yayınlanmadı", "Not published"), cls: "bg-sand-100 text-ink-400" },
  removed: { label: t("Kaldırıldı", "Removed"), cls: "bg-sand-100 text-ink-400" },
});

// My reviews on my own profile: "Hakkımdaki" (received) + "Yazdıklarım" (written),
// as two tabs — the pattern Airbnb / Couchsurfing / Workaway use on your own page.
function MyReviews({ data }: { data: MyReviewsData | null }) {
  const { t } = useI18n();
  const REVIEW_STATE = reviewState(t);
  const [tab, setTab] = useState<"received" | "written">("received");
  if (!data) return null;

  const received = data.received.reviews;
  const written = data.written;
  const list = tab === "received" ? received : written;

  const TabBtn = ({ id, label }: { id: "received" | "written"; label: string }) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
        tab === id ? "bg-forest-600 text-white" : "text-ink-700 hover:bg-sand-100"
      }`}
    >
      {label}
    </button>
  );

  return (
    <Block title={t("Değerlendirmelerim", "My reviews")}>
      {data.received.summary.count > 0 && (
        <div className="mb-3 flex items-center gap-2 text-sm text-ink-600">
          <Stars value={data.received.summary.avg} className="text-base" />
          <span className="font-semibold">{data.received.summary.avg}</span>
          <span className="text-ink-500">/ 5 · {data.received.summary.count} {t("değerlendirme", "reviews")}</span>
        </div>
      )}

      <div className="mb-4 flex gap-1.5">
        <TabBtn id="received" label={`${t("Hakkımdaki", "About me")} (${received.length})`} />
        <TabBtn id="written" label={`${t("Yazdıklarım", "Written by me")} (${written.length})`} />
      </div>

      {tab === "received" && data.pendingReceived > 0 && (
        <div className="mb-3 rounded-lg border border-[#c4dde5] bg-[#e0edf1] px-3 py-2 text-[13px] text-[#2c5462]">
          {t(
            `🔒 ${data.pendingReceived} değerlendirme seni bekliyor. Değerlendirmeler karşılıklı; sen de ilgili kişiyi değerlendirince (ya da 15 gün sonra) görünür olacaklar.`,
            `🔒 ${data.pendingReceived} review(s) are waiting for you. Reviews are mutual; they'll appear once you review the other person too (or after 15 days).`,
          )}
        </div>
      )}

      {list.length === 0 ? (
        <p className="text-sm text-ink-500">
          {tab === "received" ? t("Henüz görünür bir değerlendirmen yok.", "You have no visible reviews yet.") : t("Henüz kimseyi değerlendirmedin.", "You haven't reviewed anyone yet.")}
        </p>
      ) : (
        <div className="space-y-3">
          {tab === "received"
            ? received.map((r, i) => (
                <div key={i} className="flex gap-3">
                  <Avatar url={r.reviewer.avatarUrl} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{r.reviewer.firstName ?? t("Bir üye", "A member")}</span>
                      <Stars value={r.rating} />
                    </div>
                    {r.comment && <p className="text-sm text-ink-700">{r.comment}</p>}
                  </div>
                </div>
              ))
            : written.map((r, i) => (
                <div key={i} className="flex gap-3">
                  <Avatar url={r.reviewee.avatarUrl} className="size-9" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/app/uye/${r.reviewee.id}`} className="text-sm font-semibold hover:underline">
                        {r.reviewee.firstName ?? t("Bir üye", "A member")}
                      </Link>
                      <Stars value={r.rating} />
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${REVIEW_STATE[r.state]?.cls ?? ""}`}>
                        {REVIEW_STATE[r.state]?.label ?? r.state}
                      </span>
                    </div>
                    {r.comment && <p className="text-sm text-ink-700">{r.comment}</p>}
                  </div>
                </div>
              ))}
        </div>
      )}
    </Block>
  );
}

// Personal activity-sharing progress (moved here from the public Aktiviteler page).
function ActivityEligibilityCard({ elig }: { elig: ActivityEligibility | null }) {
  const { t } = useI18n();
  if (!elig) return null;
  if (elig.isAdmin) return null; // admins zaten doğrudan paylaşır
  return (
    <Block title={t("Aktivite paylaşımı", "Sharing activities")}>
      {elig.canSubmit ? (
        <p className="text-sm text-forest-700">{t("✓ Koşulları sağlıyorsun — Aktiviteler sayfasından paylaşım yapabilirsin.", "✓ You meet the requirements — you can post from the Activities page.")}</p>
      ) : (
        <>
          <p className="mb-2 text-sm text-ink-600">{t("Aktivite paylaşabilmek için:", "To share activities:")}</p>
          <ul className="ml-4 list-disc space-y-0.5 text-sm">
            <li className={elig.connections >= elig.need.connections ? "text-forest-600" : "text-ink-700"}>
              {t(`En az ${elig.need.connections} bağlantı — sende ${elig.connections}`, `At least ${elig.need.connections} connections — you have ${elig.connections}`)}
            </li>
            <li className={elig.ratingAvg >= elig.need.rating ? "text-forest-600" : "text-ink-700"}>
              {t(`En az ${elig.need.rating.toFixed(1)} ortalama puan — sende ${elig.ratingAvg}`, `At least ${elig.need.rating.toFixed(1)} average rating — you have ${elig.ratingAvg}`)}
            </li>
            <li className={elig.ratingCount >= elig.need.reviews ? "text-forest-600" : "text-ink-700"}>
              {t(`En az ${elig.need.reviews} değerlendirme — sende ${elig.ratingCount}`, `At least ${elig.need.reviews} reviews — you have ${elig.ratingCount}`)}
            </li>
          </ul>
        </>
      )}
    </Block>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-[var(--radius-lg)] border border-border bg-surface p-5">
      <h2 className="mb-2.5 text-[15px] font-semibold">{title}</h2>
      {children}
    </div>
  );
}
