import { Hono } from "hono";
import { query } from "../../shared/db/pool.js";
import { auth, currentUser, requireMembership } from "../../shared/http/auth.js";
import { safeUrl, withAvatarUrls } from "../../shared/media/s3.js";
import { loadPhotos } from "../members/interface/routes.js";
import { scoreCandidate, type Tag } from "./matchmaker.js";
import { reqLang } from "../../shared/http/lang.js";
import { translateFields } from "../../shared/text/translate.js";

export const discoveryRoutes = new Hono();

// Member free-text fields machine-translated on the English site. City & first name are
// proper nouns (left as-is); tags already carry labelEn.
const MEMBER_TEXT = ["bio", "headline", "country"] as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (s: string | undefined): s is string => !!s && UUID_RE.test(s);

interface CandidateRow {
  id: string;
  first_name: string | null;
  country: string | null;
  city: string | null;
  headline: string | null;
  bio: string | null;
  avatar_key: string | null;
  rating_avg: string | number | null;
  rating_count: number | null;
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
         COALESCE((SELECT round(avg(rating)::numeric, 1) FROM visible_reviews WHERE reviewee_id = m.id), 0) AS rating_avg,
         (SELECT count(*)::int FROM visible_reviews WHERE reviewee_id = m.id) AS rating_count,
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
        AND m.is_official = false
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
        AND m.is_official = false
      GROUP BY m.id`,
    [id],
  );
  return r.rows[0] ?? null;
}

async function connectionWith(me: string, other: string) {
  const r = await query<{ id: string; status: string; requester_id: string }>(
    `SELECT id, status, requester_id FROM connections
      WHERE (requester_id=$1 AND addressee_id=$2) OR (requester_id=$2 AND addressee_id=$1)
      LIMIT 1`,
    [me, other],
  );
  if (!r.rowCount || !r.rows[0]) return null;
  const c = r.rows[0];
  return { connectionId: c.id, status: c.status, direction: c.requester_id === me ? "outgoing" : "incoming" };
}

async function contactOf(id: string) {
  const r = await query(
    `SELECT last_name AS "lastName", contact_email AS "contactEmail", phone,
            socials, employer, address_exact AS "addressExact"
       FROM members WHERE id=$1`,
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
    ratingAvg: Number(cd.rating_avg ?? 0),
    ratingCount: Number(cd.rating_count ?? 0),
    tags: cd.tags,
    score,
    matched,
  };
}

// Panel/dashboard payload: stats + top matches + pending requests.
// Connections/messages/views land in later sprints (0 for now).
discoveryRoutes.get("/me/dashboard", auth, requireMembership, async (c) => {
  const { memberId } = currentUser(c);
  const mine = await myTags(memberId);
  const scored = (await candidates(memberId))
    .map((cd) => {
      const { score, matched } = scoreCandidate(mine, cd.tags);
      return publicMatch(cd, score, matched);
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  // These three are independent — run them in parallel instead of serially.
  const [pending, acceptedCount, unread] = await Promise.all([
    // Incoming pending connection requests.
    query(
      `SELECT c.id AS "connectionId", c.message, c.created_at AS "createdAt",
              json_build_object('id', o.id, 'firstName', o.first_name, 'country', o.country,
                                'city', o.city, 'headline', o.headline, 'avatarKey', o.avatar_key) AS member
         FROM connections c JOIN members o ON o.id = c.requester_id
        WHERE c.addressee_id = $1 AND c.status = 'pending'
        ORDER BY c.created_at DESC`,
      [memberId],
    ),
    query<{ n: string }>(
      `SELECT count(*)::int AS n FROM connections
        WHERE (requester_id=$1 OR addressee_id=$1) AND status='accepted'`,
      [memberId],
    ),
    query<{ n: string }>(
      `SELECT count(*)::int AS n FROM messages msg
         JOIN connections c ON c.id = msg.connection_id
        WHERE msg.sender_id <> $1 AND msg.read_at IS NULL
          AND (c.requester_id = $1 OR c.addressee_id = $1)`,
      [memberId],
    ),
  ]);

  const pendingWithAvatar = await Promise.all(
    pending.rows.map(async (r: Record<string, unknown>) => ({
      ...r,
      member: { ...(r.member as Record<string, unknown>), avatarUrl: await safeUrl((r.member as { avatarKey?: string | null }).avatarKey) },
    })),
  );

  const lang = reqLang(c);
  const topMatches = await withAvatarUrls(scored.slice(0, 12));
  await translateFields(topMatches, MEMBER_TEXT, lang);
  await translateFields(
    pendingWithAvatar.map((p) => p.member as Record<string, unknown>),
    ["headline", "country"],
    lang,
  );

  return c.json({
    stats: {
      matches: scored.length,
      pendingConnections: pending.rowCount ?? 0,
      connections: Number(acceptedCount.rows[0]?.n ?? 0),
      unreadMessages: Number(unread.rows[0]?.n ?? 0),
      profileViews: 0,
    },
    matches: topMatches,
    pendingRequests: pendingWithAvatar,
  });
});

// Discovery list: all active members with my match score (Keşfet). Filtering is
// done client-side for now (small dataset).
discoveryRoutes.get("/members", auth, requireMembership, async (c) => {
  const { memberId } = currentUser(c);
  const mine = await myTags(memberId);
  const members = (await candidates(memberId))
    .map((cd) => {
      const { score, matched } = scoreCandidate(mine, cd.tags);
      return publicMatch(cd, score, matched);
    })
    .sort((a, b) => b.score - a.score || (a.firstName ?? "").localeCompare(b.firstName ?? "", "tr"));
  const withUrls = await withAvatarUrls(members);
  await translateFields(withUrls, MEMBER_TEXT, reqLang(c));
  return c.json({ members: withUrls });
});

// PUBLIC teaser (no auth): safe projection of eligible members for the marketing
// Keşfet page. No contact, no cognito_sub, no match score — just enough to browse
// and be enticed to sign up. Registered as a public route in API Gateway.
discoveryRoutes.get("/public/members", async (c) => {
  const rows = (await candidates("00000000-0000-0000-0000-000000000000")).map((cd) => {
    const tags = cd.tags ?? [];
    const dir: "offer" | "seek" = tags.some((t) => t.axis === "offer") ? "offer" : "seek";
    return {
      id: cd.id,
      firstName: cd.first_name,
      country: cd.country,
      city: cd.city,
      headline: cd.headline,
      avatarKey: cd.avatar_key,
      ratingAvg: Number(cd.rating_avg ?? 0),
      ratingCount: Number(cd.rating_count ?? 0),
      tags,
      dir,
    };
  });
  const withUrls = await withAvatarUrls(rows);
  await translateFields(withUrls, ["headline", "country"], reqLang(c));
  return c.json({ members: withUrls });
});

// Single member public view (contact stays hidden until an accepted connection).
discoveryRoutes.get("/members/:id", auth, requireMembership, async (c) => {
  const { memberId } = currentUser(c);
  const id = c.req.param("id");
  // Reject malformed ids up front — a non-UUID would otherwise blow up the pg query.
  if (!isUuid(id)) return c.json({ error: "not_found", message: "Üye bulunamadı" }, 404);
  const cd = await oneMember(id);
  if (!cd) return c.json({ error: "not_found", message: "Üye bulunamadı" }, 404);
  const { score, matched } = scoreCandidate(await myTags(memberId), cd.tags);
  const connection = await connectionWith(memberId, cd.id);
  const contact = connection?.status === "accepted" ? await contactOf(cd.id) : null;
  const [avatarUrl, photos, savedRow] = await Promise.all([
    safeUrl(cd.avatar_key),
    loadPhotos(cd.id),
    query("SELECT 1 FROM saved_members WHERE saver_id=$1 AND saved_id=$2", [memberId, cd.id]),
  ]);
  const dto = {
    ...publicMatch(cd, score, matched),
    avatarUrl,
    photos,
    connection,
    contact,
    saved: (savedRow.rowCount ?? 0) > 0,
  };
  await translateFields([dto], MEMBER_TEXT, reqLang(c));
  return c.json(dto);
});
