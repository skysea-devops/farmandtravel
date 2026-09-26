import { query } from "../../../shared/db/pool.js";
import type { Axis, TaxonomyItem, TaxonomyRepository } from "../domain/types.js";

interface Row {
  id: string;
  axis: Axis;
  value: string;
  label_tr: string;
  label_en: string;
  synonyms: string[];
}

const map = (r: Row): TaxonomyItem => ({
  id: r.id,
  axis: r.axis,
  value: r.value,
  labelTr: r.label_tr,
  labelEn: r.label_en,
  synonyms: r.synonyms ?? [],
});

export class TaxonomyRepositoryPg implements TaxonomyRepository {
  async listActive(): Promise<TaxonomyItem[]> {
    const r = await query<Row>(
      "SELECT id,axis,value,label_tr,label_en,synonyms FROM taxonomy WHERE active=true ORDER BY axis,value",
    );
    return r.rows.map(map);
  }

  async findByAxisValues(pairs: { axis: Axis; value: string }[]): Promise<TaxonomyItem[]> {
    if (pairs.length === 0) return [];
    const axes = pairs.map((p) => p.axis);
    const values = pairs.map((p) => p.value);
    const r = await query<Row>(
      `SELECT id,axis,value,label_tr,label_en,synonyms FROM taxonomy
       WHERE active=true AND (axis, value) IN (
         SELECT UNNEST($1::text[]), UNNEST($2::text[])
       )`,
      [axes, values],
    );
    return r.rows.map(map);
  }
}
