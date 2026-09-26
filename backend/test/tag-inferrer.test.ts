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
  it("etiketleri yalnız açık quick-pick seçimlerinden üretir", async () => {
    const inferrer = new StubTagInferrer();
    const res = await inferrer.infer(
      "Permakültür çiftliğim var, hasat için gönüllü arıyorum",
      ["Bir yerim/çiftliğim var", "Gönüllü arıyorum"],
      taxonomy,
    );
    const keys = res.map((r) => `${r.axis}:${r.value}`).sort();
    expect(keys).toEqual(["seek:volunteers", "situation:farm-owner"]);
  });

  it("serbest metinden otomatik etiket üretmez", async () => {
    const inferrer = new StubTagInferrer();
    const res = await inferrer.infer("çiftliklerde kalıp deneyim kazanmak istiyorum", [], taxonomy);
    expect(res).toHaveLength(0);
  });

  it("yalnız taksonomide olan etiketleri döndürür", async () => {
    const inferrer = new StubTagInferrer();
    // 'Mentor arıyorum' -> seek:mentor, ama bu taksonomide yok -> elenmeli
    const res = await inferrer.infer("", ["Uzmanlık sunuyorum", "Mentor arıyorum"], taxonomy);
    const keys = res.map((r) => `${r.axis}:${r.value}`);
    expect(keys).toEqual(["offer:expertise"]);
  });
});
