import type { MemberContact, MemberFull, MemberPublicView } from "./member.js";

// Repository portu — application yalnızca bunu görür.
export interface MemberRepository {
  getFullById(id: string): Promise<MemberFull | null>;
  getPublicView(id: string): Promise<MemberPublicView | null>;
  getContact(id: string): Promise<MemberContact | null>;
  saveDraft(id: string, draft: Record<string, unknown>): Promise<void>;
  updateProfile(id: string, patch: ProfilePatch): Promise<MemberFull>;
}

// Profil güncelleme alanları (public + private + serbest profile).
export interface ProfilePatch {
  firstName?: string;
  country?: string;
  city?: string;
  languages?: string[];
  headline?: string;
  bio?: string;
  avatarKey?: string;
  lastName?: string;
  contactEmail?: string;
  phone?: string;
  socials?: Record<string, unknown>;
  employer?: string;
  addressExact?: string;
  profile?: Record<string, unknown>;
}
