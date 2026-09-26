import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { Axis, InferResponse, TaxonomyItem } from "@/lib/types";

const SITUATIONS = ["Bir yerim/çiftliğim var", "Bir projem/fikrim var", "Deneyim/gönüllülük arıyorum", "Uzmanlık sunuyorum", "Öğrenmek istiyorum"];
const SEEK_PICKS = ["Gönüllü arıyorum", "Mentor arıyorum", "Bilgi öğrenmek istiyorum", "Ortak arıyorum", "Ekipman arıyorum", "Networking", "Finansal destekçi arıyorum", "Konaklama fırsatı arıyorum"];
const OFFER_PICKS = ["Yer & deneyim sunuyorum", "Gönüllü olmak istiyorum", "Uzmanlık sunuyorum", "Mentorluk yapabilirim", "Ortaklık kurabilirim", "Ekipman sağlayabilirim", "Finansal destek olabilirim"];
const COUNTRIES = ["Türkiye", "Portekiz", "Almanya", "İspanya", "İtalya", "Hollanda", "Diğer"];
const AXIS_LABEL: Record<Axis, string> = { situation: "Durumum", seek: "Aradıklarım", offer: "Sunduklarım", topic: "İlgi alanlarım" };
const AXES: Axis[] = ["situation", "seek", "offer", "topic"];

type Sel = { axis: Axis; value: string };

export function OnboardingPage() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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

  const labelFor = (t: Sel) => taxonomy.find((x) => x.axis === t.axis && x.value === t.value)?.labelTr ?? t.value;

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
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  }

  async function confirmTags() {
    setBusy(true); setErr(null);
    try {
      await api.post("/onboarding/tags/confirm", { tags: selected });
      setStep(2);
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  }

  async function saveProfile() {
    setBusy(true); setErr(null);
    try {
      await api.put("/profile", { firstName, country, city, bio, profile: { situation } });
      setStep(3);
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  }

  const addOptions = (axis: Axis) =>
    taxonomy.filter((t) => t.axis === axis && !selected.some((s) => s.axis === axis && s.value === t.value));

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Progress step={step} />
      {err && <div className="mb-4 rounded-lg border border-[#eec4c0] bg-[#f7e2e0] px-4 py-3 text-sm text-[#8a2f29]">{err}</div>}

      {step === 0 && (
        <Panel title="Kendini anlat" lead="Ne aradığını ve ne sunabildiğini yaz; etiketleri senin için çıkaracağız.">
          <Group label="Şu an hangi durumdasın?">
            <Chips options={SITUATIONS} selected={situation} onToggle={(v) => toggle(situation, setSituation, v)} />
          </Group>
          <Group label="Topluluktan beklentin ne?">
            <Chips options={SEEK_PICKS} selected={seekPicks} onToggle={(v) => toggle(seekPicks, setSeekPicks, v)} />
            <textarea value={seekText} onChange={(e) => setSeekText(e.target.value)} rows={3} className={ta} placeholder="Örn: Çiftlik hayalim var, yol gösterecek deneyimli kişiler ve permakültür bilgisi arıyorum." />
          </Group>
          <Group label="Neler sunabilirsin?">
            <Chips options={OFFER_PICKS} selected={offerPicks} onToggle={(v) => toggle(offerPicks, setOfferPicks, v)} />
            <textarea value={offerText} onChange={(e) => setOfferText(e.target.value)} rows={2} className={ta} placeholder="Örn: Küçük bir çiftliğim var, hasat döneminde gönüllü ağırlayabilirim." />
          </Group>
          <Actions>
            <span />
            <Button onClick={runInfer} disabled={busy}>{busy ? "Çıkarılıyor…" : "Devam et →"}</Button>
          </Actions>
        </Panel>
      )}

      {step === 1 && (
        <Panel title="Etiketlerini onayla ya da düzenle" lead="Yazdıklarından bunları çıkardık. Yanlışı çıkar, eksiği ekle.">
          {AXES.map((axis) => (
            <Group key={axis} label={AXIS_LABEL[axis]}>
              <div className="flex flex-wrap items-center gap-2">
                {selected.filter((s) => s.axis === axis).map((s) => (
                  <span key={s.value} className="inline-flex items-center gap-1.5 rounded-full border border-border-strong bg-sand-100 px-3 py-1 text-[13px]">
                    {labelFor(s)}
                    <button onClick={() => setSelected(selected.filter((x) => !(x.axis === axis && x.value === s.value)))} className="text-ink-500 hover:text-ink-900">✕</button>
                  </span>
                ))}
                <AddTag options={addOptions(axis)} onAdd={(value) => setSelected([...selected, { axis, value }])} />
              </div>
            </Group>
          ))}
          <Actions>
            <Button variant="ghost" onClick={() => setStep(0)}>← Geri</Button>
            <Button onClick={confirmTags} disabled={busy || selected.length === 0}>{busy ? "Kaydediliyor…" : "Onayla ve devam et →"}</Button>
          </Actions>
        </Panel>
      )}

      {step === 2 && (
        <Panel title="Profilini tamamla" lead="Birkaç temel bilgi. Fotoğraf ve ayrıntıları sonra da ekleyebilirsin.">
          <Group label="Ad"><input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inp} placeholder="Adın" /></Group>
          <Group label="Ülke">
            <select value={country} onChange={(e) => setCountry(e.target.value)} className={inp}>
              <option value="">Seç…</option>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Group>
          <Group label="Şehir"><input value={city} onChange={(e) => setCity(e.target.value)} className={inp} placeholder="Şehir (haritada görünür)" /></Group>
          <Group label="Kısa tanıtım"><textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={ta} placeholder="Birkaç cümleyle kendini tanıt" /></Group>
          <Actions>
            <Button variant="ghost" onClick={() => setStep(1)}>← Geri</Button>
            <Button onClick={saveProfile} disabled={busy || !firstName || !country}>{busy ? "Kaydediliyor…" : "Kaydet ve devam et →"}</Button>
          </Actions>
        </Panel>
      )}

      {step === 3 && (
        <Panel title="Neredeyse hazırsın 🎉" lead="Profilin hazır. Topluluğa erişmek için üyeliğini başlat.">
          <div className="rounded-xl bg-sand-100 p-4">
            <div className="flex justify-between py-1 text-sm"><span>Toprakla Yeniden üyelik</span><span>₺X / ay</span></div>
            <div className="mt-1.5 flex justify-between border-t border-border pt-3 text-base font-semibold"><span>Bugün</span><span>₺X</span></div>
          </div>
          <p className="mt-3 text-xs text-ink-500">Dev modu: ödeme (Lemon Squeezy) altyapı yayına alınınca bağlanacak. Şimdilik profilini görebilirsin.</p>
          <Actions>
            <span />
            <Button onClick={() => nav("/profil")}>Profilime git →</Button>
          </Actions>
        </Panel>
      )}
    </div>
  );
}

function errMsg(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  return m.includes("fetch") || m.includes("Failed") ? "Backend'e ulaşılamadı. Lokal API çalışıyor mu? (backend: npm run dev)" : m;
}

const inp = "w-full rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus:border-forest-600";
const ta = inp + " mt-2 resize-y";

function Progress({ step }: { step: number }) {
  return (
    <div className="mb-6">
      <div className="mb-1.5 text-xs font-semibold tracking-wide text-ink-500">ADIM {step + 1} / 4</div>
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
function AddTag({ options, onAdd }: { options: TaxonomyItem[]; onAdd: (value: string) => void }) {
  if (options.length === 0) return null;
  return (
    <select value="" onChange={(e) => e.target.value && onAdd(e.target.value)}
      className="rounded-full border border-dashed border-border-strong bg-surface px-3 py-1 text-[13px] text-ink-500">
      <option value="">+ ekle</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.labelTr}</option>)}
    </select>
  );
}
function Actions({ children }: { children: React.ReactNode }) {
  return <div className="mt-7 flex items-center justify-between gap-3">{children}</div>;
}
