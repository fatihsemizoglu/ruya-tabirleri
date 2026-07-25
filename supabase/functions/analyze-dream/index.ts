import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";

const HF_API_TOKEN = Deno.env.get("VITE_HF_TOKEN") || Deno.env.get("HF_TOKEN") || "";

const MODELS = [
  { name: "microsoft/Phi-3-mini-4k-instruct", format: "phi3" },
  { name: "google/gemma-2-2b-it", format: "gemma" },
  { name: "Qwen/Qwen2.5-1.5B-Instruct", format: "qwen" },
  { name: "mistralai/Mistral-7B-Instruct-v0.2", format: "mistral" },
];

function buildPrompt(content: string, title: string | undefined, format: string): string {
  const dreamText = title ? `Başlık: ${title}\nRüya: ${content}` : `Rüya: ${content}`;
  const instruction = `Bir rüya analisti olarak aşağıdaki rüyayı analiz et. Sadece JSON çıktısı ver, başka bir metin yazma.

${dreamText}

Şu JSON yapısını kullan:
{
  "symbols": ["sembol1", "sembol2"],
  "sentiment": "positive|negative|neutral",
  "interpretation": "Türkçe psikolojik yorum (2-3 cümle)",
  "advice": "Türkçe öneri (1-2 cümle)",
  "confidence": 0.85
}`;

  switch (format) {
    case "phi3":
      return `<|system|>Sen bir rüya analisti ve psikologsun. Rüyaları Türkçe analiz ediyorsun.<|end|>\n<|user|>${instruction}<|end|>\n<|assistant|>`;
    case "gemma":
      return `<start_of_turn>user\n${instruction}<end_of_turn>\n<start_of_turn>model\n`;
    case "qwen":
      return `<|im_start|>system\nSen bir rüya analisti ve psikologsun. Rüyaları Türkçe analiz ediyorsun.<|im_end|>\n<|im_start|>user\n${instruction}<|im_end|>\n<|im_start|>assistant\n`;
    case "mistral":
      return `<s>[INST] ${instruction} [/INST]`;
    default:
      return instruction;
  }
}

function keywordAnalysis(content: string): { symbols: string[]; sentiment: string; interpretation: string; advice: string; confidence: number } {
  const lower = content.toLowerCase();
  const knownSymbols: [string, string[]][] = [
    ["yılan", ["yılan", "yılanlar", "serpent"]],
    ["su", ["su", "deniz", "nehir", "göl", "akarsu"]],
    ["uçmak", ["uçmak", "uçuyor", "ucmak"]],
    ["ölüm", ["ölüm", "ölü", "ölen"]],
    ["bebek", ["bebek", "çocuk", "küçük"]],
    ["ev", ["ev", "evin", "eve"]],
    ["para", ["para", "altın", "zengin"]],
    ["karanlık", ["karanlık", "gece", "korku"]],
    ["aile", ["anne", "baba", "aile", "kardeş"]],
  ];

  const symbols: string[] = [];
  for (const [name, keywords] of knownSymbols) {
    if (keywords.some((k) => lower.includes(k))) {
      symbols.push(name);
    }
  }

  const positiveWords = ["mutlu", "güzel", "harika", "iyi", "sevgi", "huzur", "başarı", "para", "altın"];
  const negativeWords = ["korku", "kötü", "ölüm", "karanlık", "düşman", "kayıp", "ağlıyor", "üzgün"];

  let score = 0;
  for (const w of positiveWords) if (lower.includes(w)) score++;
  for (const w of negativeWords) if (lower.includes(w)) score--;

  const sentiment = score > 0 ? "positive" : score < 0 ? "negative" : "neutral";

  const interpretations: Record<string, string> = {
    yılan: "Yılan, genellikle bilinçaltındaki gizli korkuları veya dönüşümü temsil eder.",
    su: "Su, duygusal durumunuzu yansıtır. Sakin su huzuru, dalgalı su ise iç çatışmayı simgeler.",
    uçmak: "Uçmak, özgürlük ve hedeflere ulaşma arzusunu gösterir.",
    ölüm: "Ölüm rüyaları genellikle bir dönemin kapanıp yenisinin başlayacağına işarettir.",
    bebek: "Bebek, yeni başlangıçları ve masumiyeti temsil eder.",
    ev: "Ev, kişinin iç dünyasını ve güven alanını simgeler.",
    para: "Para, özgüven ve değer duygusuyla ilgilidir.",
    karanlık: "Karanlık, bilinmeyen korkuları ve belirsizliği temsil eder.",
    aile: "Aile, aidiyet ve güven ihtiyacını yansıtır.",
  };

  const foundInterpretations = symbols.map((s) => interpretations[s] || "").filter(Boolean);
  const interpretation = foundInterpretations.length > 0
    ? foundInterpretations.join(" ") + " Bu semboller rüyanızın ana temalarını oluşturuyor."
    : "Bu rüya bilinçaltınızın size bir mesajı olabilir. Daha detaylı bir analiz için rüyanızın bağlamını genişletebilirsiniz.";

  const advice = score <= 0
    ? "Bu rüya size içsel bir dönüşüm zamanının geldiğini hatırlatıyor olabilir. Günlük hayatınızda sizi rahatsız eden konulara odaklanmanız faydalı olacaktır."
    : "Olumlu bir rüya deneyimi yaşadınız. Bu enerjiyi günlük hayatınıza taşıyarak daha verimli bir gün geçirebilirsiniz.";

  return { symbols: symbols.length > 0 ? symbols : ["genel"], sentiment, interpretation, advice, confidence: 0.6 };
}

serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const { content, title } = await req.json();

    if (!content) {
      return jsonResponse({ error: "Dream content is required" }, 400);
    }

    if (!HF_API_TOKEN) {
      const fallback = keywordAnalysis(content);
      return jsonResponse({ ...fallback, note: "AI token yapılandırılmamış, anahtar kelime bazlı analiz yapıldı" });
    }

    let lastError: string | null = null;

    for (const model of MODELS) {
      try {
        const prompt = buildPrompt(content, title, model.format);

        const response = await fetch(
          `https://api-inference.huggingface.co/models/${model.name}`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${HF_API_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              inputs: prompt,
              parameters: {
                max_new_tokens: 700,
                temperature: 0.7,
                return_full_text: false,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          lastError = `${model.name}: ${response.status} - ${errorText}`;
          continue;
        }

        const data = await response.json();
        const generatedText = data[0]?.generated_text || "";

        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const result = JSON.parse(jsonMatch[0]);
            return jsonResponse(result);
          } catch {
            lastError = `${model.name}: JSON parse failed`;
            continue;
          }
        }

        if (generatedText) {
          return jsonResponse({
            symbols: [],
            sentiment: "neutral",
            interpretation: generatedText,
            advice: "",
            confidence: 0.5,
          });
        }

        lastError = `${model.name}: empty response`;
      } catch (e) {
        lastError = `${model.name}: ${e instanceof Error ? e.message : "unknown error"}`;
        continue;
      }
    }

    const fallback = keywordAnalysis(content);
    return jsonResponse({
      ...fallback,
      note: `AI modelleri yanıt vermedi (${lastError}), anahtar kelime bazlı analiz yapıldı`,
    });
  } catch (error) {
    console.error("analyze-dream error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
