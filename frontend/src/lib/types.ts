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

export type ActivityKind = "video" | "photo" | "meeting" | "announcement";
export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  desc: string | null;
  image: string | null;
  youtubeId: string | null;
  author: string | null;
  place: string | null;
  when: string | null;
  online: boolean | null;
  pinned: boolean;
  status: "pending" | "published" | "rejected";
  date: string; // ISO timestamp
}

export interface ActivityEligibility {
  eligible: boolean;
  canSubmit: boolean;
  isAdmin: boolean;
  connections: number;
  ratingCount: number;
  ratingAvg: number;
  need: { connections: number; reviews: number; rating: number };
}

export interface Profile {
  id: string;
  status: "onboarding" | "profile_complete" | "active" | "suspended";
  plan?: "none" | "frontier" | "active";
  isAdmin?: boolean;
  firstName: string | null;
  country: string | null;
  city: string | null;
  languages: string[];
  headline: string | null;
  bio: string | null;
  avatarKey: string | null;
  lastName?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  socials?: Record<string, unknown> | null;
  employer?: string | null;
  addressExact?: string | null;
  profile: Record<string, unknown>;
  avatarUrl?: string | null;
  photos?: Photo[];
  tags: { axis: Axis; value: string; labelTr: string; labelEn: string }[];
}

export interface MatchTag { axis: Axis; value: string; labelTr: string; labelEn: string }

// Public (no-auth) teaser projection served by GET /public/members.
export interface PublicMember {
  id: string;
  firstName: string | null;
  country: string | null;
  city: string | null;
  headline: string | null;
  avatarKey: string | null;
  avatarUrl?: string | null;
  ratingAvg: number;
  ratingCount: number;
  tags: MatchTag[];
  dir: "offer" | "seek";
}
export interface Photo { id: string; url: string | null; caption: string | null }
export interface MatchCard {
  id: string;
  firstName: string | null;
  country: string | null;
  city: string | null;
  headline: string | null;
  bio?: string | null;
  avatarKey: string | null;
  avatarUrl?: string | null;
  ratingAvg?: number;
  ratingCount?: number;
  tags: MatchTag[];
  score: number;
  matched: MatchTag[];
  isOfficial?: boolean;
}

export interface Review {
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewer: { id: string; firstName: string | null; avatarUrl: string | null };
}
export interface ReviewsData {
  summary: { avg: number; count: number };
  reviews: Review[];
  canReview: boolean;
  myReview: { rating: number; comment: string | null; state?: string } | null;
}
export type ReviewState = "published" | "held" | "pending" | "rejected" | "removed";
export interface WrittenReview {
  rating: number;
  comment: string | null;
  createdAt: string;
  state: ReviewState;
  reviewee: { id: string; firstName: string | null; avatarUrl: string | null };
}
export interface MyReviewsData {
  received: { summary: { avg: number; count: number }; reviews: Review[] };
  written: WrittenReview[];
  pendingReceived: number;
}
export interface AdminInboxMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  city: string | null;
  country: string | null;
  avatarKey: string | null;
  avatarUrl?: string | null;
}
export interface AdminInboxItem {
  connectionId: string;
  member: AdminInboxMember;
  lastBody: string | null;
  lastAt: string | null;
  lastSender: string | null;
  unread: number;
}
export interface AdminInboxThread {
  connectionId: string;
  officialId: string;
  member: AdminInboxMember | null;
  messages: Message[];
}
export interface AdminReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  flagged: boolean;
  createdAt: string;
  reviewerId: string;
  reviewerName: string | null;
  revieweeId: string;
  revieweeName: string | null;
}
export interface PendingRequest {
  connectionId: string;
  message: string | null;
  createdAt: string;
  member: { id: string; firstName: string | null; country: string | null; city: string | null; headline: string | null; avatarKey: string | null; avatarUrl?: string | null };
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
  photos?: Photo[];
  connection: ConnectionState | null;
  contact: Contact | null;
  saved?: boolean;
}

export interface SavedCard {
  id: string;
  firstName: string | null;
  country: string | null;
  city: string | null;
  headline: string | null;
  avatarKey?: string | null;
  avatarUrl?: string | null;
  tags: MatchTag[];
}

export interface AppNotification {
  id: string;
  type: "connection_request" | "connection_accepted" | "message" | "review";
  data: { connectionId?: string };
  createdAt: string;
  read: boolean;
  actor: { id: string; firstName: string | null; avatarUrl: string | null } | null;
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
  avatarUrl?: string | null;
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
  hasMore: boolean;
}
