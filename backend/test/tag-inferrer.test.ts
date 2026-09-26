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
  it("situation açık seçimden, seek/topic serbest metinden gelir", async () => {
    const inferrer = new StubTagInferrer();
    const res = await inferrer.infer(
      "Permakültür çiftliğim var, hasat için gönüllü arıyorum",
      ["Bir yerim/çiftliğim var"],
      taxonomy,
    );
    const keys = res.map((r) => `${r.axis}:${r.value}`);
    expect(keys).toContain("situation:farm-owner"); // açık seçimden
    expect(keys).toContain("seek:volunteers"); // serbest metinden
    expect(keys).toContain("topic:permaculture"); // serbest metinden
  });

  it("serbest metin tek başına situation üretmez", async () => {
    const inferrer = new StubTagInferrer();
    const res = await inferrer.infer("ileride kendi çiftliğimi kuracağım", [], taxonomy);
    expect(res.every((r) => r.axis !== "situation")).toBe(true);
  });

  it("yalnız taksonomideki etiketleri döndürür", async () => {
    const inferrer = new StubTagInferrer();
    const res = await inferrer.infer("uzmanlık sunuyorum", [], taxonomy);
    expect(res.every((r) => taxonomy.some((t) => t.axis === r.axis && t.value === r.value))).toBe(true);
  });
});
