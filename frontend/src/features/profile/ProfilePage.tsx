import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { Avatar } from "@/components/ui/Avatar";
import { Stars } from "@/components/ui/Stars";
import { cn } from "@/lib/cn";
import { api, reviews as reviewsApi, activities as actApi, uploadImage } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { monthYear } from "@/lib/time";
import { HostDetailsForm } from "@/features/profile/HostDetails";
import { HostPhotos } from "@/features/profile/HostPhotos";
import { ProofUpload } from "@/features/profile/ProofUpload";
import { AvailabilityField, availabilityLabel, type Availability } from "@/features/profile/Availability";
import { VolunteerExperienceField, type VolunteerDetails } from "@/features/profile/VolunteerDetails";
import { SKILLS, INTENTS, derivedTags, intentsFromTags, labelOf as skillLabel } from "@/features/onboarding/intents";
import type { HostDetails } from "@/data/host";
import type { Axis, ActivityEligibility, MyReviewsData, Profile } from "@/lib/types";

const AXES: Axis[] = ["situation", "seek", "offer", "topic"];
type TabId = "genel" | "ilgi" | "iletisim" | "takvim" | "rehber" | "foto" | "dogrulama" | "degerlendirme";

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
  const [tab, setTab] = useState<TabId>("genel");
  const avatarInput = useRef<HTMLInputElement>(null);

  const emptyContact = { lastName: "", contactEmail: "", phone: "", employer: "", addressExact: "", instagram: "", website: "" };
  const [contact, setContact] = useState(emptyContact);
  const [cBusy, setCBusy] = useState(false);
  const [cMsg, setCMsg] = useState<string | null>(null);

  const [host, setHost] = useState<HostDetails>({});
  const [hBusy, setHBusy] = useState(false);
  const [hMsg, setHMsg] = useState<string | null>(null);

  const [availability, setAvailability] = useState<Availability>({});
  const [aBusy, setABusy] = useState(false);
  const [aMsg, setAMsg] = useState<string | null>(null);

  const [volunteer, setVolunteer] = useState<VolunteerDetails>({});
  const [skills, setSkills] = useState<Set<string>>(new Set());
  const [skillsNote, setSkillsNote] = useState("");
  const [ivBusy, setIvBusy] = useState(false);
  const [ivMsg, setIvMsg] = useState<string | null>(null);

  const [rev, setRev] = useState<MyReviewsData | null>(null);
  useEffect(() => { reviewsApi.me<MyReviewsData>().then(setRev).catch(() => {}); }, []);
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
        const prof = (data.profile ?? {}) as Record<string, unknown>;
        setHost((prof.host as HostDetails) ?? {});
        setAvailability((prof.availability as Availability) ?? {});
        setVolunteer((prof.volunteer as VolunteerDetails) ?? {});
        setSkills(new Set((prof.skills as string[]) ?? []));
        setSkillsNote((prof.skillsNote as string) ?? "");
      })
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  const mergeProfile = (patch: Record<string, unknown>) => ({ ...((p?.profile ?? {}) as Record<string, unknown>), ...patch });

  async function saveContact(e: React.FormEvent) {
    e.preventDefault(); setCBusy(true); setCMsg(null);
    try {
      await api.put("/profile", {
        lastName: contact.lastName || undefined, contactEmail: contact.contactEmail || undefined,
        phone: contact.phone || undefined, employer: contact.employer || undefined,
        addressExact: contact.addressExact || undefined,
        socials: { instagram: contact.instagram, website: contact.website },
      });
      api.invalidate("/profile/me"); setCMsg(t("Kaydedildi.", "Saved."));
    } catch (e) { setCMsg(e instanceof Error ? e.message : t("Kaydedilemedi.", "Couldn't save.")); } finally { setCBusy(false); }
  }
  async function saveHost() {
    setHBusy(true); setHMsg(null);
    try { await api.put("/profile", { profile: mergeProfile({ host }) }); api.invalidate("/profile/me"); setHMsg(t("Kaydedildi.", "Saved.")); }
    catch (e) { setHMsg(e instanceof Error ? e.message : t("Kaydedilemedi.", "Couldn't save.")); } finally { setHBusy(false); }
  }
  async function saveAvailability() {
    setABusy(true); setAMsg(null);
    try { await api.put("/profile", { profile: mergeProfile({ availability }) }); api.invalidate("/profile/me"); setAMsg(t("Kaydedildi.", "Saved.")); }
    catch (e) { setAMsg(e instanceof Error ? e.message : t("Kaydedilemedi.", "Couldn't save.")); } finally { setABusy(false); }
  }
  async function saveInterests() {
    setIvBusy(true); setIvMsg(null);
    try {
      await api.put("/profile", { profile: mergeProfile({ skills: [...skills], skillsNote: skillsNote.trim(), ...(volunteer.experience ? { volunteer } : {}) }) });
      api.invalidate("/profile/me"); setIvMsg(t("Kaydedildi.", "Saved."));
    } catch (e) { setIvMsg(e instanceof Error ? e.message : t("Kaydedilemedi.", "Couldn't save.")); } finally { setIvBusy(false); }
  }
  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return; setBusy(true);
    try { const key = await uploadImage(file, "avatar"); await api.put("/profile", { avatarKey: key }); api.invalidate(); load(); }
    catch (e) { alert(e instanceof Error ? e.message : t("Yükleme hatası", "Upload error")); }
    finally { setBusy(false); if (avatarInput.current) avatarInput.current.value = ""; }
  }

  if (loading) return <div className="py-16 text-center text-ink-500">{t("Yükleniyor…", "Loading…")}</div>;
  if (err) return <div className="py-16 text-center text-ink-700">{t("Profil yüklenemedi:", "Couldn't load profile:")} {err}</div>;
  if (!p) return null;

  const isPlaceOwner = p.tags.some((tg) => tg.axis === "situation" && tg.value === "farm-owner");
  const wantsVolunteers = p.tags.some((tg) => (tg.axis === "seek" && tg.value === "volunteers") || (tg.axis === "offer" && tg.value === "place-experience"));
  const isVolunteer = p.tags.some((tg) => (tg.axis === "offer" && tg.value === "volunteer-labor") || (tg.axis === "situation" && tg.value === "seeking-experience") || (tg.axis === "seek" && tg.value === "hosting"));

  const TABS: { id: TabId; label: string }[] = [
    { id: "genel", label: t("Genel", "Overview") },
    { id: "ilgi", label: t("İlgi & beceri", "Interests & skills") },
    { id: "iletisim", label: t("İletişim", "Contact") },
    ...(wantsVolunteers || isVolunteer ? [{ id: "takvim" as TabId, label: t("Takvim", "Calendar") }] : []),
    ...(wantsVolunteers ? [{ id: "rehber" as TabId, label: t("Çiftlik rehberi", "Farm guide") }] : []),
    { id: "foto", label: t("Fotoğraflar", "Photos") },
    ...(isPlaceOwner ? [{ id: "dogrulama" as TabId, label: t("Doğrulama", "Verification") }] : []),
  ];
  const activeTab = TABS.some((x) => x.id === tab) ? tab : "genel";

  return (
    <div className="max-w-3xl">
      {p.status === "onboarding" && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-[#ecd9a8] bg-[#f7edd6] px-4 py-3 text-sm text-[#8a6015]">
          <span>{t("Profilin henüz tamamlanmadı.", "Your profile isn't finished yet.")}</span>
          <Link to="/onboarding"><Button size="sm">{t("Tamamla", "Finish")}</Button></Link>
        </div>
      )}

      {/* Başlık */}
      <div className="mb-5 flex items-center gap-4">
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
              <Stars value={rev.received.summary.avg} /><span className="font-semibold">{rev.received.summary.avg}</span>
              <span className="text-ink-500">({rev.received.summary.count} {t("değerlendirme", "reviews")})</span>
            </div>
          )}
        </div>
      </div>

      {/* Sekmeler */}
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((x) => (
          <button key={x.id} onClick={() => setTab(x.id)}
            className={cn("-mb-px whitespace-nowrap border-b-2 px-3.5 py-2 text-sm font-medium transition",
              activeTab === x.id ? "border-forest-600 text-forest-700" : "border-transparent text-ink-500 hover:text-ink-700")}>
            {x.label}
          </button>
        ))}
      </div>

      {/* --- Genel --- */}
      {activeTab === "genel" && (
        <>
          <Block title={t("Hakkımda", "About me")}>
            {p.bio ? <p className="text-sm text-ink-700">{p.bio}</p> : <p className="text-sm text-ink-400">{t("Henüz tanıtım eklenmedi. Onboarding'den düzenleyebilirsin.", "No intro yet.")}</p>}
          </Block>
          <MyReviews data={rev} />
          <ActivityEligibilityCard elig={elig} />
        </>
      )}

      {/* --- İlgi & beceri --- */}
      {activeTab === "ilgi" && (
        <>
          <IntentEditor tags={p.tags} onSaved={load} />
          {AXES.map((axis) => {
            const tags = p.tags.filter((tg) => tg.axis === axis);
            if (tags.length === 0) return null;
            return (
              <Block key={axis} title={AXIS_LABEL[axis]}>
                <div className="flex flex-wrap gap-2">{tags.map((tg) => <Tag key={tg.value} axis={tg.axis}>{lang === "en" ? tg.labelEn : tg.labelTr}</Tag>)}</div>
              </Block>
            );
          })}
          {isVolunteer && (
            <Block title={t("🌱 Gönüllü bilgisi", "🌱 Volunteer info")}>
              <p className="mb-3 text-xs text-ink-500">{t("Ev sahipleri için görünür; uygun eşleşmeyi bulmaya yardımcı olur.", "Shown to hosts; helps find the right match.")}</p>
              <VolunteerExperienceField value={volunteer} onChange={setVolunteer} />
            </Block>
          )}
          <Block title={t("Beceriler", "Skills")}>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map((s) => {
                const on = skills.has(s.key);
                return (
                  <button key={s.key} type="button" onClick={() => { const n = new Set(skills); n.has(s.key) ? n.delete(s.key) : n.add(s.key); setSkills(n); }}
                    className={cn("rounded-full border px-3 py-1.5 text-[13.5px] transition", on ? "border-forest-600 bg-forest-600 text-white" : "border-border-strong bg-surface hover:border-forest-500")}>
                    {skillLabel(SKILLS, s.key, lang)}
                  </button>
                );
              })}
            </div>
            <label className="mt-4 block text-sm">
              <span className="mb-1 block font-medium text-ink-700">{t("Listede olmayan bir şey mi var?", "Something not in the list?")}</span>
              <textarea className={cinp + " resize-y"} rows={2} value={skillsNote} onChange={(e) => setSkillsNote(e.target.value)} placeholder={t("Kısaca ekle…", "Add briefly…")} />
            </label>
            <div className="mt-4 flex items-center gap-3">
              <Button size="sm" disabled={ivBusy} onClick={saveInterests}>{ivBusy ? t("Kaydediliyor…", "Saving…") : t("Kaydet", "Save")}</Button>
              {ivMsg && <span className="text-sm text-ink-600">{ivMsg}</span>}
            </div>
          </Block>
        </>
      )}

      {/* --- İletişim --- */}
      {activeTab === "iletisim" && (
        <>
          <Block title={t("İletişim bilgileri", "Contact details")}>
            <p className="mb-3 text-xs text-ink-500">{t("Bu bilgiler yalnızca bir bağlantı isteğini karşılıklı kabul ettiğin kişilere görünür.", "These details are visible only to people whose connection you've mutually accepted.")}</p>
            <form onSubmit={saveContact} className="grid gap-3 sm:grid-cols-2">
              <CField label={t("Soyad", "Last name")} value={contact.lastName} onChange={(v) => setContact({ ...contact, lastName: v })} />
              <CField label={t("İletişim e-postası", "Contact email")} type="email" value={contact.contactEmail} onChange={(v) => setContact({ ...contact, contactEmail: v })} />
              <CField label={t("Telefon", "Phone")} value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} />
              <CField label={t("İş yeri / çiftlik", "Workplace / farm")} value={contact.employer} onChange={(v) => setContact({ ...contact, employer: v })} />
              <CField label="Instagram" value={contact.instagram} onChange={(v) => setContact({ ...contact, instagram: v })} placeholder={t("@kullanici", "@handle")} />
              <CField label={t("Web sitesi", "Website")} value={contact.website} onChange={(v) => setContact({ ...contact, website: v })} placeholder="https://" />
              <div className="sm:col-span-2"><CField label={t("Adres", "Address")} value={contact.addressExact} onChange={(v) => setContact({ ...contact, addressExact: v })} /></div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <Button type="submit" size="sm" disabled={cBusy}>{cBusy ? t("Kaydediliyor…", "Saving…") : t("Kaydet", "Save")}</Button>
                {cMsg && <span className="text-sm text-ink-600">{cMsg}</span>}
              </div>
            </form>
          </Block>
          <div className="mt-2 rounded-lg border border-[#c4dde5] bg-[#e0edf1] px-4 py-3 text-sm text-[#2c5462]">
            {t("👁️ Bağlantı öncesi başkaları yalnızca adını, şehrini/ülkeni, fotoğraflarını ve etiketlerini görür. İletişim bilgilerin gizli kalır.", "👁️ Before connecting, others see only your name, city/country, photos and tags. Your contact details stay private.")}
          </div>
        </>
      )}

      {/* --- Takvim --- */}
      {activeTab === "takvim" && (
        <Block title={t("📅 Takvim / müsaitlik", "📅 Calendar / availability")}>
          <p className="mb-3 text-xs text-ink-500">{t("Opsiyonel ama eşleşme için çok yardımcı olur. Profilinde görünür.", "Optional but very helpful for matching. Shown on your profile.")}</p>
          <AvailabilityField value={availability} onChange={setAvailability} label={availabilityLabel(wantsVolunteers, isVolunteer, t)} />
          <div className="mt-4 flex items-center gap-3">
            <Button size="sm" disabled={aBusy} onClick={saveAvailability}>{aBusy ? t("Kaydediliyor…", "Saving…") : t("Kaydet", "Save")}</Button>
            {aMsg && <span className="text-sm text-ink-600">{aMsg}</span>}
          </div>
        </Block>
      )}

      {/* --- Çiftlik rehberi --- */}
      {activeTab === "rehber" && (
        <Block title={t("Çiftlik rehberi (konaklama & ağırlama)", "Farm guide (accommodation & hosting)")}>
          <p className="mb-3 text-xs text-ink-500">{t("Yer sunuyorsun — bu bilgiler profilinde herkese görünür ve gönüllülerin karar vermesine yardımcı olur.", "You offer a place — these show publicly and help volunteers decide.")}</p>
          <HostDetailsForm value={host} onChange={setHost} />
          <div className="mt-4 flex items-center gap-3">
            <Button size="sm" disabled={hBusy} onClick={saveHost}>{hBusy ? t("Kaydediliyor…", "Saving…") : t("Kaydet", "Save")}</Button>
            {hMsg && <span className="text-sm text-ink-600">{hMsg}</span>}
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <h3 className="font-display mb-2 text-[15px] font-semibold text-forest-700">{t("📸 Ağırlama fotoğrafları", "📸 Accommodation photos")}</h3>
            <HostPhotos photos={p.photos ?? []} onChange={load} />
          </div>
        </Block>
      )}

      {/* --- Fotoğraflar (genel) --- */}
      {activeTab === "foto" && (
        <Block title={t("Fotoğraflarım", "My photos")}>
          <p className="mb-3 text-xs text-ink-500">{t("Profilini güzel gösteren fotoğraflar — kendinden, deneyimlerinden. Herkese açık profilinde görünür.", "Photos that make your profile shine. Shown on your public profile.")}</p>
          <HostPhotos photos={p.photos ?? []} onChange={load} generalOnly />
        </Block>
      )}

      {/* --- Doğrulama --- */}
      {activeTab === "dogrulama" && (
        <Block title={t("📍 Adres doğrulama", "📍 Address verification")}>
          <p className="mb-3 text-[13px] text-ink-500">
            {t("Açık adresini \"İletişim\" sekmesine gir (yalnızca bağlantılarınla paylaşılır). Ardından bir adres kanıtı belgesi (fatura, tapu, kira sözleşmesi) yükle — profilinde görünmez, yalnızca ekip doğrulama için görür. Belge zorunlu değil; onayda gerekirse istenir.",
               "Enter your full address in the \"Contact\" tab (shared only with your connections). Then upload a proof-of-address document (utility bill, deed, rental contract) — it never shows on your profile, only the team sees it. The document isn't required; it may be requested during review.")}
          </p>
          <ProofUpload done={!!p.proofAddress} onChange={load} />
        </Block>
      )}
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

function MyReviews({ data }: { data: MyReviewsData | null }) {
  const { t } = useI18n();
  const REVIEW_STATE = reviewState(t);
  const [tab, setTab] = useState<"received" | "written">("received");
  if (!data) return null;

  const received = data.received.reviews;
  const written = data.written;
  const list = tab === "received" ? received : written;

  const TabBtn = ({ id, label }: { id: "received" | "written"; label: string }) => (
    <button type="button" onClick={() => setTab(id)}
      className={`rounded-full px-3 py-1.5 text-[13px] font-medium transition ${tab === id ? "bg-forest-600 text-white" : "text-ink-700 hover:bg-sand-100"}`}>{label}</button>
  );

  return (
    <Block title={t("Değerlendirmelerim", "My reviews")}>
      {data.received.summary.count > 0 && (
        <div className="mb-3 flex items-center gap-2 text-sm text-ink-600">
          <Stars value={data.received.summary.avg} className="text-base" /><span className="font-semibold">{data.received.summary.avg}</span>
          <span className="text-ink-500">/ 5 · {data.received.summary.count} {t("değerlendirme", "reviews")}</span>
        </div>
      )}
      <div className="mb-4 flex gap-1.5">
        <TabBtn id="received" label={`${t("Hakkımdaki", "About me")} (${received.length})`} />
        <TabBtn id="written" label={`${t("Yazdıklarım", "Written by me")} (${written.length})`} />
      </div>
      {tab === "received" && data.pendingReceived > 0 && (
        <div className="mb-3 rounded-lg border border-[#c4dde5] bg-[#e0edf1] px-3 py-2 text-[13px] text-[#2c5462]">
          {t(`🔒 ${data.pendingReceived} değerlendirme seni bekliyor. Değerlendirmeler karşılıklı; sen de ilgili kişiyi değerlendirince (ya da 15 gün sonra) görünür olacaklar.`,
             `🔒 ${data.pendingReceived} review(s) are waiting for you. Reviews are mutual; they'll appear once you review the other person too (or after 15 days).`)}
        </div>
      )}
      {list.length === 0 ? (
        <p className="text-sm text-ink-500">{tab === "received" ? t("Henüz görünür bir değerlendirmen yok.", "You have no visible reviews yet.") : t("Henüz kimseyi değerlendirmedin.", "You haven't reviewed anyone yet.")}</p>
      ) : (
        <div className="space-y-3">
          {tab === "received"
            ? received.map((r, i) => (
                <div key={i} className="flex gap-3">
                  <Link to={`/app/uye/${r.reviewer.id}`} className="shrink-0"><Avatar url={r.reviewer.avatarUrl} className="size-9" /></Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link to={`/app/uye/${r.reviewer.id}`} className="text-sm font-semibold hover:underline">{r.reviewer.firstName ?? t("Bir üye", "A member")}</Link>
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
                      <Link to={`/app/uye/${r.reviewee.id}`} className="text-sm font-semibold hover:underline">{r.reviewee.firstName ?? t("Bir üye", "A member")}</Link>
                      <Stars value={r.rating} />
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${REVIEW_STATE[r.state]?.cls ?? ""}`}>{REVIEW_STATE[r.state]?.label ?? r.state}</span>
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

function ActivityEligibilityCard({ elig }: { elig: ActivityEligibility | null }) {
  const { t } = useI18n();
  if (!elig || elig.isAdmin) return null;
  return (
    <Block title={t("Aktivite paylaşımı", "Sharing activities")}>
      {elig.canSubmit ? (
        <p className="text-sm text-forest-700">{t("✓ Koşulları sağlıyorsun — Aktiviteler sayfasından paylaşım yapabilirsin.", "✓ You meet the requirements — you can post from the Activities page.")}</p>
      ) : (
        <>
          <p className="mb-2 text-sm text-ink-600">{t("Aktivite paylaşabilmek için:", "To share activities:")}</p>
          <ul className="ml-4 list-disc space-y-0.5 text-sm">
            <li className={elig.connections >= elig.need.connections ? "text-forest-600" : "text-ink-700"}>{t(`En az ${elig.need.connections} bağlantı — sende ${elig.connections}`, `At least ${elig.need.connections} connections — you have ${elig.connections}`)}</li>
            <li className={elig.ratingAvg >= elig.need.rating ? "text-forest-600" : "text-ink-700"}>{t(`En az ${elig.need.rating.toFixed(1)} ortalama puan — sende ${elig.ratingAvg}`, `At least ${elig.need.rating.toFixed(1)} average rating — you have ${elig.ratingAvg}`)}</li>
            <li className={elig.ratingCount >= elig.need.reviews ? "text-forest-600" : "text-ink-700"}>{t(`En az ${elig.need.reviews} değerlendirme — sende ${elig.ratingCount}`, `At least ${elig.need.reviews} reviews — you have ${elig.ratingCount}`)}</li>
          </ul>
        </>
      )}
    </Block>
  );
}

// Onboarding sonrası niyet düzenleme — "gönüllü ağırlamak"ı sonradan açabilir.
// Yer sahibi olmak profili adres/mekân doğrulaması için tekrar incelemeye düşürür.
function IntentEditor({ tags, onSaved }: { tags: { axis: Axis; value: string }[]; onSaved: () => void }) {
  const { t, lang } = useI18n();
  const init = intentsFromTags(tags);
  const [sel, setSel] = useState<Set<string>>(init.intents);
  const [hasPlace, setHasPlace] = useState(init.hasPlace);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const toggle = (k: string) => { const n = new Set(sel); n.has(k) ? n.delete(k) : n.add(k); setSel(n); setMsg(null); };
  // "Gönüllü ağırlamak" seçmek yer sahibi olmayı gerektirir → otomatik işaretlenir.
  const effectiveHasPlace = hasPlace || sel.has("host");

  async function save() {
    const derived = derivedTags(sel, effectiveHasPlace);
    if (derived.length === 0) { setMsg(t("En az bir niyet seç.", "Pick at least one intent.")); return; }
    setBusy(true); setMsg(null);
    try {
      const r = await api.post<{ written: number; review: boolean }>("/profile/intents", { tags: derived });
      api.invalidate();
      onSaved();
      setMsg(r.review
        ? t("Kaydedildi. Yer sahibi olarak eklendiğin için profilin adres/mekân doğrulaması amacıyla tekrar incelemeye alındı — onaylanınca Keşfet'te host olarak görünürsün.",
            "Saved. Since you've added hosting, your profile is back in review for address/place verification — once approved you'll appear as a host in Discover.")
        : t("Kaydedildi.", "Saved."));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("Kaydedilemedi.", "Couldn't save."));
    } finally { setBusy(false); }
  }

  return (
    <Block title={t("Ne için buradasın?", "Why are you here?")}>
      <p className="mb-3 text-xs text-ink-500">{t("Birden fazla seçebilirsin. Değiştirince profilin ve eşleşmelerin buna göre güncellenir.", "Pick as many as apply. Changing this updates your profile and matches.")}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {INTENTS.map((it) => {
          const on = sel.has(it.key);
          return (
            <button key={it.key} type="button" onClick={() => toggle(it.key)}
              className={cn("flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm transition",
                on ? "border-forest-600 bg-forest-600/5" : "border-border-strong bg-surface hover:border-forest-500")}>
              <span className="text-lg">{it.icon}</span>
              <span className={cn("font-medium", on ? "text-forest-700" : "text-ink-700")}>{lang === "en" ? it.en : it.tr}</span>
              {on && <span className="ml-auto text-forest-600">✓</span>}
            </button>
          );
        })}
      </div>

      <label className={cn("mt-3 flex items-center gap-2 text-sm", sel.has("host") && "opacity-70")}>
        <input type="checkbox" checked={effectiveHasPlace} disabled={sel.has("host")}
          onChange={(e) => setHasPlace(e.target.checked)} />
        <span>{t("Bir yerim/çiftliğim var", "I have a place/farm")}</span>
      </label>
      {sel.has("host") && (
        <p className="mt-1 text-xs text-ink-500">{t("\"Gönüllü ağırlamak\" seçtiğin için yer sahipliği otomatik işaretlendi.", "\"Host volunteers\" requires a place, so this was set automatically.")}</p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Button size="sm" disabled={busy} onClick={save}>{busy ? t("Kaydediliyor…", "Saving…") : t("Kaydet", "Save")}</Button>
        {msg && <span className="text-sm text-ink-600">{msg}</span>}
      </div>
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
