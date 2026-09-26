// Etiket alanı türleri.
export type Axis = "seek" | "offer" | "topic" | "situation";
export const AXES: Axis[] = ["seek", "offer", "topic", "situation"];

export interface TaxonomyItem {
  id: string;
  axis: Axis;
  value: string;
  labelTr: string;
  labelEn: string;
  synonyms: string[];
}

export interface InferredTag {
  axis: Axis;
  value: string;
  confidence: number; // 0..1
}

// Etiket çıkarıcı portu (application bunu görür; impl infrastructure'da).
export interface TagInferrer {
  infer(freeText: string, quickPicks: string[], taxonomy: TaxonomyItem[]): Promise<InferredTag[]>;
}

// Taksonomi repo portu.
export interface TaxonomyRepository {
  listActive(): Promise<TaxonomyItem[]>;
  findByAxisValues(pairs: { axis: Axis; value: string }[]): Promise<TaxonomyItem[]>;
}
