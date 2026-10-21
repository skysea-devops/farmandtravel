import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { api, uploadImage } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { Check, Sprout, Lock, Camera, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { INTENT_ICONS, DomainIcon } from "@/lib/icons";
import { HostDetailsForm } from "@/features/profile/HostDetails";
import { HostPhotos } from "@/features/profile/HostPhotos";
import { ProofUpload } from "@/features/profile/ProofUpload";
import { AvailabilityField, availabilityEmpty, availabilityLabel, type Availability } from "@/features/profile/Availability";
import { VolunteerExperienceField, type VolunteerDetails } from "@/features/profile/VolunteerDetails";
import { countryNames } from "@/data/countries";
import type { HostDetails } from "@/data/host";
import { HOST_PHOTO_CATEGORIES } from "@/data/host";
import type { Photo, Profile } from "@/lib/types";
import { INTENTS, PLACE_TYPES, SKILLS, derivedTags, flags } from "./intents";

interface Place { name?: string; type?: string; location?: string }

export function OnboardingPage() {
  const nav = useNavigate();
  const { t, lang } = useI18n();

  // Temel
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [avatarKey, setAvatarKey] = useState<string | null>(null);
  const [avatarUp, setAvatarUp] = useState(false);
  // Niyet & yer
  const [intents, setIntents] = useState<Set<string>>(new Set());
  const [hasPlace, setHasPlace] = useState<boolean | null>(null);
  const [place, setPlace] = useState<Place>({});
  // İletişim
  const [phone, setPhone] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  // Host
  const [host, setHost] = useState<HostDetails>({});
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [addressExact, setAddressExact] = useState("");
  const [proofAddress, setProofAddress] = useState(false);
  // Beceri / gönüllü / takvim
  const [skills, setSkills] = useState<Set<string>>(new Set());
  const [skillsNote, setSkillsNote] = useState("");
  const [volunteer, setVolunteer] = useState<VolunteerDetails>({});
  const [availability, setAvailability] = useState<Availability>({});

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const loadMe = () => api.get<Profile>("/profile/me").then((p) => {
    setPhotos(p.photos ?? []);
    setProofAddress(!!p.proofAddress);
    if (p.addressExact) setAddressExact((a) => a || p.addressExact!);
  }).catch(() => {});
  useEffect(() => { loadMe(); }, []);

  const f = flags(intents, hasPlace);
  const COUNTRIES = [...countryNames(lang), t("Diğer", "Other")];

  // ---- adımlar ----
  type StepDef = { id: string; label: string; enabled: boolean };
  const STEPS: StepDef[] = [
    { id: "intro", label: t("Seni yakından tanıyalım", "Let's get to know you"), enabled: true },
    { id: "intent", label: t("Ne yapmak istersin?", "What do you want to do?"), enabled: true },
    { id: "contact", label: t("İletişim", "Contact"), enabled: true },
    { id: "place", label: t("Yer profili", "Place profile"), enabled: f.hasPlace },
    { id: "guide", label: t("Çiftlik rehberi & fotoğraflar", "Farm guide & photos"), enabled: f.wantsHost },
    { id: "verify", label: t("Adres & doğrulama", "Address & verification"), enabled: f.hasPlace },
    { id: "skills", label: t("İlgi & beceri", "Interests & skills"), enabled: true },
    { id: "calendar", label: t("Takvim", "Calendar"), enabled: f.needsCalendar },
    { id: "photos", label: t("Fotoğraflar", "Photos"), enabled: true },
  ];
  const enabledSteps = STEPS.filter((s) => s.enabled);
  const current = enabledSteps[Math.min(step, enabledSteps.length - 1)];
  const curId = current.id;

  function stepMissing(id: string): string[] {
    const m: string[] = [];
    if (id === "intro") {
      if (!firstName.trim()) m.push(t("Ad", "First name"));
      if (!country) m.push(t("Ülke", "Country"));
      if (!city.trim()) m.push(t("Şehir", "City"));
      if (!bio.trim()) m.push(t("Kısa tanıtım", "Short intro"));
    } else if (id === "intent") {
      if (intents.size === 0) m.push(t("En az bir niyet seçimi", "At least one intent"));
      if (hasPlace === null) m.push(t('"Bir yerin var mı?" sorusu', '"Do you have a place?"'));
    } else if (id === "contact") {
      if (f.contactRequired) {
        if (!lastName.trim()) m.push(t("Soyad", "Last name"));
        if (!phone.trim()) m.push(t("Telefon", "Phone"));
        if (!instagram.trim()) m.push(t("Sosyal medya", "Social media"));
      }
      // Opsiyonel e-posta dolu ama geçersizse backend reddeder — erken ve net uyar.
      if (contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) m.push(t("Geçerli e-posta", "Valid email"));
    } else if (id === "place") {
      if (!place.name?.trim()) m.push(t("Yerin adı", "Place name"));
      if (!place.type) m.push(t("Yer türü", "Place type"));
      if (!place.location?.trim()) m.push(t("Genel konum", "General location"));
    } else if (id === "guide") {
      if (!host.work?.trim()) m.push(t("Kısa özet / yapılacak işler", "Short summary / the help"));
      if (!(host.helpTypes?.length)) m.push(t("Yardım türleri", "Types of help"));
      if (!host.accommodation?.trim()) m.push(t("Konaklama", "Accommodation"));
      for (const c of HOST_PHOTO_CATEGORIES) {
        if (c.required && !photos.some((p) => p.category === c.key)) m.push(`${t("Fotoğraf", "Photo")}: ${lang === "en" ? c.en : c.tr}`);
      }
    } else if (id === "verify") {
      if (f.needsAddress && !addressExact.trim()) m.push(t("Açık adres", "Full address"));
    } else if (id === "skills") {
      if (f.isVolunteer && !volunteer.experience) m.push(t("Çiftlik deneyimi (gönüllü)", "Farm experience (volunteer)"));
    }
    return m;
  }

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setAvatarUp(true);
    try { setAvatarKey(await uploadImage(file, "avatar")); } catch { /* ignore */ }
    finally { setAvatarUp(false); if (e.target) e.target.value = ""; }
  }

  async function finish() {
    setBusy(true); setErr(null);
    try {
      const socials: Record<string, string> = {};
      if (instagram.trim()) socials.instagram = instagram.trim();
      if (website.trim()) socials.website = website.trim();
      const profile: Record<string, unknown> = {
        intents: [...intents],
        hasPlace: hasPlace === true,
        skills: [...skills],
      };
      if (skillsNote.trim()) profile.skillsNote = skillsNote.trim();
      if (f.hasPlace) profile.place = place;
      if (f.wantsHost) profile.host = host;
      if (f.isVolunteer && volunteer.experience) profile.volunteer = volunteer;
      if (!availabilityEmpty(availability)) profile.availability = availability;

      await api.put("/profile", {
        firstName, lastName: lastName || null, country, city, bio,
        ...(avatarKey ? { avatarKey } : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(contactEmail.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim()) ? { contactEmail: contactEmail.trim() } : {}),
        ...(Object.keys(socials).length ? { socials } : {}),
        ...(f.hasPlace ? { addressExact } : {}),
        profile,
      });
      await api.post("/onboarding/tags/confirm", { tags: derivedTags(intents, hasPlace === true) });
      api.invalidate();
      setDone(true);
    } catch (e) { setErr(errMsg(e, t)); } finally { setBusy(false); }
  }

  function goNext() {
    if (step < enabledSteps.length - 1) setStep(step + 1);
    else finish();
  }
  function goBack() { if (step > 0) setStep(step - 1); }

  // step index güvenliği (adımlar açılıp kapandıkça)
  useEffect(() => { if (step > enabledSteps.length - 1) setStep(enabledSteps.length - 1); }, [enabledSteps.length, step]);

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center">
          <div className="mb-3 flex justify-center"><span className="grid size-14 place-items-center rounded-full bg-offer-bg text-forest-700"><Sprout size={28} strokeWidth={1.75} /></span></div>
          <h1 className="font-display text-2xl font-semibold">{t("Profilin hazır!", "Your profile is ready!")}</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
            {t("Ekibimiz profilini kısa sürede inceleyecek; onaylanınca Keşfet'te görünür ve eşleşmeye başlarsın. O zamana dek gezinmeye başlayabilirsin.",
               "Our team will review your profile shortly; once approved you'll appear in Discover and start matching. Meanwhile you can start exploring.")}
          </p>
          <div className="mx-auto mt-5 max-w-sm rounded-xl border border-[#c6e0c2] bg-offer-bg p-4 text-left">
            <div className="font-display flex items-center gap-2 text-base font-semibold text-forest-700"><Sprout size={18} strokeWidth={1.75} /> {t("Öncü üye · Ücretsiz", "Founding member · Free")}</div>
            <p className="mt-1 text-sm text-ink-700">
              {t("Topluluğun ilk üyelerindensin — erişimin ücretsiz. Ücretli üyelik ($35/yıl) ileride başlayacak.",
                 "You're among the first members — your access is free. Paid membership ($35/year) will start later.")}
            </p>
          </div>
          <Button className="mt-6" onClick={() => nav("/app")}>{t("Keşfetmeye başla", "Start exploring")} <ChevronRight size={16} strokeWidth={2} /></Button>
        </div>
      </div>
    );
  }

  const miss = stepMissing(curId);
  const isLast = step === enabledSteps.length - 1;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      {err && <div className="mb-4 rounded-lg border border-[#eec4c0] bg-[#f7e2e0] px-4 py-3 text-sm text-[#8a2f29]">{err}</div>}
      <div className="grid gap-5 md:grid-cols-[240px_1fr]">
        {/* Sol menü */}
        <nav className="self-start rounded-[var(--radius-lg)] border border-border bg-surface p-3.5">
          <ul className="space-y-0.5">
            {enabledSteps.map((s, i) => (
              <li key={s.id}>
                <button onClick={() => setStep(i)}
                  className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition",
                    i === step ? "bg-sand-100 font-semibold text-forest-700" : "text-ink-500 hover:text-ink-700")}>
                  <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border text-[11px]",
                    i < step ? "border-moss-500 bg-moss-500 text-white" : i === step ? "border-forest-600 text-forest-600" : "border-border-strong")}>
                    {i < step ? <Check size={12} strokeWidth={2.5} /> : i + 1}
                  </span>
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Panel */}
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 md:p-7">
          {curId === "intro" && (
            <Step title={t("Seni yakından tanıyalım", "Let's get to know you")} lead={t("Profilin ne kadar ayrıntılıysa eşleşmen o kadar isabetli olur.", "The more detailed your profile, the better your matches.")}>
              <div className="grid gap-x-4 sm:grid-cols-2">
                <Field label={t("Ad", "First name")} req><input className={inp} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={t("Adın", "Your name")} /></Field>
                <Field label={t("Soyad", "Last name")}><input className={inp} value={lastName} onChange={(e) => setLastName(e.target.value)} /></Field>
              </div>
              <div className="grid gap-x-4 sm:grid-cols-2">
                <Field label={t("Ülke", "Country")} req>
                  <select className={inp} value={country} onChange={(e) => setCountry(e.target.value)}>
                    <option value="">{t("Seç…", "Select…")}</option>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label={t("Şehir", "City")} req><input className={inp} value={city} onChange={(e) => setCity(e.target.value)} placeholder={t("Şehir (haritada görünür)", "City (shown on the map)")} /></Field>
              </div>
              <Field label={t("Kısa tanıtım", "Short intro")} req><textarea className={ta} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t("Birkaç cümleyle kendini tanıt", "Introduce yourself in a few sentences")} /></Field>
              <Field label={<>{t("Profil fotoğrafı", "Profile photo")} <span className="text-[12px] font-medium text-ink-300">({t("opsiyonel — önerilir", "optional — recommended")})</span></>}>
                <label className="inline-flex cursor-pointer items-center gap-3 rounded-lg border border-border-strong px-3 py-2 text-sm text-ink-700 transition hover:border-forest-600">
                  <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onAvatar} />
                  {avatarUp ? t("Yükleniyor…", "Uploading…") : avatarKey ? <><Check size={15} strokeWidth={2} /> {t("Fotoğraf yüklendi — değiştir", "Photo uploaded — change")}</> : t("+ Profil fotoğrafı ekle", "+ Add profile photo")}
                </label>
              </Field>
            </Step>
          )}

          {curId === "intent" && (
            <Step title={t("Burada ne yapmak istersin?", "What do you want to do here?")} lead={t("Birden fazla seçebilirsin. Seçimine göre sonraki adımlar açılır. İstediğin zaman değiştirebilirsin.", "Pick more than one. Your choices unlock the next steps. You can change them anytime.")}>
              <div className="flex flex-wrap gap-2.5">
                {INTENTS.map((o) => {
                  const on = intents.has(o.key);
                  return (
                    <button key={o.key} type="button"
                      onClick={() => {
                        const n = new Set(intents); n.has(o.key) ? n.delete(o.key) : n.add(o.key);
                        setIntents(n);
                        if (n.has("host")) setHasPlace(true); // ağırlamak → yer zorunlu
                      }}
                      className={cn("flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition",
                        on ? "border-forest-600 bg-forest-600 text-white" : "border-border-strong bg-surface hover:border-forest-500")}>
                      <DomainIcon map={INTENT_ICONS} k={o.key} size={16} />{lang === "en" ? o.en : o.tr}
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 mb-1.5 text-[13px] font-semibold text-ink-700">{t("Ağırlayabileceğin / üretim yaptığın bir yerin var mı?", "Do you have a place to host / produce?")}</div>
              <p className="mb-2 text-xs text-ink-500">{t("Çiftlik, arazi, bahçe, ekolojik proje, bağ, hayvan barınağı, inziva/atölye merkezi, eko-köy…", "Farm, land, garden, eco project, vineyard, animal sanctuary, retreat/workshop centre, eco-village…")}</p>
              <div className="inline-flex overflow-hidden rounded-full border border-border-strong">
                <button type="button" onClick={() => setHasPlace(true)} className={cn("px-4 py-2 text-sm", hasPlace === true ? "bg-forest-600 text-white" : "bg-surface text-ink-700")}>{t("Evet, bir yerim var", "Yes, I have a place")}</button>
                <button type="button" disabled={f.wantsHost} onClick={() => !f.wantsHost && setHasPlace(false)} className={cn("px-4 py-2 text-sm", hasPlace === false ? "bg-forest-600 text-white" : "bg-surface text-ink-700", f.wantsHost && "opacity-40")}>{t("Hayır", "No")}</button>
              </div>
              {f.wantsHost && <div className="mt-3 rounded-lg border-l-4 border-forest-500 bg-sand-100 px-4 py-3 text-[13.5px] text-ink-700">{t('"Gönüllü ağırlamak" seçtiğin için yerin olması gerekir — "Evet" otomatik işaretlendi. Çiftlik rehberi, ağırlama fotoğrafları ve adres adımları açıldı.', '"Host volunteers" requires a place — "Yes" was set automatically. The farm guide, accommodation photos and address steps are now enabled.')}</div>}
              {f.hasPlace && !f.wantsHost && intents.has("material") && <div className="mt-3 rounded-lg border-l-4 border-clay-500 bg-sand-100 px-4 py-3 text-[13.5px] text-ink-700">{t("Yalnızca malzeme/tohum paylaşımı için yer adresi istenir (kargo/izlenebilirlik); belge zorunlu değil.", "For material/seed sharing only, the place address is asked (shipping/traceability); a document isn't required.")}</div>}
            </Step>
          )}

          {curId === "contact" && (
            <Step title={t("İletişim", "Contact")} lead={f.contactRequired ? t("Gönüllü ağırladığın için bu alanlar zorunlu — karşılıklı güven ve ulaşım için.", "Since you host volunteers these fields are required — for trust and reachability.") : t("Opsiyonel — bağlantı kurduğunda paylaşılır.", "Optional — shared when you connect.")}>
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-sand-100 px-3 py-1.5 text-[13px] text-ink-500"><Lock size={14} strokeWidth={1.75} className="shrink-0" /> <span>{t("Bu bilgiler gizlidir; profilinde görünmez / yalnızca ekip & bağlantıların görür.", "These are private; they don't show on your profile — only the team & your connections see them.")}</span></div>
              <div className="grid gap-x-4 sm:grid-cols-2">
                <Field label={t("Telefon", "Phone")} req={f.contactRequired}><input className={inp} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90" /></Field>
                <Field label={<>{t("Sosyal medya", "Social media")} {!f.contactRequired && <span className="text-[12px] font-medium text-ink-300">({t("opsiyonel", "optional")})</span>}</>} req={f.contactRequired}><input className={inp} value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@kullanici" /></Field>
              </div>
              <div className="grid gap-x-4 sm:grid-cols-2">
                <Field label={<>{t("İletişim e-postası", "Contact email")} <span className="text-[12px] font-medium text-ink-300">({t("opsiyonel", "optional")})</span></>}><input className={inp} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} /></Field>
                <Field label={<>{t("Web sitesi", "Website")} <span className="text-[12px] font-medium text-ink-300">({t("opsiyonel", "optional")})</span></>}><input className={inp} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" /></Field>
              </div>
            </Step>
          )}

          {curId === "place" && (
            <Step title={t("Yer profili", "Place profile")} lead={t("Yerini tanıt — gönüllüler ve topluluk neyle karşılaşacağını bilsin.", "Introduce your place so volunteers and the community know what to expect.")}>
              <Field label={t("Yerin adı", "Place name")} req><input className={inp} value={place.name ?? ""} onChange={(e) => setPlace({ ...place, name: e.target.value })} placeholder={t("Örn. Zeytin Bahçesi", "E.g. Olive Grove")} /></Field>
              <Field label={t("Yer türü", "Place type")} req>
                <select className={inp} value={place.type ?? ""} onChange={(e) => setPlace({ ...place, type: e.target.value })}>
                  <option value="">{t("Seç…", "Select…")}</option>{PLACE_TYPES.map((p) => <option key={p.key} value={p.key}>{lang === "en" ? p.en : p.tr}</option>)}
                </select>
              </Field>
              <Field label={t("Genel konum (herkese görünür)", "General location (shown publicly)")} req><input className={inp} value={place.location ?? ""} onChange={(e) => setPlace({ ...place, location: e.target.value })} placeholder={t("İlçe / İl", "District / City")} /></Field>
            </Step>
          )}

          {curId === "guide" && (
            <Step title={t("Çiftlik rehberi & ağırlama fotoğrafları", "Farm guide & accommodation photos")} lead={t("Gönüllülerin ne beklediğini net görmesi için ağırlama bilgilerini doldur.", "Fill in your hosting details so volunteers know what to expect.")}>
              <HostDetailsForm value={host} onChange={setHost} />
              <div className="mt-5 border-t border-border pt-4">
                <h3 className="font-display mb-1 flex items-center gap-1.5 text-[15px] font-semibold text-forest-700"><Camera size={16} strokeWidth={1.75} /> {t("Yerin fotoğrafları", "Photos of your place")}</h3>
                <HostPhotos photos={photos} onChange={loadMe} />
              </div>
            </Step>
          )}

          {curId === "verify" && (
            <Step title={t("Adres & doğrulama", "Address & verification")} lead={t("Gönüllüler/komşu üreticiler sana ulaşabilsin diye yer bilgini alıyoruz.", "We collect your place info so volunteers/neighbouring producers can reach you.")}>
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg bg-sand-100 px-3 py-1.5 text-[13px] text-ink-500"><Lock size={14} strokeWidth={1.75} className="shrink-0" /> <span>{t("Bu bilgiler gizlidir; profilinde görünmez / yalnızca ekip & bağlantıların görür.", "These are private; they don't show on your profile — only the team & your connections see them.")}</span></div>
              <Field label={<>{t("Açık adres", "Full address")} {f.needsAddress ? <span className="font-bold text-[#dc2626]"> *</span> : <span className="text-[12px] font-medium text-ink-300">({t("opsiyonel", "optional")})</span>}</>}>
                <textarea className={ta} rows={2} value={addressExact} onChange={(e) => setAddressExact(e.target.value)} placeholder={t("Mahalle, sokak, no, ilçe/il", "Street, no, district/city")} />
              </Field>
              <Field label={<>{t("Adres kanıtı belgesi", "Proof of address")} <span className="text-[12px] font-medium text-ink-300">({t("opsiyonel", "optional")})</span></>}>
                <ProofUpload done={proofAddress} onChange={loadMe} />
              </Field>
              <div className="flex items-start gap-2 rounded-lg border-l-4 border-forest-500 bg-sand-100 px-4 py-3 text-[13.5px] text-ink-700"><Info size={15} strokeWidth={1.75} className="mt-0.5 shrink-0" /> <span>{t("Belge zorunlu değil; onay sürecinde gerekli görülürse ekibimiz isteyebilir.", "The document isn't required; our team may request it during review if needed.")}</span></div>
            </Step>
          )}

          {curId === "skills" && (
            <Step title={t("İlgi & beceri", "Interests & skills")} lead={t("Seni doğru kişilerle eşleştirmek için.", "To match you with the right people.")}>
              {f.isVolunteer && (
                <div className="mb-5 rounded-xl border border-moss-500/40 bg-sand-100/60 p-4">
                  <VolunteerExperienceField value={volunteer} onChange={setVolunteer} />
                  <p className="mt-2 text-xs text-ink-500"><span className="font-bold text-[#dc2626]">*</span> {t("zorunlu", "required")}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((s) => {
                  const on = skills.has(s.key);
                  return (
                    <button key={s.key} type="button" onClick={() => { const n = new Set(skills); n.has(s.key) ? n.delete(s.key) : n.add(s.key); setSkills(n); }}
                      className={cn("rounded-full border px-3 py-1.5 text-[13.5px] transition", on ? "border-forest-600 bg-forest-600 text-white" : "border-border-strong bg-surface hover:border-forest-500")}>
                      {lang === "en" ? s.en : s.tr}
                    </button>
                  );
                })}
              </div>
              <Field label={<>{t("Listede olmayan bir şey mi var?", "Something not in the list?")} <span className="text-[12px] font-medium text-ink-300">({t("opsiyonel", "optional")})</span></>} className="mt-4">
                <textarea className={ta} rows={2} value={skillsNote} onChange={(e) => setSkillsNote(e.target.value)} placeholder={t("Kısaca ekle: örn. zeytinyağı üretimi, güneş enerjisi, keçe yapımı…", "Add briefly: e.g. olive-oil making, solar energy, felting…")} />
              </Field>
            </Step>
          )}

          {curId === "calendar" && (
            <Step title={t("Takvim", "Calendar")} lead={f.wantsHost ? t("Gönüllüleri hangi aylarda ağırlayabilirsin? Opsiyonel ama eşleşme için çok etkili.", "Which months can you host volunteers? Optional but very effective for matching.") : t("Hangi aylarda müsaitsin? Opsiyonel ama eşleşme için çok etkili.", "Which months are you available? Optional but very effective for matching.")}>
              <AvailabilityField value={availability} onChange={setAvailability} label={availabilityLabel(f.wantsHost, f.isVolunteer, t)} />
            </Step>
          )}

          {curId === "photos" && (
            <Step title={t("Fotoğraflar", "Photos")} lead={t("Profilini güzel gösteren fotoğraflar — kendinden, deneyimlerinden. Herkese açık profilinde görünür.", "Photos that make your profile shine — of you and your experiences. Shown on your public profile.")}>
              <HostPhotos photos={photos} onChange={loadMe} generalOnly />
              <p className="mt-2 text-xs text-ink-500">{t("Opsiyonel ama dolu bir galeri çok daha fazla ilgi çeker.", "Optional, but a full gallery gets much more interest.")}</p>
            </Step>
          )}

          {miss.length > 0 && (
            <div className="mt-6 rounded-xl border border-[#f0c9c4] bg-[#fdf1ef] px-4 py-3 text-sm">
              <div className="mb-1 font-semibold text-[#8a2f29]">{t("Devam etmek için eksik:", "To continue, missing:")}</div>
              <ul className="ml-4 list-disc space-y-0.5 text-ink-700">{miss.map((m) => <li key={m}>{m}</li>)}</ul>
            </div>
          )}

          <div className="mt-7 flex items-center justify-between border-t border-border pt-5">
            <Button variant="ghost" onClick={goBack} className={step === 0 ? "invisible" : ""}><ChevronLeft size={16} strokeWidth={2} /> {t("Geri", "Back")}</Button>
            <Button onClick={goNext} disabled={busy || miss.length > 0}>{busy ? t("Kaydediliyor…", "Saving…") : isLast ? t("Kaydet ve bitir", "Save and finish") : <>{t("Kaydet ve devam et", "Save and continue")} <ChevronRight size={16} strokeWidth={2} /></>}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function errMsg(e: unknown, t: (tr: string, en: string) => string) {
  const m = e instanceof Error ? e.message : String(e);
  return m.includes("fetch") || m.includes("Failed")
    ? t("Backend'e ulaşılamadı.", "Couldn't reach the backend.")
    : m;
}

const inp = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600";
const ta = inp + " resize-y";

function Step({ title, lead, children }: { title: string; lead?: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      {lead ? <p className="mb-5 mt-1 text-sm text-ink-500">{lead}</p> : <div className="mb-5" />}
      {children}
    </div>
  );
}
function Field({ label, req, children, className }: { label: React.ReactNode; req?: boolean; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4", className)}>
      <div className="mb-1.5 text-[13px] font-semibold text-ink-700">{label}{req && <span className="font-bold text-[#dc2626]"> *</span>}</div>
      {children}
    </div>
  );
}
