import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/auth.ts";
import { getAiApiKey } from "../_shared/ai.ts";

const AI_API_URL = Deno.env.get("AI_API_URL") || "https://api.openai.com/v1/chat/completions";
const AI_MODEL = Deno.env.get("AI_MODEL") || "gpt-4o-mini";

serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  const authResult = await requireAdmin(req);
  if (authResult instanceof Response) return authResult;

  try {
    const { title, content, currentKeywords, type } = await req.json();

    if (!AI_API_KEY) {
      throw new Error("AI_API_KEY is not configured");
    }

    const systemPrompt = type === "keywords"
      ? `Sen bir SEO ve içerik uzmanısın. Verilen rüya tabiri için en uygun anahtar kelimeleri öner.
         Kurallar:
         - 8-12 adet anahtar kelime öner
         - Türkçe anahtar kelimeler kullan
         - Tek kelime veya kısa ifadeler olsun (max 3 kelime)
         - Rüya tabiri aramaları için uygun olsun
         - Genel ve spesifik kelimeleri dengele
         JSON formatında döndür: { "keywords": ["kelime1", "kelime2", ...] }`
      : `Sen bir rüya tabiri uzmanısın. Verilen rüya tabiri ile ilişkili olabilecek diğer rüya konularını öner.
         Kurallar:
         - 5-8 adet ilişkili rüya konusu öner
         - Her öneri için kısa bir açıklama ekle (neden ilişkili olduğunu)
         - Türkçe kullan
         - Sembolik, psikolojik veya tematik bağlantılar kur
         JSON formatında döndür: { "suggestions": [{ "title": "Rüya Başlığı", "reason": "İlişki açıklaması" }, ...] }`;

    const userPrompt = type === "keywords"
      ? `Rüya Başlığı: ${title}
         Mevcut Anahtar Kelimeler: ${currentKeywords?.join(", ") || "Yok"}
         
         İçerik Özeti: ${content?.substring(0, 500) || ""}
         
         Bu rüya tabiri için SEO açısından etkili anahtar kelimeler öner.`
      : `Rüya Başlığı: ${title}
         
         İçerik: ${content?.substring(0, 800) || ""}
         
         Bu rüya tabiri ile tematik, sembolik veya psikolojik açıdan ilişkili olabilecek diğer rüya konularını öner.`;

    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return jsonResponse({ error: "Rate limit aşıldı, lütfen biraz bekleyin." }, 429);
      }
      if (response.status === 402) {
        return jsonResponse({ error: "Kredi limiti doldu, lütfen hesabınızı kontrol edin." }, 402);
      }
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API hatası: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("AI yanıtı alınamadı");
    }

    let result: Record<string, unknown>;
    try {
      result = JSON.parse(aiResponse);
    } catch {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Geçerli JSON yanıtı alınamadı");
      }
      result = JSON.parse(jsonMatch[0]);
    }

    return jsonResponse(result);
  } catch (error) {
    console.error("Content suggestions error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Bilinmeyen hata" },
      500,
    );
  }
});
