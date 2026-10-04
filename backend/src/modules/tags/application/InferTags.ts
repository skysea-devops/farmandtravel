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
    // Best-effort: if the inferrer fails (e.g. Bedrock model access not yet granted),
    // return no suggestions rather than 500 — onboarding still works via quick-picks.
    let suggestions: InferredTag[] = [];
    try {
      suggestions = await this.inferrer.infer(input.freeText ?? "", input.quickPicks ?? [], taxonomy);
    } catch {
      suggestions = [];
    }
    return { suggestions, taxonomy };
  }
}
