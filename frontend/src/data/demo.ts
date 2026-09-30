// Tag axes match the backend taxonomy (seek/offer/topic/situation).
export type Axis = "seek" | "offer" | "topic" | "situation";

export interface MemberTag {
  axis: Axis;
  label: string; // display label (e.g. "Gönüllü arıyor")
}

export interface DemoMember {
  id: string;
  name: string; // first name only (pre-connection)
  country: string;
  city: string;
  flag: string;
  headline: string;
  dir: "offer" | "seek"; // primary direction (for map pin / filter)
  farm?: boolean;
  topic: string; // topic slug for filtering
  lang: "Türkçe" | "İngilizce";
  tags: MemberTag[];
  photo: string; // scenery/farm thumbnail
  // stylized map position (percent within the map box)
  x: number;
  y: number;
}

const U = "https://images.unsplash.com/";
const q = "?w=400&q=80";

export const DEMO_MEMBERS: DemoMember[] = [
  { id: "marta", name: "Marta", country: "Portekiz", city: "Sintra", flag: "🇵🇹", headline: "permakültür çiftliği",
    dir: "offer", farm: true, topic: "permaculture", lang: "İngilizce",
    tags: [{ axis: "situation", label: "🚜 Çiftlik sahibi" }, { axis: "offer", label: "Yer & deneyim sunuyor" }, { axis: "seek", label: "Gönüllü arıyor" }],
    photo: U + "photo-1416879595882-3373a0480b5b" + q, x: 15, y: 42 },
  { id: "jonas", name: "Jonas", country: "Almanya", city: "Berlin", flag: "🇩🇪", headline: "ekolog",
    dir: "offer", topic: "reforestation", lang: "İngilizce",
    tags: [{ axis: "offer", label: "Uzmanlık sunuyor" }, { axis: "offer", label: "Mentorluk sunuyor" }],
    photo: U + "photo-1441974231531-c6227db76b6e" + q, x: 29, y: 24 },
  { id: "elif", name: "Elif", country: "Türkiye", city: "İzmir", flag: "🇹🇷", headline: "çiftlik hayali",
    dir: "seek", topic: "permaculture", lang: "Türkçe",
    tags: [{ axis: "seek", label: "Mentor arıyor" }, { axis: "seek", label: "Bilgi arıyor" }],
    photo: U + "photo-1523348837708-15d4a09cfac2" + q, x: 73, y: 52 },
  { id: "lucia", name: "Lucia", country: "İspanya", city: "Valensiya", flag: "🇪🇸", headline: "eco-village",
    dir: "seek", topic: "eco-village", lang: "İngilizce",
    tags: [{ axis: "seek", label: "Ortak arıyor" }, { axis: "seek", label: "Gönüllü arıyor" }],
    photo: U + "photo-1449158743715-0a90ebb6d2d8" + q, x: 11, y: 49 },
  { id: "deniz", name: "Deniz", country: "Türkiye", city: "Konya", flag: "🇹🇷", headline: "ziraat mühendisi",
    dir: "offer", topic: "organic", lang: "Türkçe",
    tags: [{ axis: "offer", label: "Danışmanlık sunuyor" }],
    photo: U + "photo-1500382017468-9049fed747ef" + q, x: 80, y: 42 },
  { id: "ayse", name: "Ayşe", country: "Türkiye", city: "Muğla", flag: "🇹🇷", headline: "hayvan barınağı",
    dir: "seek", topic: "wildlife", lang: "Türkçe",
    tags: [{ axis: "seek", label: "Gönüllü arıyor" }],
    photo: U + "photo-1500595046743-cd271d694d30" + q, x: 66, y: 45 },
  { id: "marco", name: "Marco", country: "İtalya", city: "Torino", flag: "🇮🇹", headline: "mimar",
    dir: "offer", topic: "off-grid", lang: "İngilizce",
    tags: [{ axis: "offer", label: "Mimari destek sunuyor" }],
    photo: U + "photo-1470071459604-3b5ec3a7fe05" + q, x: 38, y: 40 },
  { id: "tom", name: "Tom", country: "Hollanda", city: "Utrecht", flag: "🇳🇱", headline: "gıda ormanı",
    dir: "seek", topic: "food-forest", lang: "İngilizce",
    tags: [{ axis: "seek", label: "Bilgi arıyor" }],
    photo: U + "photo-1466692476868-aef1dfb1e735" + q, x: 30, y: 14 },
];

export const CITY_MAP: Record<string, string[]> = {
  "Türkiye": ["İzmir", "Konya", "Muğla"],
  "Portekiz": ["Sintra"],
  "Almanya": ["Berlin"],
  "İspanya": ["Valensiya"],
  "İtalya": ["Torino"],
  "Hollanda": ["Utrecht"],
};

export const TOPICS: { value: string; label: string }[] = [
  { value: "permaculture", label: "Permakültür" },
  { value: "organic", label: "Organik tarım" },
  { value: "eco-village", label: "Eco-village" },
  { value: "wildlife", label: "Doğa & yaban hayatı" },
  { value: "food-forest", label: "Gıda ormanı" },
  { value: "off-grid", label: "Off-grid" },
  { value: "reforestation", label: "Ağaçlandırma" },
];

export interface Category { label: string; photo: string; addable?: boolean; }
export const CATEGORIES: Category[] = [
  { label: "Organik tarım", photo: U + "photo-1416879595882-3373a0480b5b?w=600&q=80" },
  { label: "Permakültür", photo: U + "photo-1523348837708-15d4a09cfac2?w=600&q=80" },
  { label: "Eco-village", photo: U + "photo-1449158743715-0a90ebb6d2d8?w=600&q=80" },
  { label: "Doğa & yaban hayatı", photo: U + "photo-1500595046743-cd271d694d30?w=600&q=80" },
  { label: "Gıda ormanı", photo: U + "photo-1441974231531-c6227db76b6e?w=600&q=80" },
  { label: "Off-grid yaşam", photo: U + "photo-1470071459604-3b5ec3a7fe05?w=600&q=80" },
  { label: "İnziva merkezi", photo: "/community/cat-retreat.jpg", addable: true },
  { label: "Çiftçilik okulu", photo: U + "photo-1560493676-04071c5f467b?w=600&q=80", addable: true },
  { label: "Hayvan barınağı", photo: "/community/cat-shelter.jpg", addable: true },
];
