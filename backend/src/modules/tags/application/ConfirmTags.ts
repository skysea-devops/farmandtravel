import { withTx } from "../../../shared/db/pool.js";
import { BadRequest } from "../../../shared/errors/index.js";
import type { Axis, TaxonomyRepository } from "../domain/types.js";

// Kullanıcının onayladığı etiketleri member_tags'e yazar.
// Yalnız aktif taksonomide olan (axis,value) çiftleri kabul edilir → taksonomi korunur.
export class ConfirmTags {
  constructor(private taxonomyRepo: TaxonomyRepository) {}

  async execute(memberId: string, tags: { axis: Axis; value: string }[]): Promise<{ written: number }> {
    if (!Array.isArray(tags) || tags.length === 0) throw BadRequest("En az bir etiket gerekli");
    const valid = await this.taxonomyRepo.findByAxisValues(tags);
    if (valid.length === 0) throw BadRequest("Geçerli etiket yok");

    await withTx(async (c) => {
      await c.query("DELETE FROM member_tags WHERE member_id=$1", [memberId]);
      for (const t of valid) {
        await c.query(
          `INSERT INTO member_tags (member_id, taxonomy_id, axis, value)
           VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING`,
          [memberId, t.id, t.axis, t.value],
        );
      }
    });
    return { written: valid.length };
  }
}
