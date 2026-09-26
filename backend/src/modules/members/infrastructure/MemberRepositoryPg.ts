import { query } from "../../../shared/db/pool.js";
import type { MemberContact, MemberFull, MemberPublicView, MemberTag } from "../domain/member.js";
import { canCompleteProfile } from "../domain/member.js";
import type { MemberRepository, ProfilePatch } from "../domain/MemberRepository.js";

async function loadTags(memberId: string): Promise<MemberTag[]> {
  // Join taxonomy so the client gets human labels, not raw slugs.
  const r = await query<{
    axis: MemberTag["axis"];
    value: string;
    label_tr: string | null;
    label_en: string | null;
  }>(
    `SELECT mt.axis, mt.value, tx.label_tr, tx.label_en
       FROM member_tags mt
       LEFT JOIN taxonomy tx ON tx.axis = mt.axis AND tx.value = mt.value
      WHERE mt.member_id = $1
      ORDER BY mt.axis, mt.value`,
    [memberId],
  );
  return r.rows.map((t) => ({
    axis: t.axis,
    value: t.value,
    labelTr: t.label_tr ?? t.value,
    labelEn: t.label_en ?? t.value,
  }));
}

export class MemberRepositoryPg implements MemberRepository {
  async getFullById(id: string): Promise<MemberFull | null> {
    const r = await query<any>("SELECT * FROM members WHERE id=$1", [id]);
    if (!r.rowCount) return null;
    const m = r.rows[0];
    return {
      id: m.id,
      status: m.status,
      firstName: m.first_name,
      country: m.country,
      city: m.city,
      languages: m.languages ?? [],
      headline: m.headline,
      bio: m.bio,
      avatarKey: m.avatar_key,
      lastName: m.last_name,
      contactEmail: m.contact_email,
      phone: m.phone,
      socials: m.socials,
      employer: m.employer,
      addressExact: m.address_exact,
      profile: m.profile ?? {},
      draft: m.draft ?? {},
      tags: await loadTags(id),
    };
  }

  // PUBLIC projection — private sütunlar SELECT'e hiç girmez.
  async getPublicView(id: string): Promise<MemberPublicView | null> {
    const r = await query<any>(
      `SELECT id, first_name, country, city, languages, headline, bio, avatar_key
       FROM members WHERE id=$1`,
      [id],
    );
    if (!r.rowCount) return null;
    const m = r.rows[0];
    return {
      id: m.id,
      firstName: m.first_name,
      country: m.country,
      city: m.city,
      languages: m.languages ?? [],
      headline: m.headline,
      bio: m.bio,
      avatarKey: m.avatar_key,
      tags: await loadTags(id),
    };
  }

  // CONNECTED projection ek alanları — yalnız accepted connection sonrası çağrılır.
  async getContact(id: string): Promise<MemberContact | null> {
    const r = await query<any>(
      `SELECT last_name, contact_email, phone, socials, employer, address_exact
       FROM members WHERE id=$1`,
      [id],
    );
    if (!r.rowCount) return null;
    const m = r.rows[0];
    return {
      lastName: m.last_name,
      contactEmail: m.contact_email,
      phone: m.phone,
      socials: m.socials,
      employer: m.employer,
      addressExact: m.address_exact,
    };
  }

  async saveDraft(id: string, draft: Record<string, unknown>): Promise<void> {
    await query("UPDATE members SET draft=$2, updated_at=now() WHERE id=$1", [id, draft]);
  }

  async updateProfile(id: string, p: ProfilePatch): Promise<MemberFull> {
    const cols: string[] = [];
    const vals: unknown[] = [];
    const set = (col: string, val: unknown) => {
      if (val !== undefined) {
        vals.push(val);
        cols.push(`${col}=$${vals.length + 1}`);
      }
    };
    set("first_name", p.firstName);
    set("country", p.country);
    set("city", p.city);
    set("languages", p.languages);
    set("headline", p.headline);
    set("bio", p.bio);
    set("avatar_key", p.avatarKey);
    set("last_name", p.lastName);
    set("contact_email", p.contactEmail);
    set("phone", p.phone);
    set("socials", p.socials);
    set("employer", p.employer);
    set("address_exact", p.addressExact);
    set("profile", p.profile);

    if (cols.length > 0) {
      await query(`UPDATE members SET ${cols.join(", ")}, updated_at=now() WHERE id=$1`, [id, ...vals]);
    }

    // Zorunlu alanlar tamamlandıysa status'u profile_complete'e çek.
    const full = await this.getFullById(id);
    if (full && full.status === "onboarding" && canCompleteProfile(full)) {
      await query("UPDATE members SET status='profile_complete', updated_at=now() WHERE id=$1", [id]);
      full.status = "profile_complete";
    }
    return full!;
  }
}
