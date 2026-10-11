// Host (çiftlik/yer sahibi) detayları — yer sunan üyeler profillerinde
// Workaway benzeri ayrıntılı ağırlama bilgisi verir. profile.host altında saklanır.

export interface HostDetails {
  work?: string;          // yapılacak işler / yardım tanımı
  helpTypes?: string[];   // yardım türleri (HELP_TYPES key'leri)
  hoursNote?: string;     // çalışma düzeni notu (standart 6s/gün · 5 gün dışında bir şey varsa)
  accommodation?: string; // konaklama imkanları
  meals?: string;         // yemek (standart günde 3 öğün; özel beslenme notu)
  learn?: string;         // öğrenilebilecekler (ekmek, peynir, permakültür…)
  nearby?: string;        // çevrede gezilecek yerler / boş zaman
  amenities?: string[];   // olanaklar (AMENITIES key'leri)
  languages?: string[];   // konuşulan diller (LANGUAGES key'leri)
}

export interface LabeledKey { key: string; tr: string; en: string }

export const HELP_TYPES: LabeledKey[] = [
  { key: "gardening",   tr: "Bahçe & tarım işleri", en: "Gardening & farming" },
  { key: "planting",    tr: "Ekim & dikim",          en: "Planting & sowing" },
  { key: "harvest",     tr: "Hasat",                 en: "Harvesting" },
  { key: "animals",     tr: "Hayvan bakımı",         en: "Animal care" },
  { key: "cooking",     tr: "Yemek hazırlama",       en: "Cooking meals" },
  { key: "housework",   tr: "Ev işleri",             en: "Help around the house" },
  { key: "maintenance", tr: "Bakım & tamir",         en: "Maintenance & repairs" },
  { key: "building",    tr: "İnşaat & DIY",          en: "Building & DIY" },
  { key: "crafts",      tr: "El sanatları",          en: "Crafts" },
  { key: "ecoprojects", tr: "Eko/permakültür projeleri", en: "Eco / permaculture projects" },
];

export const AMENITIES: LabeledKey[] = [
  { key: "private_room",   tr: "Özel oda",          en: "Private room" },
  { key: "shared_room",    tr: "Ortak/paylaşımlı oda", en: "Shared room" },
  { key: "camping",        tr: "Kamp alanı",        en: "Camping space" },
  { key: "shared_kitchen", tr: "Ortak mutfak",      en: "Shared kitchen" },
  { key: "bathroom",       tr: "Banyo erişimi",     en: "Bathroom access" },
  { key: "laundry",        tr: "Çamaşır makinesi",  en: "Laundry" },
  { key: "wifi",           tr: "İnternet",          en: "Internet access" },
  { key: "pets",           tr: "Evcil hayvan var",  en: "Pets on site" },
  { key: "bike",           tr: "Bisiklet",          en: "Bicycles" },
  { key: "transport",      tr: "Ulaşım yardımı",    en: "Help with transport" },
];

export const LANGUAGES: LabeledKey[] = [
  { key: "tr", tr: "Türkçe",      en: "Turkish" },
  { key: "en", tr: "İngilizce",   en: "English" },
  { key: "de", tr: "Almanca",     en: "German" },
  { key: "fr", tr: "Fransızca",   en: "French" },
  { key: "es", tr: "İspanyolca",  en: "Spanish" },
  { key: "pt", tr: "Portekizce",  en: "Portuguese" },
  { key: "it", tr: "İtalyanca",   en: "Italian" },
  { key: "ar", tr: "Arapça",      en: "Arabic" },
  { key: "ru", tr: "Rusça",       en: "Russian" },
  { key: "other", tr: "Diğer",    en: "Other" },
];

export function labelOf(list: LabeledKey[], key: string, lang: string): string {
  const f = list.find((x) => x.key === key);
  return f ? (lang === "en" ? f.en : f.tr) : key;
}

// Boş mu? (hiç alan doldurulmamışsa host bölümünü gösterme)
export function hostIsEmpty(h?: HostDetails | null): boolean {
  if (!h) return true;
  return !(
    h.work || h.hoursNote || h.accommodation || h.meals || h.learn || h.nearby ||
    (h.helpTypes && h.helpTypes.length) || (h.amenities && h.amenities.length) ||
    (h.languages && h.languages.length)
  );
}
