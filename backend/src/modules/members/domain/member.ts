import type { Axis } from "../../tags/domain/types.js";

export type MemberStatus = "onboarding" | "profile_complete" | "active" | "suspended";

export interface MemberTag {
  axis: Axis;
  value: string;
  labelTr: string;
  labelEn: string;
}

// Sahibinin gördüğü tam kayıt (public + private + draft).
export interface MemberFull {
  id: string;
  status: MemberStatus;
  plan: string;
  firstName: string | null;
  country: string | null;
  city: string | null;
  languages: string[];
  headline: string | null;
  bio: string | null;
  avatarKey: string | null;
  lastName: string | null;
  contactEmail: string | null;
  phone: string | null;
  socials: Record<string, unknown> | null;
  employer: string | null;
  addressExact: string | null;
  profile: Record<string, unknown>;
  draft: Record<string, unknown>;
  joinedAt: string;
  tags: MemberTag[];
}

// Bağlantı öncesi herkese görünen alanlar (şehir dahil, tam adres hariç).
export interface MemberPublicView {
  id: string;
  firstName: string | null;
  country: string | null;
  city: string | null;
  languages: string[];
  headline: string | null;
  bio: string | null;
  avatarKey: string | null;
  tags: MemberTag[];
}

// Karşılıklı kabul sonrası açılan ek iletişim alanları.
export interface MemberContact {
  lastName: string | null;
  contactEmail: string | null;
  phone: string | null;
  socials: Record<string, unknown> | null;
  employer: string | null;
  addressExact: string | null;
}

// Profil tamamlanma kuralı: ad + ülke yeterli (fotoğraf yükleme sonra eklenecek).
export function canCompleteProfile(m: Pick<MemberFull, "firstName" | "country">): boolean {
  return Boolean(m.firstName && m.country);
}
