import { describe, it, expect } from "vitest";
import { StubTagInferrer } from "../src/modules/tags/infrastructure/TagInferrer.js";
import type { TaxonomyItem } from "../src/modules/tags/domain/types.js";

const taxonomy: TaxonomyItem[] = [
  { id: "1", axis: "situation", value: "farm-owner", labelTr: "Çiftlik sahibi", labelEn: "Farm owner", synonyms: ["çiftlik", "çiftçi"] },
  { id: "2", axis: "seek", value: "volunteers", labelTr: "Gönüllü arıyorum", labelEn: "Looking for volunteers", synonyms: ["gönüllü"] },
  { id: "3", axis: "offer", value: "expertise", labelTr: "Uzmanlık sunuyorum", labelEn: "Offering expertise", synonyms: ["uzmanlık", "danışmanlık"] },
  { id: "4", axis: "topic", value: "permaculture", labelTr: "Permakültür", labelEn: "Permaculture", synonyms: ["permakültür"] },
];

describe("StubTagInferrer", () => {
  it("çiftlik sahibi + gönüllü arayan metni doğru etiketler", async () => {
    const inferrer = new StubTagInferrer();
    const res = await inferrer.infer(
      "Permakültür çiftliğim var, hasat için gönüllü arıyorum",
      [],
      taxonomy,
    );
    const keys = res.map((r) => `${r.axis}:${r.value}`);
    expect(keys).toContain("situation:farm-owner");
    expect(keys).toContain("seek:volunteers");
    expect(keys).toContain("topic:permaculture");
  });

  it("yalnız taksonomideki etiketleri döndürür", async () => {
    const inferrer = new StubTagInferrer();
    const res = await inferrer.infer("uzmanlık sunuyorum", [], taxonomy);
    expect(res.every((r) => taxonomy.some((t) => t.axis === r.axis && t.value === r.value))).toBe(true);
  });
});
