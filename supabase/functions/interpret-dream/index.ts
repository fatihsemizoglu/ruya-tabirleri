// Supabase Edge Function: AI rüya yorumlama
// Güvenlik iyileştirmeleri:
//   - Shared CORS helper kullanımı
//   - Input length limit (max 5000 karakter)
//   - In-memory rate limit (IP başına dakikada max 5 istek)
//   - Daha açıklayıcı hata mesajları

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { getAiApiKey } from "../_shared/ai.ts";

const AI_API_URL = Deno.env.get("AI_API_URL") || "https://api.openai.com/v1/chat/completions";
const AI_MODEL = Deno.env.get("AI_MODEL") || "gpt-4o-mini";
const MAX_DREAM_LENGTH = 5000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;

const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const hits = (rateLimitMap.get(key) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) return false;
  hits.push(now);
  rateLimitMap.set(key, hits);
  return true;
}

serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("cf-connecting-ip")
    ?? "unknown";

  if (!checkRateLimit(`ip:${clientIp}`)) {
    return jsonResponse(
      { error: "Çok fazla istek gönderildi. Lütfen 1 dakika sonra tekrar deneyin." },
      429,
    );
  }

  try {
    const AI_API_KEY = getAiApiKey();
    if (!AI_API_KEY) {
      return jsonResponse({ error: "AI_API_KEY yapılandırılmamış" }, 500);
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return jsonResponse({ error: "Geçersiz istek gövdesi" }, 400);
    }

    const { dream } = body as { dream?: unknown };

    if (typeof dream !== "string" || dream.trim().length < 10) {
      return jsonResponse(
        { error: "Lütfen en az 10 karakter uzunluğunda bir rüya açıklaması girin." },
        400,
      );
    }

    if (dream.length > MAX_DREAM_LENGTH) {
      return jsonResponse(
        { error: `Rüya açıklaması en fazla ${MAX_DREAM_LENGTH} karakter olabilir.` },
        400,
      );
    }

    const systemPrompt = `Sen deneyimli bir rüya tabircisisin. Hem İslami hem de psikolojik perspektiften rüya yorumları yapıyorsun.

Kullanıcının anlattığı rüyayı analiz et ve aşağıdaki JSON formatında yanıt ver:

{
  "islamic_interpretation": "İslami perspektiften detaylı rüya yorumu (en az 3-4 paragraf)",
  "psychological_interpretation": "Psikolojik perspektiften detaylı rüya yorumu (en az 3-4 paragraf)",
  "symbols": [
    { "name": "Sembol adı", "meaning": "Sembolün kısa anlamı" }
  ],
  "overall_mood": "Rüyanın genel duygu tonu (olumlu/olumsuz/nötr/karışık)",
  "advice": "Rüyayı gören kişiye kısa bir tavsiye"
}

Kurallar:
- Türkçe yanıt ver
- İslami yorumda Kuran ve hadis kaynaklarına atıfta bulun
- Psikolojik yorumda bilinçaltı, sembolizm ve duygusal analiz yap
- En az 3, en fazla 8 sembol belirle
- Yanıtı SADECE JSON formatında ver, başka bir şey ekleme`;

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
          { role: "user", content: `Rüyam: ${dream}` },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return jsonResponse(
          { error: "Çok fazla istek gönderildi, lütfen biraz bekleyin." },
          429,
        );
      }
      if (response.status === 402) {
        return jsonResponse(
          { error: "Kredi limiti doldu, lütfen daha sonra tekrar deneyin." },
          402,
        );
      }
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      return jsonResponse({ error: `AI servisi hatası: ${response.status}` }, 502);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      return jsonResponse({ error: "AI yanıtı alınamadı" }, 502);
    }

    let result: Record<string, unknown>;
    try {
      result = JSON.parse(aiResponse);
    } catch {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return jsonResponse({ error: "Geçerli JSON yanıtı alınamadı" }, 502);
      }
      result = JSON.parse(jsonMatch[0]);
    }

    return jsonResponse(result);
  } catch (error) {
    console.error("Dream interpretation error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Bilinmeyen hata oluştu" },
      500,
    );
  }
});
