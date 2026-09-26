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
  bio: string | null;
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

const CARD_SELECT = `
  SELECT m.id, m.first_name, m.country, m.city, m.headline, m.bio, m.avatar_key,
         COALESCE(
           json_agg(
             json_build_object('axis', t.axis, 'value', t.value,
                               'labelTr', tx.label_tr, 'labelEn', tx.label_en)
           ) FILTER (WHERE t.axis IS NOT NULL), '[]'
         ) AS tags
    FROM members m
    LEFT JOIN member_tags t ON t.member_id = m.id
    LEFT JOIN taxonomy tx ON tx.axis = t.axis AND tx.value = t.value`;

async function candidates(excludeId: string): Promise<CandidateRow[]> {
  const r = await query<CandidateRow>(
    `${CARD_SELECT}
      WHERE m.id <> $1
        AND m.status IN ('profile_complete','active')
        AND m.first_name IS NOT NULL
      GROUP BY m.id`,
    [excludeId],
  );
  return r.rows;
}

async function oneMember(id: string): Promise<CandidateRow | null> {
  const r = await query<CandidateRow>(
    `${CARD_SELECT}
      WHERE m.id = $1
        AND m.status IN ('profile_complete','active')
      GROUP BY m.id`,
    [id],
  );
  return r.rows[0] ?? null;
}

function publicMatch(cd: CandidateRow, score: number, matched: Tag[]) {
  return {
    id: cd.id,
    firstName: cd.first_name,
    country: cd.country,
    city: cd.city,
    headline: cd.headline,
    bio: cd.bio,
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

// Discovery list: all active members with my match score (Keşfet). Filtering is
// done client-side for now (small dataset).
discoveryRoutes.get("/members", auth, async (c) => {
  const { memberId } = currentUser(c);
  const mine = await myTags(memberId);
  const members = (await candidates(memberId))
    .map((cd) => {
      const { score, matched } = scoreCandidate(mine, cd.tags);
      return publicMatch(cd, score, matched);
    })
    .sort((a, b) => b.score - a.score || (a.firstName ?? "").localeCompare(b.firstName ?? "", "tr"));
  return c.json({ members });
});

// Single member public view (contact stays hidden until an accepted connection).
discoveryRoutes.get("/members/:id", auth, async (c) => {
  const { memberId } = currentUser(c);
  const id = c.req.param("id");
  const cd = id ? await oneMember(id) : null;
  if (!cd) return c.json({ error: "not_found", message: "Üye bulunamadı" }, 404);
  const { score, matched } = scoreCandidate(await myTags(memberId), cd.tags);
  return c.json(publicMatch(cd, score, matched));
});
