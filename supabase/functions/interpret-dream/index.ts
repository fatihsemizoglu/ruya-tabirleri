import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { getAiApiKey } from "../_shared/ai.ts";

const AI_API_URL = Deno.env.get("AI_API_URL") || "https://api.openai.com/v1/chat/completions";
const AI_MODEL = Deno.env.get("AI_MODEL") || "gpt-4o-mini";

serve(async (req) => {
  const options = handleOptions(req);
  if (options) return options;

  try {
    const authHeader = req.headers.get("Authorization");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ error: "Sunucu yapılandırması eksik" }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!userError && user) {
        userId = user.id;
      }
    }

    const { dreamId, dreamText, dreamTitle, dreamMood, includeSimilar } = await req.json();

    if (!dreamText || dreamText.length < 10) {
      return jsonResponse({ error: "Rüya metni çok kısa (en az 10 karakter)" }, 400);
    }

    const AI_API_KEY = getAiApiKey();
    if (!AI_API_KEY) {
      return jsonResponse({ error: "AI yorumlama servisi yapılandırılmamış" }, 500);
    }

    const systemPrompt = `Sen bir rüya yorumcusu ve psikolojik danışmansın.
Kullanıcının rüyasını hem İslami rüya tabiri hem de psikolojik açıdan yorumluyorsun.

Yanıtını her zaman aşağıdaki JSON formatında ver:
{
  "islamic_interpretation": "İslami kaynaklara göre rüyanın anlamı (en fazla 300 kelime, Türkçe)",
  "psychological_interpretation": "Psikolojik açıdan rüyanın anlamı (en fazla 300 kelime, Türkçe)",
  "keywords": ["ilgili1", "ilgili2", "ilgili3", "ilgili4", "ilgili5"],
  "general_meaning": "Rüyanın genel anlamı (en fazla 100 kelime, Türkçe)"
}

Kurallar:
- İslami yorumlarda Kur'an, hadis ve İslam alimlerinin görüşlerine atıfta bulun
- Psikolojik yorumlarda modern psikoloji (Freud, Jung, vb.) perspektifinden değerlendir
- Yanıtlar her zaman Türkçe ve anlaşılır olmalı
- Kesin yargılardan kaçın, olasılık bildiren ifadeler kullan
- Rüyayı küçümseme veya korkutma
- keywords en az 3, en fazla 8 anahtar kelime içermeli
- Yanıt yalnızca JSON olmalı, ek metin olmamalı`;

    const userPrompt = `Aşağıdaki rüyayı yorumla:

Başlık: ${dreamTitle || "Rüya"}
Rüya: ${dreamText}
${dreamMood ? `Rüya sırasındaki duygu durumu: ${dreamMood}` : ""}`;

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
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      return jsonResponse(
        { error: response.status === 429 ? "Çok fazla istek. Lütfen biraz bekleyin." : "AI yorumlama servisi şu anda kullanılamıyor." },
        response.status === 429 ? 429 : 502,
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return jsonResponse({ error: "AI yanıt vermedi" }, 502);
    }

    let interpretation: Record<string, unknown>;
    try {
      interpretation = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return jsonResponse({ error: "AI yanıtı işlenemedi" }, 502);
      }
      interpretation = JSON.parse(jsonMatch[0]);
    }

    if (dreamId && userId) {
      const { error: updateError } = await supabase
        .from("dream_journal")
        .update({
          ai_interpretation: interpretation,
          interpreted_at: new Date().toISOString(),
        })
        .eq("id", dreamId)
        .eq("user_id", userId);

      if (updateError) {
        console.error("Failed to save interpretation:", updateError);
      }
    }

    let similarDreams: Array<{ id: string; title: string; slug: string }> = [];
    if (includeSimilar !== false && (interpretation.keywords as string[])?.length > 0) {
      const keywords = interpretation.keywords as string[];
      const { data: similar } = await supabase
        .from("dreams")
        .select("id, title, slug")
        .eq("is_published", true)
        .contains("keywords", [keywords[0]])
        .limit(5);

      if (similar) {
        similarDreams = similar;
      }
    }

    return jsonResponse({
      ...interpretation,
      similarDreams: similarDreams.length > 0 ? similarDreams : undefined,
    });
  } catch (error) {
    console.error("interpret-dream error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Bilinmeyen hata" },
      500,
    );
  }
});
