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
  bio?: string | null;
  avatarKey: string | null;
  tags: MatchTag[];
  score: number;
  matched: MatchTag[];
}
export interface PendingRequest {
  connectionId: string;
  message: string | null;
  createdAt: string;
  member: { id: string; firstName: string | null; country: string | null; city: string | null; headline: string | null; avatarKey: string | null };
}
export interface Dashboard {
  stats: { matches: number; pendingConnections: number; connections?: number; unreadMessages: number; profileViews: number };
  matches: MatchCard[];
  pendingRequests: PendingRequest[];
}

export interface Contact {
  lastName: string | null;
  contactEmail: string | null;
  phone: string | null;
  socials: Record<string, unknown> | null;
  employer: string | null;
  addressExact: string | null;
}
export interface ConnectionState {
  connectionId: string;
  status: "pending" | "accepted" | "rejected";
  direction: "incoming" | "outgoing";
}
export interface MemberDetail extends MatchCard {
  connection: ConnectionState | null;
  contact: Contact | null;
}
export interface ConnItem {
  connectionId: string;
  member: MatchCard;
  message?: string | null;
  createdAt?: string;
  since?: string | null;
  contact?: Contact;
}
export interface Connections {
  incoming: ConnItem[];
  outgoing: ConnItem[];
  accepted: ConnItem[];
}

export interface MiniMember {
  id: string;
  firstName: string | null;
  country: string | null;
  city: string | null;
  headline: string | null;
  avatarKey: string | null;
}
export interface Conversation {
  connectionId: string;
  member: MiniMember;
  lastBody: string | null;
  lastAt: string | null;
  lastSender: string | null;
  unread: number;
}
export interface Message {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}
export interface Thread {
  connectionId: string;
  me: string;
  other: MiniMember | null;
  messages: Message[];
}
