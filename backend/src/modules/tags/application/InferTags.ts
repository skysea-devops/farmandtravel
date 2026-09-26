import type { InferredTag, TagInferrer, TaxonomyItem, TaxonomyRepository } from "../domain/types.js";

// Serbest metinden etiket önerir (kullanıcıya onaylatılmak üzere).
export class InferTags {
  constructor(
    private taxonomyRepo: TaxonomyRepository,
    private inferrer: TagInferrer,
  ) {}

  async execute(input: { freeText: string; quickPicks?: string[] }): Promise<{
    suggestions: InferredTag[];
    taxonomy: TaxonomyItem[];
  }> {
    const taxonomy = await this.taxonomyRepo.listActive();
    const suggestions = await this.inferrer.infer(input.freeText ?? "", input.quickPicks ?? [], taxonomy);
    return { suggestions, taxonomy };
  }
}
