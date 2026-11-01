// Keşif/arama için paylaşılan rol-rozet ve destek-türü yardımcıları.
// Hem public ExplorePage hem app KesfetPage aynı sistemi kullanır.
import type { LucideIcon } from "lucide-react";
import { Handshake, Sprout, Backpack, Users } from "lucide-react";
import { MAP_COLORS, type MapCategory } from "./categories";
import type { MatchTag } from "@/lib/types";

export type Role = MapCategory;

// Rozet metni ikonun hemen yanında net görünür (renk tek başına yetmez).
export const ROLE_META: Record<Role, { tr: string; en: string; color: string; Icon: LucideIcon }> = {
  host_active: { tr: "Gönüllü Arıyor", en: "Looking for volunteers", color: MAP_COLORS.host_active, Icon: Handshake },
  host_idle: { tr: "Paylaşıma Açık", en: "Open to sharing", color: MAP_COLORS.host_idle, Icon: Sprout },
  volunteer: { tr: "Gönüllü", en: "Volunteer", color: MAP_COLORS.volunteer, Icon: Backpack },
  other: { tr: "Topluluk Üyesi", en: "Community member", color: MAP_COLORS.other, Icon: Users },
};

export const isHost = (c: Role) => c === "host_active" || c === "host_idle";

// Destek türü: kişinin sunduğu/aradığı yardımın niteliği (offer/seek etiketlerinden türetilir).
export type Support = "bilgi" | "emek" | "malzeme";
export const SUPPORT_META: { key: Support; tr: string; en: string }[] = [
  { key: "bilgi", tr: "Bilgi", en: "Knowledge" },
  { key: "emek", tr: "Emek", en: "Labor" },
  { key: "malzeme", tr: "Malzeme", en: "Materials" },
];
const SUPPORT_VALUES: Record<Support, Set<string>> = {
  bilgi: new Set(["expertise", "mentoring", "workshops", "knowledge", "mentor"]),
  emek: new Set(["volunteer-labor", "volunteers"]),
  malzeme: new Set(["equipment", "logistics"]),
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
