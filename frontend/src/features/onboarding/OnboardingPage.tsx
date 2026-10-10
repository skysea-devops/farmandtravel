import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import type { Axis, InferResponse, TaxonomyItem } from "@/lib/types";

const AXES: Axis[] = ["situation", "seek", "offer", "topic"];

type Sel = { axis: Axis; value: string };

export function OnboardingPage() {
  const nav = useNavigate();
  const { t, lang } = useI18n();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const SITUATIONS = [
    t("Bir yerim/çiftliğim var", "I have land/a farm"),
    t("Bir projem/fikrim var", "I have a project/idea"),
    t("İleride kendi çiftliğimi kuracağım", "I'll start my own farm one day"),
    t("Deneyim/gönüllülük arıyorum", "Looking for experience/volunteering"),
    t("Uzmanlık sunuyorum", "I offer expertise"),
    t("Öğrenmek istiyorum", "I want to learn"),
  ];
  const SEEK_PICKS = [
    t("Gönüllü arıyorum", "Looking for volunteers"),
    t("Mentor arıyorum", "Looking for a mentor"),
    t("Bilgi öğrenmek istiyorum", "Want to learn skills"),
    t("Ortak arıyorum", "Looking for a partner"),
    t("Ekipman arıyorum", "Looking for equipment"),
    t("Networking", "Networking"),
    t("Finansal destekçi arıyorum", "Looking for a backer"),
    t("Konaklama fırsatı arıyorum", "Looking for a place to stay"),
    t("Çiftlik hayatını deneyimlemek istiyorum", "Want to experience farm life"),
  ];
  const OFFER_PICKS = [
    t("Yer & deneyim sunuyorum", "Offering a place & experience"),
    t("Gönüllü olmak istiyorum", "Want to volunteer"),
    t("Uzmanlık sunuyorum", "Offering expertise"),
    t("Mentorluk yapabilirim", "Can mentor"),
    t("Ortaklık kurabilirim", "Open to partnership"),
    t("Ekipman sağlayabilirim", "Can provide equipment"),
    t("Finansal destek olabilirim", "Can offer financial support"),
  ];
  const COUNTRIES = [
    t("Türkiye", "Türkiye"), t("Portekiz", "Portugal"), t("Almanya", "Germany"),
    t("İspanya", "Spain"), t("İtalya", "Italy"), t("Hollanda", "Netherlands"), t("Diğer", "Other"),
  ];
  const AXIS_LABEL: Record<Axis, string> = {
    situation: t("Durumum", "My situation"),
    seek: t("Aradıklarım", "What I'm looking for"),
    offer: t("Sunduklarım", "What I offer"),
    topic: t("İlgi alanlarım", "My interests"),
  };

  // survey
  const [situation, setSituation] = useState<string[]>([]);
  const [seekText, setSeekText] = useState("");
  const [offerText, setOfferText] = useState("");
  const [seekPicks, setSeekPicks] = useState<string[]>([]);
  const [offerPicks, setOfferPicks] = useState<string[]>([]);

  // ai result + confirmed tags
  const [taxonomy, setTaxonomy] = useState<TaxonomyItem[]>([]);
  const [selected, setSelected] = useState<Sel[]>([]);

  // profile
  const [firstName, setFirstName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const taxLabel = (x: TaxonomyItem) => (lang === "en" ? x.labelEn : x.labelTr);
  const labelFor = (s: Sel) => {
    const found = taxonomy.find((x) => x.axis === s.axis && x.value === s.value);
    return found ? taxLabel(found) : s.value;
  };

  async function runInfer() {
    setBusy(true); setErr(null);
    try {
      const quickPicks = [...situation, ...seekPicks, ...offerPicks];
      const freeText = [seekText, offerText, situation.join(" ")].join(" ").trim();
      await api.post("/onboarding/draft", { draft: { situation, seekPicks, offerPicks, seekText, offerText } });
      const res = await api.post<InferResponse>("/tags/infer", { freeText, quickPicks });
      setTaxonomy(res.taxonomy);
      setSelected(res.suggestions.map((s) => ({ axis: s.axis, value: s.value })));
      setStep(1);
    } catch (e) { setErr(errMsg(e, t)); } finally { setBusy(false); }
  }

  async function confirmTags() {
    setBusy(true); setErr(null);
    try {
      await api.post("/onboarding/tags/confirm", { tags: selected });
      setStep(2);
    } catch (e) { setErr(errMsg(e, t)); } finally { setBusy(false); }
  }

  async function saveProfile() {
    setBusy(true); setErr(null);
    try {
      await api.put("/profile", { firstName, country, city, bio, profile: { situation } });
      setStep(3);
    } catch (e) { setErr(errMsg(e, t)); } finally { setBusy(false); }
  }

  const addOptions = (axis: Axis) =>
    taxonomy.filter((x) => x.axis === axis && !selected.some((s) => s.axis === axis && s.value === x.value));

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6 rounded-[var(--radius-lg)] border border-moss-500/40 bg-sand-100 p-4 text-sm text-ink-700">
        <p className="font-semibold text-forest-700">
          {t(
            "🌱 Profilini tamamla, aradığın kişilerle seni anında eşleştirelim — dünyanın dört bir yanındaki çiftlikler, gönüllüler ve birlikte üretmek isteyenlerle bağ kur.",
            "🌱 Complete your profile and we'll match you instantly with the people you're looking for — connect with farms, volunteers and growers all around the world.",
          )}
        </p>
        <p className="mt-1.5 text-ink-600">
          {t(
            "Profilini bitirene kadar Keşfet'te ve aramalarda görünmezsin, seni doğru kişilerle eşleştirebilmemiz için birkaç adım kaldı. 👇",
            "Until you finish your profile you won't appear in Discover or searches — just a few steps left so we can match you with the right people. 👇",
          )}
        </p>
      </div>
      <Progress step={step} t={t} />
      {err && <div className="mb-4 rounded-lg border border-[#eec4c0] bg-[#f7e2e0] px-4 py-3 text-sm text-[#8a2f29]">{err}</div>}

      {step === 0 && (
        <Panel title={t("Kendini anlat", "Tell us about you")} lead={t("Ne aradığını ve ne sunabildiğini yaz; etiketleri senin için çıkaracağız.", "Say what you're looking for and what you can offer; we'll derive your tags.")}>
          <Group label={t("Şu an hangi durumdasın?", "What's your situation right now?")}>
            <Chips options={SITUATIONS} selected={situation} onToggle={(v) => toggle(situation, setSituation, v)} />
          </Group>
          <Group label={t("Topluluktan beklentin ne?", "What do you want from the community?")}>
            <Chips options={SEEK_PICKS} selected={seekPicks} onToggle={(v) => toggle(seekPicks, setSeekPicks, v)} />
            <textarea value={seekText} onChange={(e) => setSeekText(e.target.value)} rows={3} className={ta} placeholder={t("Örn: Çiftlik hayalim var, yol gösterecek deneyimli kişiler ve permakültür bilgisi arıyorum.", "E.g. I dream of a farm and I'm looking for experienced people to guide me and permaculture know-how.")} />
          </Group>
          <Group label={t("Neler sunabilirsin?", "What can you offer?")}>
            <Chips options={OFFER_PICKS} selected={offerPicks} onToggle={(v) => toggle(offerPicks, setOfferPicks, v)} />
            <textarea value={offerText} onChange={(e) => setOfferText(e.target.value)} rows={2} className={ta} placeholder={t("Örn: Küçük bir çiftliğim var, hasat döneminde gönüllü ağırlayabilirim.", "E.g. I have a small farm and can host volunteers during harvest.")} />
          </Group>
          <Actions>
            <span />
            <Button onClick={runInfer} disabled={busy}>{busy ? t("Çıkarılıyor…", "Analyzing…") : t("Devam et →", "Continue →")}</Button>
          </Actions>
        </Panel>
      )}

      {step === 1 && (
        <Panel title={t("Etiketlerini onayla ya da düzenle", "Confirm or edit your tags")} lead={t("Yazdıklarından bunları çıkardık. Yanlışı çıkar, eksiği ekle.", "We derived these from what you wrote. Remove what's wrong, add what's missing.")}>
          {AXES.map((axis) => (
            <Group key={axis} label={AXIS_LABEL[axis]}>
              <div className="flex flex-wrap items-center gap-2">
                {selected.filter((s) => s.axis === axis).map((s) => (
                  <span key={s.value} className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-sand-100 px-3 py-1 text-[13px]">
                    {labelFor(s)}
                    <button onClick={() => setSelected(selected.filter((x) => !(x.axis === axis && x.value === s.value)))} className="text-ink-500 hover:text-ink-900">✕</button>
                  </span>
                ))}
                <AddTag options={addOptions(axis)} onAdd={(value) => setSelected([...selected, { axis, value }])} taxLabel={taxLabel} addLabel={t("+ ekle", "+ add")} />
              </div>
            </Group>
          ))}
          <Actions>
            <Button variant="ghost" onClick={() => setStep(0)}>{t("← Geri", "← Back")}</Button>
            <Button onClick={confirmTags} disabled={busy || selected.length === 0}>{busy ? t("Kaydediliyor…", "Saving…") : t("Onayla ve devam et →", "Confirm and continue →")}</Button>
          </Actions>
        </Panel>
      )}

      {step === 2 && (
        <Panel title={t("Profilini tamamla", "Complete your profile")} lead={t("Birkaç temel bilgi. Fotoğraf ve ayrıntıları sonra da ekleyebilirsin.", "A few basics. You can add a photo and details later.")}>
          <Group label={t("Ad", "First name")}><input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inp} placeholder={t("Adın", "Your name")} /></Group>
          <Group label={t("Ülke", "Country")}>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className={inp}>
              <option value="">{t("Seç…", "Select…")}</option>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Group>
          <Group label={t("Şehir", "City")}><input value={city} onChange={(e) => setCity(e.target.value)} className={inp} placeholder={t("Şehir (haritada görünür)", "City (shown on the map)")} /></Group>
          <Group label={t("Kısa tanıtım", "Short intro")}><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={ta} placeholder={t("Birkaç cümleyle kendini tanıt", "Introduce yourself in a few sentences")} /></Group>
          <Actions>
            <Button variant="ghost" onClick={() => setStep(1)}>{t("← Geri", "← Back")}</Button>
            <Button onClick={saveProfile} disabled={busy || !firstName || !country}>{busy ? t("Kaydediliyor…", "Saving…") : t("Kaydet ve devam et →", "Save and continue →")}</Button>
          </Actions>
        </Panel>
      )}

      {step === 3 && (
        <Panel title={t("Hazırsın 🎉", "You're all set 🎉")} lead={t("Profilin tamam. Topluluğa hoş geldin!", "Your profile is ready. Welcome to the community!")}>
          <div className="rounded-xl border border-[#c6e0c2] bg-offer-bg p-4">
            <div className="mb-1 text-2xl">🌱</div>
            <div className="font-display text-base font-semibold text-forest-700">{t("Öncü üye · Ücretsiz", "Founding member · Free")}</div>
            <p className="mt-1 text-sm text-ink-700">
              {t(
                "Topluluğun ilk üyelerindensin — erişimin ücretsiz. Ücretli üyelik ($30/yıl) ileride başlayacak; o zamana kadar her şey açık.",
                "You're among the community's first members — your access is free. Paid membership ($30/year) will start later; until then everything is open.",
              )}
            </p>
          </div>
          <Actions>
            <span />
            <Button onClick={() => nav("/app")}>{t("Panele git →", "Go to your home →")}</Button>
          </Actions>
        </Panel>
      )}
    </div>
  );
}

function errMsg(e: unknown, t: (tr: string, en: string) => string) {
  const m = e instanceof Error ? e.message : String(e);
  return m.includes("fetch") || m.includes("Failed")
    ? t("Backend'e ulaşılamadı. Lokal API çalışıyor mu? (backend: npm run dev)", "Couldn't reach the backend. Is the local API running? (backend: npm run dev)")
    : m;
}

const inp = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600";
const ta = inp + " mt-2 resize-y";

function Progress({ step, t }: { step: number; t: (tr: string, en: string) => string }) {
  return (
    <div className="mb-6">
      <div className="mb-1.5 text-xs font-semibold tracking-wide text-ink-500">{t("ADIM", "STEP")} {step + 1} / 4</div>
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => <div key={i} className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-forest-500" : i === step ? "bg-moss-500" : "bg-border"}`} />)}
      </div>
    </div>
  );
}
function Panel({ title, lead, children }: { title: string; lead: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-7">
      <h1 className="font-display text-2xl font-semibold">{title}</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">{lead}</p>
      {children}
    </div>
  );
}
function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="mb-2 text-[13px] font-semibold text-ink-700">{label}</div>
      {children}
    </div>
  );
}
function Chips({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o} onClick={() => onToggle(o)}
          className={`rounded-full border px-3.5 py-2 text-sm transition ${selected.includes(o) ? "border-forest-600 bg-forest-600 text-white" : "border-border-strong bg-surface hover:border-forest-500"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}
function AddTag({ options, onAdd, taxLabel, addLabel }: { options: TaxonomyItem[]; onAdd: (value: string) => void; taxLabel: (x: TaxonomyItem) => string; addLabel: string }) {
  if (options.length === 0) return null;
  return (
    <select value="" onChange={(e) => e.target.value && onAdd(e.target.value)}
      className="rounded-full border border-dashed border-border-strong bg-surface px-3 py-1 text-[13px] text-ink-500">
      <option value="">{addLabel}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{taxLabel(o)}</option>)}
    </select>
  );
}
function Actions({ children }: { children: React.ReactNode }) {
  return <div className="mt-7 flex items-center justify-between gap-3">{children}</div>;
}
