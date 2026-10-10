// İki TagInferrer implementasyonu:
//  - StubTagInferrer: AI_MODE=stub. Serbest metni + hızlı seçimleri taksonomi
//    synonyms/label ile eşleştiren kural tabanlı; lokal geliştirme/test için.
//  - BedrockTagInferrer: AI_MODE=bedrock. Claude'a aktif taksonomiyi verip
//    metni yalnız o kümeye maplatır.
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { env } from "../../../shared/config/env.js";
import type { Axis, InferredTag, TagInferrer, TaxonomyItem } from "../domain/types.js";

function norm(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .replace(/[İIı]/g, "i")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
}

// Deterministic map from the onboarding UI quick-pick labels to taxonomy tags.
// This is exact (no fuzzy keyword matching), so e.g. "İleride kendi çiftliğimi
// kuracağım" is never mistaken for "Çiftlik sahibi".
const QUICKPICKS: Array<[string, Array<{ axis: Axis; value: string }>]> = [
  // Durum (situation)
  ["Bir yerim/çiftliğim var", [{ axis: "situation", value: "farm-owner" }]],
  ["Bir projem/fikrim var", [{ axis: "situation", value: "has-idea" }]],
  ["İleride kendi çiftliğimi kuracağım", [{ axis: "situation", value: "aspiring-farmer" }]],
  ["Deneyim/gönüllülük arıyorum", [{ axis: "situation", value: "seeking-experience" }]],
  ["Uzmanlık sunuyorum", [{ axis: "offer", value: "expertise" }]],
  ["Öğrenmek istiyorum", [{ axis: "seek", value: "knowledge" }]],
  // Aradıklarım (seek)
  ["Gönüllü arıyorum", [{ axis: "seek", value: "volunteers" }]],
  ["Mentor arıyorum", [{ axis: "seek", value: "mentor" }]],
  ["Bilgi öğrenmek istiyorum", [{ axis: "seek", value: "knowledge" }]],
  ["Ortak arıyorum", [{ axis: "seek", value: "partner" }]],
  ["Ekipman arıyorum", [{ axis: "seek", value: "equipment" }]],
  ["Networking", [{ axis: "seek", value: "networking" }]],
  ["Finansal destekçi arıyorum", [{ axis: "seek", value: "funding" }]],
  ["Konaklama fırsatı arıyorum", [{ axis: "seek", value: "hosting" }]],
  ["Çiftlik hayatını deneyimlemek istiyorum", [{ axis: "seek", value: "hosting" }]],
  ["Eğitim/atölye arıyorum", [{ axis: "seek", value: "workshops" }]],
  ["Araç/lojistik arıyorum", [{ axis: "seek", value: "logistics" }]],
  ["Yurt dışına açığım", [{ axis: "seek", value: "international" }]],
  // Sunduklarım (offer)
  ["Yer & deneyim sunuyorum", [{ axis: "offer", value: "place-experience" }]],
  ["Gönüllü olmak istiyorum", [{ axis: "offer", value: "volunteer-labor" }]],
  ["Mentorluk yapabilirim", [{ axis: "offer", value: "mentoring" }]],
  ["Ortaklık kurabilirim", [{ axis: "offer", value: "partnership" }]],
  ["Ekipman sağlayabilirim", [{ axis: "offer", value: "equipment" }]],
  ["Finansal destek olabilirim", [{ axis: "offer", value: "funding" }]],
  ["Eğitim/atölye veriyorum", [{ axis: "offer", value: "workshops" }]],
  ["Araç/lojistik sağlayabilirim", [{ axis: "offer", value: "logistics" }]],
];
const QUICKPICK_MAP = new Map(QUICKPICKS.map(([k, v]) => [norm(k), v]));

export class StubTagInferrer implements TagInferrer {
  // Stub mode maps ONLY the explicit quick-pick selections to tags. Free text is
  // NOT auto-tagged here: keyword matching can't tell intent direction (seek vs
  // offer) and produced wrong tags. The user adds anything else via "+ ekle";
  // real free-text understanding comes from Bedrock (AI_MODE=bedrock).
  async infer(
    _freeText: string,
    quickPicks: string[],
    taxonomy: TaxonomyItem[],
  ): Promise<InferredTag[]> {
    const valid = new Set(taxonomy.map((t) => `${t.axis}:${t.value}`));
    const seen = new Set<string>();
    const out: InferredTag[] = [];
    for (const qp of quickPicks) {
      for (const h of QUICKPICK_MAP.get(norm(qp)) ?? []) {
        const k = `${h.axis}:${h.value}`;
        if (valid.has(k) && !seen.has(k)) {
          seen.add(k);
          out.push({ axis: h.axis, value: h.value, confidence: 0.9 });
        }
      }
    }
    return out;
  }
}

export class BedrockTagInferrer implements TagInferrer {
  private client = new BedrockRuntimeClient({ region: env.BEDROCK_REGION });

  async infer(
    freeText: string,
    quickPicks: string[],
    taxonomy: TaxonomyItem[],
  ): Promise<InferredTag[]> {
    const allowed = taxonomy.map((t) => ({ axis: t.axis, value: t.value, label: t.labelTr }));
    const prompt = `Kullanıcının kendini anlattığı metinden, YALNIZCA aşağıdaki izinli etiket listesinden uygun olanları seç.
Yeni etiket UYDURMA. Yön önemlidir: "seek"=aradığı, "offer"=sunabildiği.
İzinli etiketler (JSON): ${JSON.stringify(allowed)}
Kullanıcı metni: """${freeText}"""
Hızlı seçimler: ${JSON.stringify(quickPicks)}
Sadece şu JSON şemasıyla yanıt ver: {"tags":[{"axis":"seek|offer|topic|situation","value":"<value>","confidence":0..1}]}`;

    const body = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 512,
      messages: [{ role: "user", content: [{ type: "text", text: prompt }] }],
    };
    const res = await this.client.send(
      new InvokeModelCommand({
        modelId: env.BEDROCK_MODEL_ID,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify(body),
      }),
    );
    const decoded = JSON.parse(new TextDecoder().decode(res.body));
    const text: string = decoded?.content?.[0]?.text ?? "{}";
    const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
    const allow = new Set(allowed.map((a) => `${a.axis}:${a.value}`));
    const out: InferredTag[] = (json.tags ?? [])
      .filter((t: InferredTag) => allow.has(`${t.axis}:${t.value}`))
      .map((t: InferredTag) => ({ axis: t.axis, value: t.value, confidence: t.confidence ?? 0.7 }));

    // Deterministic safety net: an explicit quick-pick must always yield its tag,
    // even if the model misses it. Merge QUICKPICK matches that are in the taxonomy.
    const have = new Set(out.map((t) => `${t.axis}:${t.value}`));
    for (const qp of quickPicks) {
      for (const h of QUICKPICK_MAP.get(norm(qp)) ?? []) {
        const k = `${h.axis}:${h.value}`;
        if (allow.has(k) && !have.has(k)) {
          have.add(k);
          out.push({ axis: h.axis, value: h.value, confidence: 0.9 });
        }
      }
    }
    return out;
  }
}

export function makeTagInferrer(): TagInferrer {
  return env.AI_MODE === "bedrock" ? new BedrockTagInferrer() : new StubTagInferrer();
}
