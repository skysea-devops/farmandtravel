// Niyet-temelli onboarding: niyetler + yer + beceriler, ve niyet→etiket eşlemesi.
// Etiketler mevcut taksonomiye maplanır ki discovery/harita/eşleşme bozulmasın.
import type { Axis } from "@/lib/types";

export type Sel = { axis: Axis; value: string };

export interface Labeled { key: string; tr: string; en: string; icon?: string }

export const INTENTS: Labeled[] = [
  { key: "host",      icon: "🏡", tr: "Gönüllü ağırlamak", en: "Host volunteers" },
  { key: "volunteer", icon: "🎒", tr: "Gönüllü olarak gitmek", en: "Volunteer somewhere" },
  { key: "learn",     icon: "🌱", tr: "Bilgi & beceri paylaşmak / öğrenmek", en: "Share & learn skills" },
  { key: "activity",  icon: "📅", tr: "Aktivite & etkinlik (online/yüz yüze)", en: "Activities & events" },
  { key: "material",  icon: "🔧", tr: "Malzeme / tohum / araç-gereç — ver/al", en: "Materials / seeds / tools — give/receive" },
  { key: "support",   icon: "🤝", tr: "Destek / ortaklık", en: "Support / partnership" },
];

export const PLACE_TYPES: Labeled[] = [
  { key: "farm",        tr: "Çiftlik / çiftlik evi", en: "Farm / farmhouse" },
  { key: "land",        tr: "Arazi / bahçe",         en: "Land / garden" },
  { key: "permaculture",tr: "Permakültür projesi",   en: "Permaculture project" },
  { key: "eco_reserve", tr: "Ekolojik rezerv",       en: "Ecological reserve" },
  { key: "animal",      tr: "Hayvan barınağı",       en: "Animal sanctuary" },
  { key: "vineyard",    tr: "Bağ",                   en: "Vineyard" },
  { key: "retreat",     tr: "İnziva / atölye merkezi", en: "Retreat / workshop centre" },
  { key: "ecovillage",  tr: "Eko-köy",               en: "Eco-village" },
  { key: "other",       tr: "Diğer",                 en: "Other" },
];

// İlgi & beceriler (eko/çiftlik/topluluk odaklı). profile.skills altında saklanır.
export const SKILLS: Labeled[] = [
  { key: "farming",     tr: "Tarım & bahçe", en: "Farming & gardening" },
  { key: "planting",    tr: "Ekim & dikim", en: "Planting & sowing" },
  { key: "harvest",     tr: "Hasat", en: "Harvesting" },
  { key: "permaculture",tr: "Permakültür", en: "Permaculture" },
  { key: "animals",     tr: "Hayvan bakımı", en: "Animal care" },
  { key: "beekeeping",  tr: "Arıcılık", en: "Beekeeping" },
  { key: "compost",     tr: "Kompost", en: "Composting" },
  { key: "irrigation",  tr: "Sulama", en: "Irrigation" },
  { key: "natural_build",tr: "Doğal yapı (kerpiç/saman)", en: "Natural building" },
  { key: "construction",tr: "İnşaat & DIY", en: "Construction & DIY" },
  { key: "maintenance", tr: "Bakım & tamir", en: "Maintenance & repair" },
  { key: "painting",    tr: "Boyama", en: "Painting" },
  { key: "carpentry",   tr: "Marangozluk", en: "Carpentry" },
  { key: "crafts",      tr: "El sanatları", en: "Crafts" },
  { key: "cooking",     tr: "Yemek pişirme", en: "Cooking" },
  { key: "food_making", tr: "Ekmek/peynir/fermentasyon", en: "Bread/cheese/fermentation" },
  { key: "herbalism",   tr: "Bitki & şifalı otlar", en: "Plants & herbalism" },
  { key: "teaching",    tr: "Atölye & eğitim", en: "Workshops & teaching" },
  { key: "languages",   tr: "Dil öğretimi", en: "Language teaching" },
  { key: "photo",       tr: "Fotoğraf & video", en: "Photo & video" },
  { key: "social",      tr: "Sosyal medya & tanıtım", en: "Social media & marketing" },
  { key: "web",         tr: "Web & tasarım", en: "Web & design" },
  { key: "music",       tr: "Müzik", en: "Music" },
  { key: "wellness",    tr: "Yoga & wellness", en: "Yoga & wellness" },
  { key: "childcare",   tr: "Çocuk bakımı", en: "Childcare" },
  { key: "events",      tr: "Etkinlik organizasyon", en: "Event organizing" },
];

export function labelOf(list: Labeled[], key: string, lang: string): string {
  const f = list.find((x) => x.key === key);
  return f ? (lang === "en" ? f.en : f.tr) : key;
}

// Niyet + "yerin var" → mevcut taksonomi etiketleri.
export function derivedTags(intents: Set<string>, hasPlace: boolean): Sel[] {
  const out: Sel[] = [];
  const add = (axis: Axis, value: string) => { if (!out.some((s) => s.axis === axis && s.value === value)) out.push({ axis, value }); };
  if (hasPlace) add("situation", "farm-owner");
  if (intents.has("host")) { add("seek", "volunteers"); add("offer", "place-experience"); }
  if (intents.has("volunteer")) { add("offer", "volunteer-labor"); add("seek", "hosting"); add("situation", "seeking-experience"); }
  if (intents.has("learn")) { add("seek", "knowledge"); }
  if (intents.has("activity")) { add("seek", "networking"); }
  if (intents.has("material")) { add("offer", "equipment"); add("seek", "equipment"); }
  if (intents.has("support")) { add("seek", "partner"); add("offer", "partnership"); }
  return out;
}

// Etiketlerden niyetleri geri kur (onboarding sonrası niyet düzenleme için).
// derivedTags'in tersidir; onboarding yalnızca niyetten türeyen etiket yazdığı için
// kayıpsızdır.
export function intentsFromTags(tags: { axis: string; value: string }[]): { intents: Set<string>; hasPlace: boolean } {
  const has = (axis: string, value: string) => tags.some((t) => t.axis === axis && t.value === value);
  const intents = new Set<string>();
  if (has("seek", "volunteers") || has("offer", "place-experience")) intents.add("host");
  if (has("offer", "volunteer-labor") || has("seek", "hosting") || has("situation", "seeking-experience")) intents.add("volunteer");
  if (has("seek", "knowledge")) intents.add("learn");
  if (has("seek", "networking")) intents.add("activity");
  if (has("offer", "equipment") || has("seek", "equipment")) intents.add("material");
  if (has("seek", "partner") || has("offer", "partnership")) intents.add("support");
  return { intents, hasPlace: has("situation", "farm-owner") };
}

// Türetilen bayraklar (wizard adımlarını ve zorunlulukları yönetir).
export const flags = (intents: Set<string>, hasPlace: boolean | null) => ({
  wantsHost: intents.has("host"),
  isVolunteer: intents.has("volunteer"),
  hasPlace: hasPlace === true,
  needsAddress: hasPlace === true && (intents.has("host") || intents.has("material")),
  contactRequired: intents.has("host"),
  needsCalendar: intents.has("host") || intents.has("volunteer"),
});
