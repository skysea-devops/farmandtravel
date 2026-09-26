import { Hono } from "hono";
import { query } from "../../shared/db/pool.js";
import { auth, currentUser } from "../../shared/http/auth.js";
import { scoreCandidate, type Tag } from "./matchmaker.js";

export const discoveryRoutes = new Hono();

interface CandidateRow {
  id: string;
  first_name: string | null;
  country: string | null;
  city: string | null;
  headline: string | null;
  avatar_key: string | null;
  tags: Tag[];
}

async function myTags(memberId: string): Promise<Tag[]> {
  const r = await query<Tag & { label_tr: string; label_en: string }>(
    `SELECT mt.axis, mt.value, tx.label_tr AS "labelTr", tx.label_en AS "labelEn"
       FROM member_tags mt
       LEFT JOIN taxonomy tx ON tx.axis = mt.axis AND tx.value = mt.value
      WHERE mt.member_id = $1`,
    [memberId],
  );
  return r.rows;
}

async function candidates(excludeId: string): Promise<CandidateRow[]> {
  const r = await query<CandidateRow>(
    `SELECT m.id, m.first_name, m.country, m.city, m.headline, m.avatar_key,
            COALESCE(
              json_agg(
                json_build_object('axis', t.axis, 'value', t.value,
                                  'labelTr', tx.label_tr, 'labelEn', tx.label_en)
              ) FILTER (WHERE t.axis IS NOT NULL), '[]'
            ) AS tags
       FROM members m
       LEFT JOIN member_tags t ON t.member_id = m.id
       LEFT JOIN taxonomy tx ON tx.axis = t.axis AND tx.value = t.value
      WHERE m.id <> $1
        AND m.status IN ('profile_complete','active')
        AND m.first_name IS NOT NULL
      GROUP BY m.id`,
    [excludeId],
  );
  return r.rows;
}

function publicMatch(cd: CandidateRow, score: number, matched: Tag[]) {
  return {
    id: cd.id,
    firstName: cd.first_name,
    country: cd.country,
    city: cd.city,
    headline: cd.headline,
    avatarKey: cd.avatar_key,
    tags: cd.tags,
    score,
    matched,
  };
}

// Panel/dashboard payload: stats + top matches + pending requests.
// Connections/messages/views land in later sprints (0 for now).
discoveryRoutes.get("/me/dashboard", auth, async (c) => {
  const { memberId } = currentUser(c);
  const mine = await myTags(memberId);
  const scored = (await candidates(memberId))
    .map((cd) => {
      const { score, matched } = scoreCandidate(mine, cd.tags);
      return publicMatch(cd, score, matched);
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  return c.json({
    stats: {
      matches: scored.length,
      pendingConnections: 0,
      unreadMessages: 0,
      profileViews: 0,
    },
    matches: scored.slice(0, 12),
    pendingRequests: [],
  });
});
