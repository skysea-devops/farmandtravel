// Keşif/arama için paylaşılan rol-rozet ve destek-türü yardımcıları.
// Hem public ExplorePage hem app KesfetPage aynı sistemi kullanır.
import type { LucideIcon } from "lucide-react";
import { Handshake, Sprout, Backpack, Users } from "lucide-react";
import { MAP_COLORS, type MapCategory } from "./categories";
import type { MatchTag } from "@/lib/types";

export type Role = MapCategory;

// tr/en: tek kişiye ait kart rozeti (kısa). catTr/catEn: filtre & harita lejandı
// kategori adı (çoğul) — ikisi harita lejandıyla birebir aynı.
export const ROLE_META: Record<Role, { tr: string; en: string; catTr: string; catEn: string; color: string; Icon: LucideIcon }> = {
  host_active: { tr: "Gönüllü Arıyor", en: "Looking for volunteers", catTr: "Gönüllü arayan yer sahipleri", catEn: "Place owners seeking volunteers", color: MAP_COLORS.host_active, Icon: Handshake },
  host_idle: { tr: "Paylaşıma Açık", en: "Open to sharing", catTr: "Yer sahibi (şu an aramıyor)", catEn: "Place owners (not seeking now)", color: MAP_COLORS.host_idle, Icon: Sprout },
  volunteer: { tr: "Gönüllü", en: "Volunteer", catTr: "Gönüllüler", catEn: "Volunteers", color: MAP_COLORS.volunteer, Icon: Backpack },
  other: { tr: "Topluluk Üyesi", en: "Community member", catTr: "Öğrenen & destekçiler", catEn: "Learners & supporters", color: MAP_COLORS.other, Icon: Users },
};

export const isHost = (c: Role) => c === "host_active" || c === "host_idle";

// Destek türü: kişinin sunduğu/aradığı yardımın niteliği (offer/seek etiketlerinden türetilir).
// Host lojistiği değil; topluluğun paylaşım/dayanışma eksenleri.
export type Support = "bilgi" | "egitim" | "emek" | "malzeme" | "ortaklik";
export const SUPPORT_META: { key: Support; tr: string; en: string }[] = [
  { key: "bilgi", tr: "Bilgi & deneyim", en: "Knowledge & experience" },
  { key: "egitim", tr: "Eğitim & atölye", en: "Training & workshops" },
  { key: "emek", tr: "Emek & gönüllülük", en: "Labor & volunteering" },
  { key: "malzeme", tr: "Malzeme, tohum & ekipman", en: "Materials, seeds & tools" },
  { key: "ortaklik", tr: "Ortaklık & ağ", en: "Partnership & network" },
];
const SUPPORT_VALUES: Record<Support, Set<string>> = {
  bilgi: new Set(["expertise", "mentoring", "knowledge", "mentor"]),
  egitim: new Set(["workshops"]),
  emek: new Set(["volunteer-labor", "volunteers"]),
  malzeme: new Set(["equipment", "logistics"]),
  ortaklik: new Set(["partnership", "partner", "networking"]),
};

// Bir üyenin kapsadığı destek türleri (offer + seek eksenindeki etiketlerine göre).
export function supportOf(tags: MatchTag[]): Set<Support> {
  const out = new Set<Support>();
  for (const tg of tags) {
    if (tg.axis !== "offer" && tg.axis !== "seek") continue;
    for (const s of SUPPORT_META) {
      if (SUPPORT_VALUES[s.key].has(tg.value)) out.add(s.key);
    }
  }
  return out;
}

// "Katıldı: Ekim 2026" biçimi.
export function joinedLabel(iso: string | undefined, lang: string): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso).toLocaleDateString(lang === "en" ? "en-GB" : "tr-TR", { month: "long", year: "numeric" });
    return lang === "en" ? `Joined ${d}` : `Katıldı: ${d}`;
  } catch { return null; }
}
