// Host (çiftlik/yer sahibi) detayları — yer sunan üyeler profillerinde
// Workaway benzeri ayrıntılı "çiftlik rehberi" verir. profile.host altında saklanır.

export interface RoutineRow { time?: string; activity: string }
export interface RuleItem { key: string; note?: string }

export interface HostDetails {
  work?: string;          // kısa özet / yapılacak işler
  helpTypes?: string[];   // yardım türleri (HELP_TYPES key'leri)
  accommodation?: string; // konaklama imkanları
  meals?: string;         // yemek (standart günde 3 öğün; özel beslenme notu)
  learn?: string;         // öğrenilebilecekler (ekmek, peynir, permakültür…)
  amenities?: string[];   // olanaklar (AMENITIES key'leri)
  mealTypes?: string[];   // yemek türü (MEAL_TYPES key'leri: vejetaryen/vegan/karışık)
  languages?: string[];   // konuşulan diller (LANGUAGES key'leri)
  wantsExperience?: "experienced" | "willing" | "any"; // aranan gönüllü deneyimi
  // --- Çiftlik rehberi şablonu (4 ana başlık) ---
  dailyRoutine?: RoutineRow[]; // 📅 günlük akış (saat opsiyonel)
  daysOff?: string;            // 🌿 izin günleri (düzen + ne yapılabilir)
  houseRules?: RuleItem[];     // 🏠 ev kuralları & ipuçları (seçili + not)
  around?: RuleItem[];         // 🧭 çevrede (seçili + not)
  // legacy (eski kayıtlar için — formda gösterilmez, varsa görünümde kullanılır):
  hoursNote?: string;
  nearby?: string;
}

export interface LabeledKey { key: string; tr: string; en: string; icon?: string }

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
  { key: "toilet",         tr: "Tuvalet",           en: "Toilet" },
  { key: "laundry",        tr: "Çamaşır makinesi",  en: "Laundry" },
  { key: "wifi",           tr: "İnternet",          en: "Internet access" },
  { key: "pets",           tr: "Evcil hayvan var",  en: "Pets on site" },
  { key: "bike",           tr: "Bisiklet",          en: "Bicycles" },
  { key: "transport",      tr: "Ulaşım yardımı",    en: "Help with transport" },
];

export const MEAL_TYPES: LabeledKey[] = [
  { key: "vegetarian", tr: "Vejetaryen", en: "Vegetarian" },
  { key: "vegan",      tr: "Vegan",      en: "Vegan" },
  { key: "omnivore",   tr: "Karışık (et dahil)", en: "Omnivore (incl. meat)" },
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

// 🏠 Ev kuralları & ipuçları — seçenekler (host seçer, kısa not ekler)
export const HOUSE_RULES: LabeledKey[] = [
  { key: "clean",        icon: "🧹", tr: "Temiz tut",            en: "Keep it clean" },
  { key: "trash",        icon: "🗑️", tr: "Çöpü çıkar",            en: "Take out the trash" },
  { key: "laundry",      icon: "👕", tr: "Çamaşır (haftada bir)", en: "Laundry (once a week)" },
  { key: "weekly_clean", icon: "🧽", tr: "Haftalık temizlik",     en: "Weekly cleaning" },
  { key: "food",         icon: "🍽️", tr: "Yemek / beslenme",      en: "Food" },
  { key: "animals",      icon: "🐾", tr: "Hayvanlar",             en: "Animals" },
  { key: "alcohol",      icon: "🚫", tr: "Alkol",                 en: "Alcohol" },
  { key: "smoking",      icon: "🚭", tr: "Sigara",                en: "Smoking" },
  { key: "quiet",        icon: "🌙", tr: "Sessiz saatler",        en: "Quiet hours" },
  { key: "visitors",     icon: "👥", tr: "Misafir",               en: "Visitors" },
  { key: "work_clothes", icon: "🥾", tr: "İş kıyafeti",           en: "Work clothes" },
];

// 🧭 Çevrede (Around Us) — seçenekler (gönüllüler gezmek/görmek de ister)
export const AROUND_US: LabeledKey[] = [
  { key: "market",      icon: "🛒", tr: "Market / alışveriş",     en: "Market / shopping" },
  { key: "transport",   icon: "🚌", tr: "Ulaşım",                 en: "Transportation" },
  { key: "trips",       icon: "🏞️", tr: "Geziler & aktiviteler",  en: "Trips & activities" },
  { key: "swimming",    icon: "🏊", tr: "Yüzme",                  en: "Swimming" },
  { key: "nature",      icon: "🥾", tr: "Doğa yürüyüşü",          en: "Nature & hikes" },
  { key: "sightseeing", icon: "📍", tr: "Gezilecek yerler",       en: "Places to visit" },
];

// Host'un aradığı gönüllü deneyimi
export const WANTS_EXPERIENCE: LabeledKey[] = [
  { key: "experienced", tr: "Deneyimli gönüllü arıyorum", en: "Looking for experienced volunteers" },
  { key: "willing",     tr: "Deneyim şart değil, öğrenmeye istekli olsun", en: "No experience needed — willing to learn" },
  { key: "any",         tr: "Fark etmez", en: "Either is fine" },
];

// Gönüllünün çiftlik deneyimi (gönüllü profilinde zorunlu)
export const FARM_EXPERIENCE: LabeledKey[] = [
  { key: "experienced", tr: "Çiftlik hayatında deneyimliyim", en: "Experienced in farm life" },
  { key: "willing",     tr: "Deneyimim yok ama öğrenmeye çok istekliyim", en: "No experience but eager to learn" },
];

export function labelOf(list: LabeledKey[], key: string, lang: string): string {
  const f = list.find((x) => x.key === key);
  return f ? (lang === "en" ? f.en : f.tr) : key;
}

export function iconOf(list: LabeledKey[], key: string): string {
  return list.find((x) => x.key === key)?.icon ?? "•";
}

// Boş mu? (hiç alan doldurulmamışsa host bölümünü gösterme)
export function hostIsEmpty(h?: HostDetails | null): boolean {
  if (!h) return true;
  return !(
    h.work || h.hoursNote || h.accommodation || h.meals || h.learn || h.nearby || h.daysOff || h.wantsExperience ||
    (h.helpTypes && h.helpTypes.length) || (h.amenities && h.amenities.length) ||
    (h.mealTypes && h.mealTypes.length) ||
    (h.languages && h.languages.length) || (h.dailyRoutine && h.dailyRoutine.length) ||
    (h.houseRules && h.houseRules.length) || (h.around && h.around.length)
  );
}
