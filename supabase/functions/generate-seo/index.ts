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
    const AI_API_KEY = getAiApiKey();
    if (!AI_API_KEY) {
      throw new Error("AI_API_KEY is not configured");
    }

    const { title, content, type } = await req.json();

    if (!title || !content) {
      return jsonResponse({ error: "Title and content are required" }, 400);
    }

    const contentType = type === "blog" ? "blog yazısı" : "rüya tabiri";

    const systemPrompt = `Sen bir SEO uzmanısın. Türkçe içerikler için meta başlık ve açıklama oluşturuyorsun.

Kurallar:
- Meta başlık maksimum 60 karakter olmalı
- Meta açıklama maksimum 160 karakter olmalı
- Anahtar kelimeleri doğal şekilde kullan
- Tıklanabilir ve ilgi çekici ol
- Türkçe karakterleri doğru kullan
- ${contentType} için optimize et`;

    const userPrompt = `Aşağıdaki ${contentType} için SEO meta başlık ve açıklama oluştur:

Başlık: ${title}

İçerik özeti: ${content.substring(0, 500)}...

JSON formatında yanıt ver:
{
  "meta_title": "...",
  "meta_description": "..."
}`;

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
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return jsonResponse({ error: "Rate limit exceeded. Please try again later." }, 429);
      }
      if (response.status === 402) {
        return jsonResponse({ error: "Payment required. Please add credits." }, 402);
      }
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content_response = data.choices?.[0]?.message?.content;

    if (!content_response) {
      throw new Error("No response from AI");
    }

    const seoData = JSON.parse(content_response);
    return jsonResponse(seoData);
  } catch (error) {
    console.error("generate-seo error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500,
    );
  }
});
