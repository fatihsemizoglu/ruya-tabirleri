import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { dream } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!dream || typeof dream !== "string" || dream.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Lütfen en az 10 karakter uzunluğunda bir rüya açıklaması girin." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Rüyam: ${dream}` },
          ],
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Çok fazla istek gönderildi, lütfen biraz bekleyin." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Kredi limiti doldu, lütfen daha sonra tekrar deneyin." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI servisi hatası");
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

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Dream interpretation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Bilinmeyen hata oluştu" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
