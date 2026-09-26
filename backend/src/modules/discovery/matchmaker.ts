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
  "seek:networking": ["seek:networking"], // networking is mutual
  "offer:volunteer-labor": ["seek:volunteers"],
  "offer:mentoring": ["seek:mentor"],
  "offer:expertise": ["seek:knowledge"],
  "offer:partnership": ["seek:partner"],
  "offer:equipment": ["seek:equipment"],
  "offer:funding": ["seek:funding"],
  "offer:place-experience": ["seek:hosting"],
};

export interface MatchScore {
  score: number;
  matched: Tag[]; // the candidate's tags that matched me (for "why matched" chips)
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
