// Complementary matching. seek and offer use different vocabularies, so we map each
// need to the offer that satisfies it (and vice versa). Shared topics and mutual
// networking also score. Situations are not matched.
import type { Axis } from "../tags/domain/types.js";

export interface Tag {
  axis: Axis;
  value: string;
  labelTr: string;
  labelEn: string;
}

// `${axis}:${value}` -> the counterpart tags that satisfy it.
const COMPLEMENTS: Record<string, string[]> = {
  "seek:volunteers": ["offer:volunteer-labor"],
  "seek:mentor": ["offer:mentoring"],
  "seek:knowledge": ["offer:expertise"],
  "seek:partner": ["offer:partnership"],
  "seek:equipment": ["offer:equipment"],
  "seek:funding": ["offer:funding"],
  "seek:hosting": ["offer:place-experience"],
  "seek:workshops": ["offer:workshops"],
  "seek:logistics": ["offer:logistics"],
  "seek:networking": ["seek:networking"],       // networking is mutual
  "seek:international": ["seek:international"],   // "open to abroad" is mutual
  "offer:volunteer-labor": ["seek:volunteers"],
  "offer:mentoring": ["seek:mentor"],
  "offer:expertise": ["seek:knowledge"],
  "offer:partnership": ["seek:partner"],
  "offer:equipment": ["seek:equipment"],
  "offer:funding": ["seek:funding"],
  "offer:workshops": ["seek:workshops"],
  "offer:logistics": ["seek:logistics"],
  "offer:place-experience": ["seek:hosting"],
};

export interface MatchScore {
  score: number;
  matched: Tag[]; // the candidate's tags that matched me (for "why matched" chips)
}

// A believable, spread-out match percentage for the UI. The raw score is a small
// integer (often 1), so a flat score→% map clusters everyone at the same number.
// Here complementary need/offer matches weigh most, shared topics less, and same
// city/country plus a small quality nudge break ties so cards don't all read alike.
export function matchPercent(
  matched: Tag[],
  opts: { sameCity?: boolean; sameCountry?: boolean; ratingAvg?: number },
): number {
  if (matched.length === 0) return 0;
  const topics = matched.filter((t) => t.axis === "topic").length;
  const needs = matched.length - topics; // complementary (seek↔offer) matches
  let pct = 52 + needs * 13 + topics * 7;
  if (opts.sameCity) pct += 8;
  else if (opts.sameCountry) pct += 5;
  pct += Math.min(3, Math.max(0, Math.round(((opts.ratingAvg ?? 0) - 4) * 2)));
  return Math.max(55, Math.min(97, pct));
}

export function scoreCandidate(myTags: Tag[], theirTags: Tag[]): MatchScore {
  const theirByKey = new Map(theirTags.map((t) => [`${t.axis}:${t.value}`, t]));
  const matched = new Map<string, Tag>();

  for (const my of myTags) {
    // complementary need/offer
    for (const key of COMPLEMENTS[`${my.axis}:${my.value}`] ?? []) {
      const hit = theirByKey.get(key);
      if (hit) matched.set(key, hit);
    }
    // shared topic (common interest)
    if (my.axis === "topic") {
      const hit = theirByKey.get(`topic:${my.value}`);
      if (hit) matched.set(`topic:${my.value}`, hit);
    }
  }

  return { score: matched.size, matched: [...matched.values()] };
}
