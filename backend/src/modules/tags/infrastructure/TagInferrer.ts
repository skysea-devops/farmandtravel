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
import type { InferredTag, TagInferrer, TaxonomyItem } from "../domain/types.js";

function norm(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .replace(/[İIı]/g, "i")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "");
}

export class StubTagInferrer implements TagInferrer {
  async infer(
    freeText: string,
    quickPicks: string[],
    taxonomy: TaxonomyItem[],
  ): Promise<InferredTag[]> {
    const hay = norm([freeText, ...quickPicks].join(" "));
    const words = hay.split(/[^a-z0-9]+/).filter(Boolean);
    // Türkçe ek toleransı: kelime kökü (ilk 5 harf) önek eşleşmesi.
    const stemHit = (needle: string): boolean => {
      const n = norm(needle);
      if (n.length < 3) return false;
      if (hay.includes(n)) return true; // birebir alt dize
      const stem = n.slice(0, Math.min(n.length, 5));
      return words.some((w) => w.startsWith(stem) || stem.startsWith(w.slice(0, 5)));
    };
    const out: InferredTag[] = [];
    for (const t of taxonomy) {
      const needles = [t.value.replace(/-/g, " "), t.labelTr, ...t.synonyms];
      if (needles.some(stemHit)) out.push({ axis: t.axis, value: t.value, confidence: 0.7 });
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
    return (json.tags ?? [])
      .filter((t: InferredTag) => allow.has(`${t.axis}:${t.value}`))
      .map((t: InferredTag) => ({ axis: t.axis, value: t.value, confidence: t.confidence ?? 0.7 }));
  }
}

export function makeTagInferrer(): TagInferrer {
  return env.AI_MODE === "bedrock" ? new BedrockTagInferrer() : new StubTagInferrer();
}
