export type Axis = "seek" | "offer" | "topic" | "situation";

export interface TaxonomyItem {
  id: string;
  axis: Axis;
  value: string;
  labelTr: string;
  labelEn: string;
  synonyms: string[];
}

export interface InferResponse {
  suggestions: { axis: Axis; value: string; confidence: number }[];
  taxonomy: TaxonomyItem[];
}

export interface Profile {
  id: string;
  status: "onboarding" | "profile_complete" | "active" | "suspended";
  firstName: string | null;
  country: string | null;
  city: string | null;
  languages: string[];
  headline: string | null;
  bio: string | null;
  avatarKey: string | null;
  profile: Record<string, unknown>;
  tags: { axis: Axis; value: string; labelTr: string; labelEn: string }[];
}

export interface MatchTag { axis: Axis; value: string; labelTr: string; labelEn: string }
export interface MatchCard {
  id: string;
  firstName: string | null;
  country: string | null;
  city: string | null;
  headline: string | null;
  avatarKey: string | null;
  tags: MatchTag[];
  score: number;
  matched: MatchTag[];
}
export interface Dashboard {
  stats: { matches: number; pendingConnections: number; unreadMessages: number; profileViews: number };
  matches: MatchCard[];
  pendingRequests: unknown[];
}
